import { pgPool } from "../config/database";

interface Message {
  id: string;
  text: string;
  sender: "me" | "other";
  time: string;
}

export const saveMessageToDB = async (conversationId: string, message: Message) => {
  try {
    const query = `
      INSERT INTO messages (id, conversation_id, text, sender, time)
      VALUES ($1, $2, $3, $4, $5)
    `;
    const values = [message.id, conversationId, message.text, message.sender, message.time];
    await pgPool.query(query, values);
    console.log("Message saved to DB:", message);
  } catch (err) {
    console.error("Error saving message to DB:", err);
    throw err;
  }
};
