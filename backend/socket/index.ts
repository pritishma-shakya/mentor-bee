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
      socket.join(conversationId);

      const messages = await getConversationMessages(conversationId, socket.data.user.id);
      socket.emit("load_messages", messages);
    });

    socket.on("join_session", (sessionId: string) => {
      socket.join(`session_${sessionId}`);
    });

    socket.on("mark_read", async (conversationId: string) => {
      try {
        await markMessagesAsRead(conversationId, socket.data.user.id);
        // Optionally notify other participants that messages were read
        // io.to(conversationId).emit("messages_read", { conversationId, userId: socket.data.user.id });
      } catch (err) {
        console.error(err);
      }
    });

    socket.on("disconnect", () => {
    });
  });
};
