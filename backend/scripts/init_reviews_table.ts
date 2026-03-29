import { pgPool } from "../config/database";

async function initReviewsTable() {
    const client = await pgPool.connect();
    try {
        console.log("Creating reviews table...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS reviews (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                session_id UUID NOT NULL REFERENCES sessions(id) UNIQUE,
                student_id UUID NOT NULL REFERENCES users(id),
                mentor_id UUID NOT NULL REFERENCES mentors(id),
                rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
                comment TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log("Reviews table created successfully.");
    } catch (err) {
        console.error("Error creating reviews table:", err);
    } finally {
        client.release();
        process.exit();
    }
}

initReviewsTable();
