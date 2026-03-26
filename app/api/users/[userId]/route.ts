import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    context: { params: Promise<{ userId: string }> }
) {
    const params = await context.params;
    const userId = params.userId;

    const { data: user, error } = await supabase
        .from("users")
        .select("id, username, email, first_name, last_name, bio, avatar_url, website, location, created_at")
        .eq("id", userId)
        .single();

    if (error || !user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { count } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("author_id", userId);

    return NextResponse.json({
        user: {
            ...user,
            posts_count: count ?? 0,
        },
    });
}