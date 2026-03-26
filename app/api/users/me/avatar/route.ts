import { supabase } from "@/lib/supabase";
import { getUserFromToken } from "@/lib/getUser";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const user = await getUserFromToken(req);

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("avatar") as File;

        console.log("file:", file); // 👈 debug

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        console.log("file type:", file.type); // 👈 debug
        console.log("file size:", file.size); // 👈 debug

        // 🔍 Validate file type
        if (!["image/jpeg", "image/png"].includes(file.type)) {
            return NextResponse.json(
                { error: "Only JPEG and PNG files are allowed" },
                { status: 400 }
            );
        }

        // 🔍 Validate file size (2MB)
        if (file.size > 2 * 1024 * 1024) {
            return NextResponse.json(
                { error: "File size must be less than 2MB" },
                { status: 400 }
            );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const fileName = `${user.id}-${Date.now()}.${file.type === "image/jpeg" ? "jpg" : "png"}`;

        console.log("uploading file:", fileName); // 👈 debug

        const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: true,
            });

        console.log("uploadError:", uploadError); // 👈 debug

        if (uploadError) {
            return NextResponse.json({ error: uploadError.message }, { status: 500 });
        }

        const { data: urlData } = supabase.storage
            .from("avatars")
            .getPublicUrl(fileName);

        const avatar_url = urlData.publicUrl;

        console.log("avatar_url:", avatar_url); // 👈 debug

        const { data, error } = await supabase
            .from("users")
            .update({ avatar_url })
            .eq("id", user.id)
            .select("id, username, email, avatar_url")
            .single();

        console.log("update error:", error); // 👈 debug

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ user: data });

    } catch (err) {
        console.error("Avatar upload error:", err); // 👈 debug
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}