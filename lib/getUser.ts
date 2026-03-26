import jwt from "jsonwebtoken";
import { supabase } from "./supabase";

export async function getUserFromToken(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");
        console.log("Authorization Header:", authHeader);

        if (!authHeader) return null;

        const token = authHeader.split(" ")[1];
        console.log("Extracted Token:", token);

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
            userId: string;
        };
        console.log("Decoded Token:", decoded);

        const { data: user, error } = await supabase
            .from("users")
            .select("*")
            .eq("id", decoded.userId)
            .single();

        if (error) return null;

        return user;
    } catch (err) {
        console.error("Error in getUserFromToken:", err);
        return null;
    }
}