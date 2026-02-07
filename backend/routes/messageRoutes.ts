import express from "express";
import { authenticate, AuthRequest } from "../middlewares/authMiddleware";
import { pgPool } from "../config/database";
import { getConversations, getConversationMessages, sendMessage } from "../controllers/messageController";

const router = express.Router();

// Get all conversations
router.get("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const conversations = await getConversations(req.user!.id);
    res.json({ success: true, data: conversations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch conversations" });
  }
});

// Get messages of a conversation
router.get("/:conversationId/messages", authenticate, async (req: AuthRequest, res) => {
  try {
    const messages = await getConversationMessages(req.params.conversationId, req.user!.id);
    res.json({ success: true, data: messages });
  } catch (err: any) {
    console.error(err);
    res.status(err.message === "Forbidden" ? 403 : 500).json({ success: false, message: err.message });
  }
});

// Send a message (or create conversation)
router.post("/:conversationId?/messages", authenticate, async (req: AuthRequest, res) => {
  try {
    const { content, mentor_id } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ success: false, message: "Message is empty" });

    const msg = await sendMessage(
      req.params.conversationId || null,
      req.user!.id,
      content.trim(),
      mentor_id
    );

    res.json({ success: true, data: msg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to send message" });
  }
});

// POST /api/conversations/start
router.post("/start", authenticate, async (req: AuthRequest, res) => {
  try {
    const { mentor_id } = req.body;
    if (!mentor_id) return res.status(400).json({ success: false, message: "Mentor ID is required" });

    // Check if conversation already exists between current user and mentor
    const { rows } = await pgPool.query(
      `
      SELECT c.id
      FROM conversations c
      JOIN conversation_participants cp1 ON cp1.conversation_id = c.id AND cp1.user_id = $1
      JOIN conversation_participants cp2 ON cp2.conversation_id = c.id AND cp2.user_id = $2
      LIMIT 1
      `,
      [req.user!.id, mentor_id]
    );

    let conversationId: string;

    if (rows.length > 0) {
      // Existing conversation
      conversationId = rows[0].id;
    } else {
      // Create new conversation
      const { rows: newConv } = await pgPool.query(
        `INSERT INTO conversations DEFAULT VALUES RETURNING id`
      );
      conversationId = newConv[0].id;

      // Add participants
      await pgPool.query(
        `INSERT INTO conversation_participants (conversation_id, user_id) VALUES ($1, $2), ($1, $3)`,
        [conversationId, req.user!.id, mentor_id]
      );
    }

    res.json({ success: true, data: { id: conversationId } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to start conversation" });
  }
});

export default router;
