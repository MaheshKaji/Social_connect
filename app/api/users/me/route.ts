import { supabase } from "@/lib/supabase";
import { getUserFromToken } from "@/lib/getUser";
import { NextResponse } from "next/server";

export async function PUT(req: Request) {
    const user = await getUserFromToken(req);

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bio, avatar_url, website, location, first_name, last_name } = body;

    // Validation
    if (bio && bio.length > 160) {
        return NextResponse.json(
            { error: "Bio must be max 160 characters" },
            { status: 400 }
        );
    }

    const { data, error } = await supabase
        .from("users")
        .update({ bio, avatar_url, website, location, first_name, last_name })
        .eq("id", user.id)
        .select("id, username, email, first_name, last_name, bio, avatar_url, website, location, created_at")
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ user: data });
}