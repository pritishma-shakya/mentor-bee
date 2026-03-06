import { pgPool } from "../config/database";
import { Server } from "socket.io";

export type NotificationType = 
  | "booking" 
  | "cancellation" 
  | "reminder" 
  | "message" 
  | "review" 
  | "interaction";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  io?: Server;
}

export const createNotification = async ({
  userId,
  type,
  title,
  message,
  data = {},
  io
}: CreateNotificationParams) => {
  try {
    // 1. Save to Database
    const { rows } = await pgPool.query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, type, title, message, JSON.stringify(data)]
    );

    const notification = rows[0];

    // 2. Broadcast via Socket.io if available
    if (io) {
      io.to(`user_${userId}`).emit("new_notification", notification);
    }

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
};
