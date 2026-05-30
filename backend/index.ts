import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import http from "http";
import { Server } from "socket.io";

// Routes
import authRoutes from "./routes/authRoutes";
import mentorRoutes from "./routes/mentorRoutes";
import studentRoutes from "./routes/studentRoutes";
import adminRoutes from "./routes/adminRoutes";
import communityRoutes from "./routes/communityRoutes";
import messageRoutes from "./routes/messageRoutes";
import scheduleRoutes from "./routes/scheduleRoutes";
import sessionRoutes from "./routes/sessionRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import reviewRoutes from "./routes/reviewRoutes";
import promoCodeRoutes from "./routes/promoCodeRoutes";
import reportRoutes from "./routes/reportRoutes";
import refundRoutes from "./routes/refundRoutes";

// Socket
import { initSocket } from "./socket";
import { startReminderService } from "./utils/reminderService";
import { pgPool } from "./config/database";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure schema is up to date (Migration)
pgPool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0").catch(err => {
  console.error("Migration error (points column):", err);
});
pgPool.query("ALTER TABLE reports ADD COLUMN IF NOT EXISTS evidence_url TEXT").catch(err => {
  console.error("Migration error (evidence column):", err);
});
pgPool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'").catch(err => {
  console.error("Migration error (user status column):", err);
});
pgPool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token TEXT").catch(err => {
  console.error("Migration error (password reset token column):", err);
});
pgPool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires_at TIMESTAMPTZ").catch(err => {
  console.error("Migration error (password reset expiry column):", err);
});
pgPool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ").catch(err => {
  console.error("Migration error (terms accepted column):", err);
});
pgPool.query(`
  CREATE TABLE IF NOT EXISTS refunds (
    id SERIAL PRIMARY KEY,
    session_id TEXT UNIQUE NOT NULL,
    payment_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    refund_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    percentage INTEGER NOT NULL DEFAULT 0,
    refund_percentage INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'not_eligible',
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`).catch(err => {
  console.error("Migration error (refunds table):", err);
});
pgPool.query("ALTER TABLE refunds ADD COLUMN IF NOT EXISTS session_id TEXT").catch(err => {
  console.error("Migration error (refunds session_id column):", err);
});
pgPool.query("ALTER TABLE refunds ADD COLUMN IF NOT EXISTS payment_id TEXT").catch(err => {
  console.error("Migration error (refunds payment_id column):", err);
});
pgPool.query("ALTER TABLE refunds ADD COLUMN IF NOT EXISTS student_id TEXT").catch(err => {
  console.error("Migration error (refunds student_id column):", err);
});
pgPool.query("ALTER TABLE refunds ADD COLUMN IF NOT EXISTS amount NUMERIC(10, 2) NOT NULL DEFAULT 0").catch(err => {
  console.error("Migration error (legacy refunds amount column add):", err);
});
pgPool.query("ALTER TABLE refunds ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(10, 2) NOT NULL DEFAULT 0").catch(err => {
  console.error("Migration error (refunds refund_amount column):", err);
});
pgPool.query("ALTER TABLE refunds ADD COLUMN IF NOT EXISTS percentage INTEGER NOT NULL DEFAULT 0").catch(err => {
  console.error("Migration error (legacy refunds percentage column add):", err);
});
pgPool.query("ALTER TABLE refunds ADD COLUMN IF NOT EXISTS refund_percentage INTEGER NOT NULL DEFAULT 0").catch(err => {
  console.error("Migration error (refunds refund_percentage column):", err);
});
pgPool.query("ALTER TABLE refunds ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'not_eligible'").catch(err => {
  console.error("Migration error (refunds status column):", err);
});
pgPool.query("ALTER TABLE refunds ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ").catch(err => {
  console.error("Migration error (refunds processed_at column):", err);
});
pgPool.query("ALTER TABLE refunds ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()").catch(err => {
  console.error("Migration error (refunds created_at column):", err);
});
pgPool.query("ALTER TABLE refunds ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()").catch(err => {
  console.error("Migration error (refunds updated_at column):", err);
});
pgPool.query("CREATE UNIQUE INDEX IF NOT EXISTS refunds_session_id_unique ON refunds (session_id)").catch(err => {
  console.error("Migration error (refunds session unique index):", err);
});
pgPool.query("ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_mentor_id_date_time_key").catch(err => {
  console.error("Migration error (sessions old slot constraint):", err);
});
pgPool.query(`
  CREATE UNIQUE INDEX IF NOT EXISTS sessions_active_mentor_date_time_unique
  ON sessions (mentor_id, date, "time")
  WHERE status NOT IN ('Cancelled', 'Rejected')
`).catch(err => {
  console.error("Migration error (sessions active slot unique index):", err);
});
pgPool.query(`
  DO $$
  BEGIN
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'refunds'
        AND column_name = 'amount'
    ) THEN
      UPDATE refunds
      SET amount = COALESCE(amount, refund_amount, 0),
          refund_amount = COALESCE(refund_amount, amount, 0),
          percentage = COALESCE(percentage, refund_percentage, 0),
          refund_percentage = COALESCE(refund_percentage, percentage, 0);
      ALTER TABLE refunds ALTER COLUMN amount SET DEFAULT 0;
      ALTER TABLE refunds ALTER COLUMN amount DROP NOT NULL;
      ALTER TABLE refunds ALTER COLUMN percentage SET DEFAULT 0;
      ALTER TABLE refunds ALTER COLUMN percentage DROP NOT NULL;
    END IF;
  END $$;
`).catch(err => {
  console.error("Migration error (legacy refunds amount column):", err);
});

/* ================= GLOBAL MIDDLEWARE ================= */
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

/* ================= ROUTES ================= */
app.use("/api/auth", authRoutes);
app.use("/api/mentors", mentorRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/conversations", messageRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/promo-codes", promoCodeRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/refunds", refundRoutes);

app.get("/", (_req, res) => {
  res.send("Mentor Booking System Backend is running!");
});

/* ================= SOCKET.IO ================= */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

// Initialize Socket.IO
app.set("io", io);
(global as any).io = io;
initSocket(io);
startReminderService();

/* ================= START SERVER ================= */
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
