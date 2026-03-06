import { pgPool } from "../config/database";

async function inspectTable() {
    try {
        const { rows } = await pgPool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'sessions'
        `);
        console.log(JSON.stringify(rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pgPool.end();
    }
}

inspectTable();
