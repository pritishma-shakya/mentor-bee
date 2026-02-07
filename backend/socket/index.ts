import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { sendMessage , getConversationMessages } from "../controllers/messageController";

const JWT_SECRET = process.env.SECRET_KEY!;

export const initSocket = (io: Server) => {
  // Middleware to authenticate socket connection
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Unauthorized"));

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      socket.data.user = { id: decoded.id, role: decoded.role };
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    console.log("User connected:", socket.data.user.id);

    socket.on("join_conversation", async (conversationId: string) => {
      socket.join(conversationId);
      console.log(`User ${socket.data.user.id} joined ${conversationId}`);

      // Optionally send existing messages
      const messages = await getConversationMessages(conversationId, socket.data.user.id);
      socket.emit("load_messages", messages);
    });

    socket.on("send_message", async (data: any) => {
      const { conversationId, content } = data;
      const senderId = socket.data.user.id;

      try {
        const message = await sendMessage(conversationId, senderId, content);
        io.to(conversationId).emit("receive_message", message);
      } catch (err) {
        console.error(err);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.data.user.id);
    });
  });
};
