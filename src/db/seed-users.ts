import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const USERS = [
    { name: "Admin Dapoer Roema", email: "admin@test.app", password: "Password123!", role: "admin" },
    { name: "Baker Dapoer Roema", email: "baker@test.app", password: "Password123!", role: "baker" },
    { name: "Runner Dapoer Roema", email: "runner@test.app", password: "Password123!", role: "runner" },
    { name: "User Dapoer Roema", email: "user@test.app", password: "Password123!", role: "user" },
];

async function seedUsers() {
    const { auth } = await import("../lib/auth");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    console.log("Resetting auth tables...");
    try {
        await pool.query('TRUNCATE TABLE "session", "account", "verification", "user" CASCADE');
        console.log("✓ Auth tables reset.");
    } catch (e: any) {
        console.error("✗ Failed to reset tables:", e.message);
    }

    console.log("Seeding standardized users...");
    const outletsRes = await pool.query(`SELECT id FROM outlets LIMIT 1`);
    const defaultOutletId = outletsRes.rows[0]?.id || null;

    for (const u of USERS) {
        try {
            console.log(`Creating: ${u.email}...`);
            // Better Auth signUpEmail body should not contain 'role' if it's not and inputtable additional field
            // The admin plugin adds row, but usually you promote users to roles.
            const result = await auth.api.signUpEmail({
                body: {
                    name: u.name,
                    email: u.email,
                    password: u.password,
                },
            });

            if (result) {
                // Update role and currentOutletId field directly
                await pool.query(
                    `UPDATE "user" SET role = $1, "current_outlet_id" = $2 WHERE email = $3`,
                    [u.role, defaultOutletId, u.email]
                );
                console.log(`✓ Seeded: ${u.email} (${u.role})`);
            } else {
                console.error(`✗ Failed to create ${u.email}: No result returned.`);
            }
        } catch (e: any) {
            console.error(`✗ Failed to create ${u.email}:`, e?.message || e);
        }
    }

    await pool.end();
    console.log("Reseed sequence finished.");
    process.exit(0);
}

seedUsers().catch((e) => {
    console.error("Seed script fatal error:", e);
    process.exit(1);
});
