import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

// Import routes
import authRoutes from "./routes/authRoutes";
import mentorRoutes from "./routes/mentorRoutes";
import studentRoutes from "./routes/studentRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/* ================= GLOBAL MIDDLEWARE ================= */

// Parse JSON bodies
app.use(express.json());

// Parse cookies (REQUIRED for auth)
app.use(cookieParser());

// CORS — MUST allow credentials
app.use(
  cors({
    origin: "http://localhost:3000", // frontend URL
    credentials: true,
  })
);

/* ================= ROUTES ================= */

app.use("/api/auth", authRoutes);
app.use("/api/mentors", mentorRoutes);
app.use("/api/students", studentRoutes);

/* ================= DEFAULT ROUTE ================= */

app.get("/", (_req, res) => {
  res.send("Mentor Booking System Backend is running!");
});

/* ================= START SERVER ================= */

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
