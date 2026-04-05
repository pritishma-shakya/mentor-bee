import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { sendMessage, getConversationMessages, markMessagesAsRead } from "../controllers/messageController";

const JWT_SECRET = process.env.SECRET_KEY!;

const parseCookies = (str: string) => {
  if (!str) return {};
  return str.split(";").reduce((res, c) => {
    const [key, val] = c.trim().split("=");
    if (key && val) res[key] = val;
    return res;
  }, {} as any);
};

export const initSocket = (io: Server) => {
  // Middleware to authenticate socket connection
  io.use((socket: Socket, next) => {
    const rawCookies = socket.request.headers.cookie || "";
    const cookies = parseCookies(rawCookies);
    const token =
      cookies.student_auth_token ||
      cookies.mentor_auth_token ||
      cookies.admin_auth_token ||
      socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication error: Token missing"));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      socket.data.user = decoded;
      next();
    } catch (err: any) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.user.id;
    socket.join(`user_${userId}`);

    socket.on("join_conversation", async (conversationId: string) => {
      try {
        const messages = await getConversationMessages(conversationId, socket.data.user.id);
        socket.join(conversationId);
        socket.emit("load_messages", messages);
      } catch (err: any) {
        console.error("[Socket] join_conversation error:", err.message);
        socket.emit("error", { 
          message: err.message === "Forbidden" ? "Unauthorized access to conversation" : "Failed to join conversation" 
        });
      }
    });

    socket.on("join_session", (sessionId: string) => {
      try {
        socket.join(`session_${sessionId}`);
      } catch (err) {
        console.error("[Socket] join_session error:", err);
      }
    });

    socket.on("mark_read", async (conversationId: string) => {
      try {
        await markMessagesAsRead(conversationId, socket.data.user.id);
      } catch (err: any) {
        console.error("[Socket] mark_read error:", err.message);
      }
    });

    socket.on("disconnect", () => {
    });
  });
};
