import { Response } from "express";
import { pgPool } from "../config/database";
import { AuthRequest } from "../middlewares/authMiddleware";

export const createPromoCode = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { code, discount_type, discount_value, expiry_date, usage_limit, description } = req.body;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!code || !discount_type || !discount_value) {
        return res.status(400).json({ message: "Code, discount type, and value are required" });
    }

    const val = Number(discount_value);
    if (isNaN(val) || val <= 0) {
        return res.status(400).json({ message: "Discount value must be a positive number" });
    }

    if (discount_type === 'percentage' && val > 20) {
        return res.status(400).json({ message: "Percentage discount cannot exceed 20%" });
    }

    if (discount_type === 'fixed' && val > 250) {
        return res.status(400).json({ message: "Fixed discount cannot exceed Rs. 250" });
    }

    try {
        const status = role === 'admin' ? 'approved' : 'pending';
        const mentor_id = role === 'mentor' ? userId : null;

        const { rows } = await pgPool.query(
            `INSERT INTO promo_codes 
            (code, discount_type, discount_value, mentor_id, created_by, status, expiry_date, usage_limit, description)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *`,
            [code.toUpperCase(), discount_type, discount_value, mentor_id, userId, status, expiry_date || null, usage_limit || null, description || null]
        );

        res.status(201).json({ success: true, promoCode: rows[0] });
    } catch (err: any) {
        if (err.code === '23505') {
            return res.status(409).json({ message: "Promo code already exists" });
        }
        console.error("Error creating promo code:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getPromoCodes = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const role = req.user?.role;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    try {
        let query = "SELECT * FROM promo_codes";
        let params: any[] = [];

        if (role === 'mentor') {
            query += " WHERE mentor_id = $1 OR created_by = $1";
            params.push(userId);
        }

        const { rows } = await pgPool.query(query, params);
        res.json({ success: true, promoCodes: rows });
    } catch (err) {
        console.error("Error fetching promo codes:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updatePromoCodeStatus = async (req: AuthRequest, res: Response) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: "Only admin can update status" });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
    }

    try {
        const { rows } = await pgPool.query(
            "UPDATE promo_codes SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
            [status, id]
        );

        if (!rows.length) return res.status(404).json({ message: "Promo code not found" });

        res.json({ success: true, promoCode: rows[0] });
    } catch (err) {
        console.error("Error updating promo code status:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const validatePromoCode = async (req: AuthRequest, res: Response) => {
    const { code, mentorId } = req.body;

    if (!code) return res.status(400).json({ message: "Code is required" });

    try {
        const { rows } = await pgPool.query(
            `SELECT * FROM promo_codes 
             WHERE code = $1 AND status = 'approved' AND is_active = true`,
            [code.toUpperCase()]
        );

        const promo = rows[0];

        if (!promo) {
            return res.status(404).json({ success: false, message: "Invalid or expired promo code" });
        }

        // Check expiry
        if (promo.expiry_date && new Date(promo.expiry_date) < new Date()) {
            return res.status(400).json({ success: false, message: "Promo code has expired" });
        }

        // Check usage limit
        if (promo.usage_limit && promo.usage_count >= promo.usage_limit) {
            return res.status(400).json({ success: false, message: "Promo code usage limit reached" });
        }

        // Check if mentor-specific
        if (promo.mentor_id && mentorId && promo.mentor_id !== mentorId) {
            return res.status(400).json({ success: false, message: "This code is not valid for this mentor" });
        }

        res.json({ 
            success: true, 
            discount: {
                type: promo.discount_type,
                value: promo.discount_value,
                id: promo.id,
                description: promo.description
            }
        });
    } catch (err) {
        console.error("Error validating promo code:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getMentorActivePromoCodes = async (req: AuthRequest, res: Response) => {
    const { mentorId } = req.params;

    try {
        // We first need to get the user_id for this mentor.id
        const { rows: mentorRows } = await pgPool.query("SELECT user_id FROM mentors WHERE id = $1", [mentorId]);
        const userId = mentorRows[0]?.user_id;

        const { rows } = await pgPool.query(
            `SELECT code, discount_type, discount_value, expiry_date, description 
             FROM promo_codes 
             WHERE status = 'approved' AND is_active = true
             AND (mentor_id = $1 OR mentor_id IS NULL)
             AND (expiry_date IS NULL OR expiry_date > NOW())
             AND (usage_limit IS NULL OR usage_count < usage_limit)`,
            [userId]
        );

        res.json({ success: true, promoCodes: rows });
    } catch (err) {
        console.error("Error fetching mentor active promo codes:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deletePromoCode = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { id } = req.params;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    try {
        let query = "DELETE FROM promo_codes WHERE id = $1";
        let params = [id];

        if (role === 'mentor') {
            // Mentor can only delete their own codes
            query += " AND created_by = $2";
            params.push(userId);
        }
        // Admin can delete any code

        const { rowCount } = await pgPool.query(query, params);

        if (rowCount === 0) {
            return res.status(404).json({ message: "Promo code not found or unauthorized" });
        }

        res.json({ success: true, message: "Promo code deleted successfully" });
    } catch (err) {
        console.error("Error deleting promo code:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};
