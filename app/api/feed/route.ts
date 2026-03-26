import { supabase } from "@/lib/supabase";
import { getUserFromToken } from "@/lib/getUser";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    // 1. Get the logged-in user
    const user = await getUserFromToken(req);

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase.from("posts").select("*", { count: "exact" });

    // 2. If user is logged in, filter the feed!
    if (user) {
        // Find everyone this user follows
        const { data: follows } = await supabase
            .from("follows")
            .select("following_id")
            .eq("follower_id", user.id);

        const followingIds = follows?.map(f => f.following_id) || [];

        // Include the user's own ID so they can see their own posts
        followingIds.push(user.id);

        // Only fetch posts where the author is in that list
        query = query.in("author_id", followingIds);
    }

    const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

    if (error && error.code === "PGRST103") {
        return NextResponse.json({
            posts: [],
            pagination: { page, limit, total: count ?? 0, hasMore: false },
        });
    }

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        posts: data,
        pagination: { page, limit, total: count, hasMore: to < (count ?? 0) - 1 },
    });
}