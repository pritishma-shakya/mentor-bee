import { pgPool } from "../config/database";

async function migrate() {
    const client = await pgPool.connect();
    try {
        await client.query(`
            ALTER TABLE sessions 
            ADD COLUMN IF NOT EXISTS reschedule_requested_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS rescheduled_date DATE,
            ADD COLUMN IF NOT EXISTS rescheduled_time TIME,
            ADD COLUMN IF NOT EXISTS reschedule_requested_by UUID,
            ADD COLUMN IF NOT EXISTS cancel_requested_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS cancel_requested_by UUID;
        `);
        console.log("Migration successful");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        client.release();
        await pgPool.end();
    }
}

migrate();
