import { supabase } from "@/lib/supabase";
import { getUserFromToken } from "@/lib/getUser";
import { NextResponse } from "next/server";

export async function POST(
    req: Request,
    context: { params: Promise<{ userId: string }> }
) {
    const user = await getUserFromToken(req);

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await context.params;

    // 🚫 Can't follow yourself
    if (String(user.id) === String(userId)) {
        return NextResponse.json(
            { error: "You cannot follow yourself" },
            { status: 400 }
        );
    }

    // 🔍 Check if user exists
    const { data: targetUser, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("id", userId)
        .single();

    if (userError || !targetUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ➕ Follow
    const { error } = await supabase
        .from("follows")
        .insert([{ follower_id: user.id, following_id: userId }]);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "User followed successfully" });
}

export async function DELETE(
    req: Request,
    context: { params: Promise<{ userId: string }> }
) {
    const user = await getUserFromToken(req);

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await context.params;

    // ➖ Unfollow
    const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", userId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "User unfollowed successfully" });
}