import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import crypto from "crypto";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("image") as File;

        if (!file) {
            return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Define the uploads directory
        const uploadDir = join(process.cwd(), "public", "uploads");
        
        // Ensure the directory exists
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (e) {
            // Already exists or other error
        }

        // Generate a unique filename
        const filename = `${crypto.randomUUID()}-${file.name.replace(/\s+/g, "-")}`;
        const path = join(uploadDir, filename);

        // Write the file
        await writeFile(path, buffer);
        
        // Return the public URL via the API route
        const url = `/api/files/${filename}`;

        return NextResponse.json({
            success: true,
            data: {
                url: url
            }
        });
    } catch (error: any) {
        console.error("Upload API error:", error);
        return NextResponse.json({ success: false, error: error.message || "Failed to upload file" }, { status: 500 });
    }
}
