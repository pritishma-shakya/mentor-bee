import { pgPool } from "../config/database";

async function addDescriptionColumn() {
    const client = await pgPool.connect();
    try {
        console.log("Adding description column to promo_codes table...");
        await client.query(`
            ALTER TABLE promo_codes 
            ADD COLUMN IF NOT EXISTS description TEXT;
        `);
        console.log("Column added successfully.");
    } catch (err) {
        console.error("Error adding description column:", err);
    } finally {
        client.release();
        process.exit();
    }
}

addDescriptionColumn();
