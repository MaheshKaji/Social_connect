import { supabase } from "@/lib/supabase";
import { getUserFromToken } from "@/lib/getUser";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    context: { params: Promise<{ postId: string }> }
) {
    const { postId } = await context.params;

    const { data: post, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", postId)
        .single();

    if (error || !post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ post });
}

export async function PUT(
    req: Request,
    context: { params: Promise<{ postId: string }> }
) {
    const user = await getUserFromToken(req);

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await context.params;

    // 🔍 Fetch post
    const { data: post, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", postId)
        .single();

    if (error || !post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // 🔐 Ownership check
    if (String(post.author_id) !== String(user.id)) {
        return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    const body = await req.json();
    const { content, image_url } = body;

    // Validation
    if (!content || content.length > 280) {
        return NextResponse.json(
            { error: "Content must be 1-280 characters" },
            { status: 400 }
        );
    }

    const { data: updatedPost, error: updateError } = await supabase
        .from("posts")
        .update({ content, image_url })
        .eq("id", postId)
        .select()
        .single();

    if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ post: updatedPost });
}

export async function DELETE(
    req: Request,
    context: { params: Promise<{ postId: string }> }
) {
    const user = await getUserFromToken(req);

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await context.params;

    const { data: post, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", postId)
        .single();

    if (error || !post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (String(post.author_id) !== String(user.id)) {
        return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    const { error: deleteError } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId);

    if (deleteError) {
        return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Post deleted" });
}