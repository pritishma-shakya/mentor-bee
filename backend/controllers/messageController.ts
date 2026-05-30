import { Server } from "socket.io";
import { pgPool } from "../config/database";
import { createNotification } from "../utils/notificationService";

export interface Conversation {
  id: string;
  mentor_id: string;
  mentor_name: string;
  mentor_picture?: string;
  messages: Message[];
  last_message?: string;
  last_time?: string;
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read?: boolean;
  participants?: string[];
}

const ACTIVE_USER_SQL = "COALESCE(status, 'active') NOT IN ('suspended', 'banned')";

const ensureConversationVisible = async (conversationId: string, userId: string): Promise<void> => {
  const { rowCount } = await pgPool.query(
    `SELECT 1
     FROM conversation_participants cp
     WHERE cp.conversation_id = $1
       AND cp.user_id = $2
       AND NOT EXISTS (
         SELECT 1
         FROM conversation_participants hidden_cp
         JOIN users hidden_u ON hidden_u.id = hidden_cp.user_id
         WHERE hidden_cp.conversation_id = cp.conversation_id
           AND hidden_cp.user_id != $2
           AND COALESCE(hidden_u.status, 'active') IN ('suspended', 'banned')
       )`,
    [conversationId, userId]
  );

  if (rowCount === 0) throw new Error("Forbidden");
};

const ensureUserCanReceiveMessages = async (userId: string): Promise<void> => {
  const { rowCount } = await pgPool.query(
    `SELECT 1 FROM users WHERE id = $1 AND ${ACTIVE_USER_SQL}`,
    [userId]
  );

  if (rowCount === 0) throw new Error("User unavailable");
};

export const getConversations = async (userId: string): Promise<Conversation[]> => {
  const { rows } = await pgPool.query(
    `
    SELECT c.id,
           u.id AS mentor_id,
           u.name AS mentor_name,
           u.profile_picture AS mentor_picture,
           m.content AS last_message,
           m.created_at AS last_time,
           (
             SELECT COUNT(*)::int
             FROM messages
             WHERE conversation_id = c.id AND sender_id != $1 AND is_read = FALSE
           ) AS unread_count
    FROM conversations c
    JOIN conversation_participants cp ON cp.conversation_id = c.id
    JOIN users u ON u.id = (
      SELECT user_id
      FROM conversation_participants
      WHERE conversation_id = c.id AND user_id != $1
      LIMIT 1
    )
    LEFT JOIN LATERAL (
      SELECT content, created_at
      FROM messages
      WHERE conversation_id = c.id
      ORDER BY created_at DESC
      LIMIT 1
    ) m ON true
    WHERE cp.user_id = $1
      AND COALESCE(u.status, 'active') NOT IN ('suspended', 'banned')
    ORDER BY m.created_at DESC NULLS LAST
  `,
    [userId]
  );

  return rows.map((r) => ({
    id: r.id,
    mentor_id: r.mentor_id,
    mentor_name: r.mentor_name,
    mentor_picture: r.mentor_picture,
    messages: [], 
    last_message: r.last_message,
    last_time: r.last_time,
    unread_count: r.unread_count,
  }));
};

export const getConversationMessages = async (
  conversationId: string,
  userId: string
): Promise<Message[]> => {
  await ensureConversationVisible(conversationId, userId);

  const { rows } = await pgPool.query(
    `SELECT id, conversation_id, sender_id, content, created_at, is_read
     FROM messages
     WHERE conversation_id = $1
     ORDER BY created_at ASC`,
    [conversationId]
  );

  return rows;
};

export const sendMessage = async (
  conversationId: string | null,
  senderId: string,
  content: string,
  otherUserId?: string 
): Promise<Message> => {
  if (otherUserId) {
    await ensureUserCanReceiveMessages(otherUserId);
  }

  if (conversationId) {
    await ensureConversationVisible(conversationId, senderId);
  }

  if (!conversationId) {
    
    const { rows: convRows } = await pgPool.query(
      `INSERT INTO conversations DEFAULT VALUES RETURNING id`
    );
    conversationId = convRows[0].id;

    await pgPool.query(
      `INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2), ($1, $3)`,
      [conversationId, senderId, otherUserId]
    );
  }

  const { rows } = await pgPool.query(
    `INSERT INTO messages (conversation_id, sender_id, content) 
     VALUES ($1, $2, $3)
     RETURNING id, conversation_id, sender_id, content, created_at, is_read`,
    [conversationId, senderId, content]
  );

  const { rows: participants } = await pgPool.query(
    `SELECT user_id FROM conversation_participants WHERE conversation_id = $1`,
    [conversationId]
  );

  const message = {
    ...rows[0],
    participants: participants.map((p) => p.user_id),
  };

  const { rows: senderRows } = await pgPool.query(`SELECT name FROM users WHERE id = $1`, [senderId]);
  const senderName = senderRows[0]?.name || "Someone";

  const otherParticipants = (message.participants || []).filter((p: string) => p !== senderId);
  const globalIo = (global as any).io;
  
  otherParticipants.forEach((recipientId: string) => {
    createNotification({
      userId: recipientId,
      type: "message",
      title: "New Message",
      message: `${senderName} sent you a message: "${content.substring(0, 30)}${content.length > 30 ? "..." : ""}"`,
      data: { conversationId: message.conversation_id },
      io: globalIo,
    }).catch(err => console.error("[MessageController] Notification failed:", err));
  });

  return message;
};

export const markMessagesAsRead = async (conversationId: string, userId: string): Promise<void> => {
  await pgPool.query(
    `UPDATE messages 
     SET is_read = TRUE 
     WHERE conversation_id = $1 AND sender_id != $2 AND is_read = FALSE`,
    [conversationId, userId]
  );
};
