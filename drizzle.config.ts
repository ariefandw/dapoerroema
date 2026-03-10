import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

import * as fs from "fs";

if (fs.existsSync(".env.local")) {
    dotenv.config({ path: ".env.local" });
}

export default defineConfig({
    schema: "./src/db/schema.ts",
    out: "./src/db/migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
    verbose: true,
    strict: true,
});
