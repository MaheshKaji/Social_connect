import { supabase } from "@/lib/supabase";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, username, password, first_name, last_name } = body;

        // 🔍 Validation
        if (!email || !username || !password) {
            return NextResponse.json(
                { error: "Email, username, and password are required" },
                { status: 400 }
            );
        }

        if (username.length < 3 || username.length > 30) {
            return NextResponse.json(
                { error: "Username must be 3-30 characters" },
                { status: 400 }
            );
        }

        // validate alphanumeric + underscore only
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return NextResponse.json(
                { error: "Username can only contain letters, numbers and underscores" },
                { status: 400 }
            );
        }

        // 🔐 Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 📦 Insert into database
        const { data, error } = await supabase
            .from("users")
            .insert([
                {
                    email,
                    username,
                    password: hashedPassword,
                    first_name: first_name || null,
                    last_name: last_name || null,
                },
            ])
            .select("id, email, username, first_name, last_name, created_at")
            .single();

        if (error) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json({
            message: "User registered successfully",
            user: data,
        });
    } catch (err) {
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}