import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const USERS = [
    { name: "Admin User", email: "admin@orbery.local", password: "admin123", role: "admin" },
    { name: "Baker User", email: "baker@orbery.local", password: "baker123", role: "baker" },
    { name: "Driver User", email: "driver@orbery.local", password: "driver123", role: "driver" },
    { name: "Owner User", email: "owner@orbery.local", password: "owner123", role: "owner" },
];

async function seedUsers() {
    const { auth } = await import("../lib/auth");

    console.log("Seeding users via Better Auth...");

    for (const u of USERS) {
        try {
            const result = await auth.api.signUpEmail({
                body: {
                    name: u.name,
                    email: u.email,
                    password: u.password,
                    role: u.role,
                },
            });
            if (result) {
                console.log(`✓ Created: ${u.email} (${u.role})`);
                // Update role field directly since better-auth may not apply additionalFields on signUp
                const pool = new Pool({ connectionString: process.env.DATABASE_URL });
                await pool.query(`UPDATE "user" SET role = $1 WHERE email = $2`, [u.role, u.email]);
                await pool.end();
            }
        } catch (e: any) {
            if (e?.message?.includes("already exists") || e?.message?.includes("unique")) {
                console.log(`- Skipped (exists): ${u.email}`);
            } else {
                console.error(`✗ Failed to create ${u.email}:`, e?.message);
            }
        }
    }

    console.log("Done.");
    process.exit(0);
}

seedUsers().catch((e) => {
    console.error(e);
    process.exit(1);
});
