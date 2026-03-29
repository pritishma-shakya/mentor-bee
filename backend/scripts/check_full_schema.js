const { Pool } = require("pg");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const pgPool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function checkSchema() {
    const client = await pgPool.connect();
    try {
        const { rows } = await client.query(`
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name IN ('sessions', 'schedules', 'payments')
            ORDER BY table_name, ordinal_position
        `);
        console.log(JSON.stringify(rows, null, 2));
    } catch (err) {
        console.error("Error checking schema:", err);
    } finally {
        client.release();
        process.exit();
    }
}

checkSchema();
