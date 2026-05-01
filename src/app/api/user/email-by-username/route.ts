import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        const username = req.nextUrl.searchParams.get("username");
        if (!username) {
            return NextResponse.json({ error: "Username required" }, { status: 400 });
        }

        const foundUser = await db.query.user.findFirst({
            where: eq(user.username, username),
            columns: { email: true },
        });

        if (!foundUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ email: foundUser.email });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
