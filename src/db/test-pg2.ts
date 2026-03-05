import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function directTest2() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });

    try {
        const res = await pool.query(`insert into "outlets" ("name") values ('YAP Cafe'), ('Seken'), ('Soragan'), ('Kusumanegara'), ('Batikan'), ('Kael'), ('UNY'), ('Emma'), ('Nusantara') RETURNING *;`);
        console.log("Success:", res.rows);
    } catch (e) {
        console.error("PG ERROR FULL:", e);
    } finally {
        await pool.end();
    }
}

directTest2();
