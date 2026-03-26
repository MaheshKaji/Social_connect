import { supabase } from "@/lib/supabase";
import bcrypt from "bcrypt";
import { generateToken } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, username, password } = body;

        if (!password || (!email && !username)) {
            return NextResponse.json(
                { error: "Password and email or username are required" },
                { status: 400 }
            );
        }

        // 🔍 Find user by email OR username
        let query = supabase.from("users").select("*");

        if (email) {
            query = query.eq("email", email);
        } else {
            query = query.eq("username", username);
        }

        const { data: user, error } = await query.single();

        if (!user || error) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // 🔐 Check password
        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            return NextResponse.json({ error: "Invalid password" }, { status: 401 });
        }

        // 📅 Track last login
        await supabase
            .from("users")
            .update({ last_login: new Date().toISOString() })
            .eq("id", user.id);

        const token = generateToken(user.id);

        return NextResponse.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                first_name: user.first_name,
                last_name: user.last_name,
                bio: user.bio,
                avatar_url: user.avatar_url,
            },
        });
    } catch (err) {
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}