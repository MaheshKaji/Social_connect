import { getUserFromToken } from "@/lib/getUser";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const user = await getUserFromToken(req);

    if (!user) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    return NextResponse.json({ user });
}