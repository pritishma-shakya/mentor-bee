import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { pgPool } from "../config/database";
import crypto from "crypto";

export const generateSignature = async (req: AuthRequest, res: Response) => {
    const { total_amount, transaction_uuid, product_code } = req.body;

    const secretKey = process.env.ESEWA_SECRET_KEY;

    if (!secretKey) {
        console.error("ESEWA_SECRET_KEY is not defined in the environment");
        res.status(500).json({ message: "Payment configuration error" });
        return;
    }

    const dataToSign = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;

    try {
        const signature = crypto.createHmac('sha256', secretKey).update(dataToSign).digest('base64');
        res.json({
            signature,
            message: "Signature generated successfully"
        });
    } catch (error) {
        console.error("Payment error:", error);
        res.status(500).json({ message: "Payment processing failed" });
    }
};

export const getUserPayments = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    try {
        let query = "";
        let params: any[] = [];

        if (role === "admin") {
            query = `
                SELECT p.*, s.course, u1.name as student_name, u2.name as mentor_name
                FROM payments p
                JOIN sessions s ON p.session_id = s.id
                JOIN users u1 ON p.student_id = u1.id
                JOIN users u2 ON p.mentor_id = u2.id
                ORDER BY p.created_at DESC
            `;
        } else if (role === "mentor") {
            query = `
                SELECT p.*, s.course, u.name as student_name
                FROM payments p
                JOIN sessions s ON p.session_id = s.id
                JOIN users u ON p.student_id = u.id
                WHERE p.mentor_id = (SELECT id FROM mentors WHERE user_id = $1)
                ORDER BY p.created_at DESC
            `;
            const { rows: mentorRows } = await pgPool.query("SELECT id FROM mentors WHERE user_id = $1", [userId]);
            if (!mentorRows.length) return res.status(404).json({ message: "Mentor record not found" });
            params = [userId];
        } else {
            
            query = `
                SELECT p.*, s.course, u.name as mentor_name
                FROM payments p
                JOIN sessions s ON p.session_id = s.id
                JOIN users u ON p.mentor_id = (SELECT user_id FROM mentors WHERE id = u.id) -- This join might be complex
                -- Simpler join
                JOIN mentors m ON p.mentor_id = m.id
                JOIN users u2 ON m.user_id = u2.id
                WHERE p.student_id = $1
                ORDER BY p.created_at DESC
            `;
            query = `
                SELECT p.*, s.course, u.name as mentor_name
                FROM payments p
                JOIN sessions s ON p.session_id = s.id
                JOIN mentors m ON p.mentor_id = m.id
                JOIN users u ON m.user_id = u.id
                WHERE p.student_id = $1
                ORDER BY p.created_at DESC
            `;
            params = [userId];
        }

        const { rows } = await pgPool.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};