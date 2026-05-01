import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { user, account } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const username = req.nextUrl.searchParams.get("username") || "customer_user";
    const password = req.nextUrl.searchParams.get("password") || "Password123!";

    // 1. Find user by username
    const foundUser = await db.query.user.findFirst({
      where: eq(user.username, username),
    });

    if (!foundUser) {
      return NextResponse.json({ error: "User not found", username });
    }

    // 2. Find account
    const foundAccount = await db.query.account.findFirst({
      where: eq(account.userId, foundUser.id),
    });

    if (!foundAccount || !foundAccount.password) {
      return NextResponse.json({ error: "No password found", user: foundUser });
    }

    return NextResponse.json({
      user: {
        id: foundUser.id,
        email: foundUser.email,
        username: foundUser.username,
      },
      account: {
        passwordLength: foundAccount.password.length,
        passwordPrefix: foundAccount.password.substring(0, 40),
        passwordFull: foundAccount.password,
      },
      message: "User found. To test login, use the frontend.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack });
  }
}
