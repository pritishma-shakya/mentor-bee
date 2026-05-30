import { pgPool } from "../config/database";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const main = async () => {
  const args = process.argv.slice(2);
  const name = args[0] || "System Admin";
  const email = args[1] || "admin@mentorbee.com";
  const password = args[2] || "MentorBee@123!";

  if (!email || !password || !name) {
    console.error("Usage: npx tsx scripts/createAdmin.ts <name> <email> <password>");
    process.exit(1);
  }

  console.log("Preparing to insert admin account:");
  console.log(`- Name: ${name}`);
  console.log(`- Email: ${email}`);

  const client = await pgPool.connect();
  try {
    const { rows: existing } = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existing.length > 0) {
      console.error(`Error: User with email '${email}' already exists.`);
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const { rows } = await client.query(
      `INSERT INTO users (email, password, name, role, is_verified, terms_accepted_at)
       VALUES ($1, $2, $3, 'admin', true, NOW())
       RETURNING id, name, email, role`,
      [email, hashedPassword, name]
    );

    console.log("\n🎉 Admin user created successfully!");
    console.log(`- ID: ${rows[0].id}`);
    console.log(`- Name: ${rows[0].name}`);
    console.log(`- Email: ${rows[0].email}`);
    console.log(`- Role: ${rows[0].role}`);
  } catch (err: any) {
    console.error("Failed to create admin:", err.message);
  } finally {
    client.release();
    await pgPool.end();
  }
};

main();
