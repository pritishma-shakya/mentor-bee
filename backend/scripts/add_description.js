const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function run() {
  try {
    console.log('Adding description column to promo_codes...');
    await pool.query('ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS description TEXT');
    console.log('Successfully added description column.');
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await pool.end();
    process.exit();
  }
}

run();
