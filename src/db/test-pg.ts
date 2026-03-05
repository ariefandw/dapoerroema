import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function directTest() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });

    try {
        const res = await pool.query("INSERT INTO outlets (name) VALUES ('YAP test') RETURNING *;");
        console.log("Success:", res.rows);
    } catch (e) {
        console.error("PG ERROR:", e);
    } finally {
        await pool.end();
    }
}

directTest();
