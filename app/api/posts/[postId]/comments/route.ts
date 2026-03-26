import { supabase } from "@/lib/supabase";
import { getUserFromToken } from "@/lib/getUser";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    context: { params: Promise<{ postId: string }> }
) {
    const { postId } = await context.params;

    const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

export async function POST(
    req: Request,
    context: { params: Promise<{ postId: string }> }
) {
    const user = await getUserFromToken(req);

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await context.params;
    const body = await req.json();
    const { content } = body;

    if (!content) {
        return NextResponse.json(
            { error: "Content is required" },
            { status: 400 }
        );
    }

    // 📝 Insert comment
    const { data, error } = await supabase
        .from("comments")
        .insert([{ content, post_id: postId, user_id: user.id }])
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 🔢 Increment comment_count
    const { data: post } = await supabase
        .from("posts")
        .select("comment_count")
        .eq("id", postId)
        .single();

    await supabase
        .from("posts")
        .update({ comment_count: (post?.comment_count ?? 0) + 1 })
        .eq("id", postId);

    return NextResponse.json(data);
}