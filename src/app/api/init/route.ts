import { NextResponse } from "next/server";
import { runMigrations } from "@/lib/migrate";

export const dynamic = "force-dynamic";

let initInProgress = false;

export async function GET() {
    if (initInProgress) {
        return NextResponse.json({ status: "initialization_in_progress" });
    }

    initInProgress = true;

    try {
        await runMigrations();
        return NextResponse.json({ status: "success", message: "Database initialized" });
    } catch (error: any) {
        return NextResponse.json(
            { status: "error", message: error?.message || "Initialization failed" },
            { status: 500 }
        );
    } finally {
        initInProgress = false;
    }
}
