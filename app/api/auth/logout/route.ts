import { NextResponse } from "next/server";

export async function POST(req: Request) {
    // Since we're using JWT, logout is handled client-side
    // We just return a success response
    return NextResponse.json(
        { message: "Logged out successfully" },
        { status: 200 }
    );
}