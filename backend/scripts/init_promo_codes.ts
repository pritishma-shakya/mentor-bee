import { pgPool } from "../config/database";

async function initPromoCodesTable() {
    const client = await pgPool.connect();
    try {
        console.log("Creating promo_codes table...");
        await client.query(`
            CREATE TABLE IF NOT EXISTS promo_codes (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                code VARCHAR(50) UNIQUE NOT NULL,
                discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
                discount_value DECIMAL(10, 2) NOT NULL,
                mentor_id UUID REFERENCES users(id),
                created_by UUID NOT NULL REFERENCES users(id),
                status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
                expiry_date TIMESTAMP,
                usage_limit INTEGER,
                usage_count INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log("promo_codes table created successfully.");

        console.log("Updating payments table to include promo_code_id and discount_amount...");
        await client.query(`
            ALTER TABLE payments 
            ADD COLUMN IF NOT EXISTS promo_code_id UUID REFERENCES promo_codes(id),
            ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;
        `);
        console.log("Payments table updated successfully.");

    } catch (err) {
        console.error("Error initializing promo codes:", err);
    } finally {
        client.release();
        process.exit();
    }
}

initPromoCodesTable();
