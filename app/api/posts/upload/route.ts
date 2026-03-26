import { supabase } from "@/lib/supabase";
import { getUserFromToken } from "@/lib/getUser";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        // 1. Authenticate the user
        const user = await getUserFromToken(req);

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Extract the file from FormData
        const formData = await req.formData();
        const file = formData.get("image") as File;

        if (!file) {
            return NextResponse.json({ error: "No image file provided" }, { status: 400 });
        }

        // 3. Validate file type (JPEG/PNG only as per requirements)
        if (!["image/jpeg", "image/png"].includes(file.type)) {
            return NextResponse.json(
                { error: "Only JPEG and PNG files are allowed" },
                { status: 400 }
            );
        }

        // 4. Validate file size (Max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            return NextResponse.json(
                { error: "File size must be less than 2MB" },
                { status: 400 }
            );
        }

        // 5. Convert file to buffer for Supabase upload
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generate a unique filename using user ID and timestamp
        const extension = file.type === "image/jpeg" ? "jpg" : "png";
        const fileName = `${user.id}-${Date.now()}.${extension}`;

        // 6. Upload to Supabase Storage (Bucket name: "posts")
        const { error: uploadError } = await supabase.storage
            .from("posts")
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) {
            console.error("Supabase upload error:", uploadError);
            return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
        }

        // 7. Get the public URL for the uploaded image
        const { data: urlData } = supabase.storage
            .from("posts")
            .getPublicUrl(fileName);

        return NextResponse.json({
            message: "Image uploaded successfully",
            image_url: urlData.publicUrl
        });

    } catch (err) {
        console.error("Post image upload error:", err);
        return NextResponse.json({ error: "Something went wrong during upload" }, { status: 500 });
    }
}