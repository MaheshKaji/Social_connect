import { supabase } from "@/lib/supabase";
import { getUserFromToken } from "@/lib/getUser";
import { NextResponse } from "next/server";

// Add a Like
export async function POST(
    req: Request,
    context: { params: Promise<{ postId: string }> }
) {
    const user = await getUserFromToken(req);
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await context.params;

    // Step 1: Insert like into the likes table
    const { error: insertError } = await supabase
        .from("likes")
        .insert([{ user_id: user.id, post_id: postId }]);

    // If there's an error (e.g., they already liked it), return it
    if (insertError) {
        // Code 23505 is a unique violation (already liked)
        if (insertError.code === '23505') {
            return NextResponse.json({ message: "Already liked" }, { status: 200 });
        }
        return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Step 2: Fetch post to get current like_count
    const { data: post, error: fetchError } = await supabase
        .from("posts")
        .select("like_count")
        .eq("id", postId)
        .single();

    if (fetchError || !post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Step 3: Increment like_count on the post
    const { error: updateError } = await supabase
        .from("posts")
        .update({ like_count: post.like_count + 1 })
        .eq("id", postId);

    if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Post liked successfully" });
}

// Remove a Like
export async function DELETE(
    req: Request,
    context: { params: Promise<{ postId: string }> }
) {
    const user = await getUserFromToken(req);
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await context.params;

    // Step 1: Delete like
    const { error: deleteError } = await supabase
        .from("likes")
        .delete()
        .eq("user_id", user.id)
        .eq("post_id", postId);

    if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Step 2: Fetch post
    const { data: post, error: fetchError } = await supabase
        .from("posts")
        .select("like_count")
        .eq("id", postId)
        .single();

    if (fetchError || !post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Step 3: Update like_count (decrementing, but ensuring it doesn't go below 0)
    const { error: updateError } = await supabase
        .from("posts")
        .update({ like_count: Math.max(0, post.like_count - 1) })
        .eq("id", postId);

    if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Like removed" });
}