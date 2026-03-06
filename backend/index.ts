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

// Socket
import { initSocket } from "./socket";
import { startReminderService } from "./utils/reminderService";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

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
