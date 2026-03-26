import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    context: { params: Promise<{ userId: string }> }
) {
    const { userId } = await context.params;

    const { data, error } = await supabase
        .from("follows")
        .select("following_id, users!follows_following_id_fkey(id, username, email, bio, avatar_url)")
        .eq("follower_id", userId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ following: data });
}