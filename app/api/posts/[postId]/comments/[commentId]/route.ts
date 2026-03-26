import { supabase } from "@/lib/supabase";
import { getUserFromToken } from "@/lib/getUser";
import { NextResponse } from "next/server";

export async function DELETE(
    req: Request,
    context: { params: Promise<{ postId: string; commentId: string }> }
) {
    const user = await getUserFromToken(req);

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId, commentId } = await context.params;

    // 🔍 Fetch comment
    const { data: comment, error } = await supabase
        .from("comments")
        .select("*")
        .eq("id", commentId)
        .single();

    if (error || !comment) {
        return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // 🔐 Ownership check
    if (String(comment.user_id) !== String(user.id)) {
        return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    // 🗑️ Delete comment
    const { error: deleteError } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);

    if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    // 🔢 Decrement comment_count
    const { data: post } = await supabase
        .from("posts")
        .select("comment_count")
        .eq("id", postId)
        .single();

    await supabase
        .from("posts")
        .update({ comment_count: Math.max(0, (post?.comment_count ?? 0) - 1) })
        .eq("id", postId);

    return NextResponse.json({ message: "Comment deleted" });
}