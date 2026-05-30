import { Response } from "express";
import { pgPool } from "../config/database";
import { AuthRequest } from "../middlewares/authMiddleware";
import { createNotification } from "../utils/notificationService";

export const submitReport = async (req: AuthRequest, res: Response) => {
    const reporterId = req.user?.id;
    const { reported_user_id, reason, description, evidence_url } = req.body;

    if (!reporterId) return res.status(401).json({ message: "Unauthorized" });
    if (!reported_user_id || !reason) return res.status(400).json({ message: "Missing required fields" });

    if (reporterId === reported_user_id) {
        return res.status(400).json({ message: "You cannot report yourself" });
    }

    try {
        
        const { rows: existingReports } = await pgPool.query(
            `SELECT id FROM reports 
             WHERE reporter_id = $1 AND reported_user_id = $2 
             AND created_at > NOW() - INTERVAL '24 hours'`,
            [reporterId, reported_user_id]
        );

        if (existingReports.length > 0) {
            return res.status(429).json({ message: "You have already reported this user recently. Please wait for our team to review." });
        }

        await pgPool.query(
            `INSERT INTO reports (reporter_id, reported_user_id, reason, description, evidence_url)
             VALUES ($1, $2, $3, $4, $5)`,
            [reporterId, reported_user_id, reason, description || null, evidence_url || null]
        );
        res.status(201).json({ message: "Report submitted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

export const getAllReports = async (req: AuthRequest, res: Response) => {
    if (req.user?.role !== "admin") return res.status(403).json({ message: "Forbidden" });

    try {
        const { rows } = await pgPool.query(`
            SELECT r.*, 
                   u1.name as reporter_name, u1.email as reporter_email, u1.profile_picture as reporter_picture,
                   u2.name as reported_name, u2.email as reported_email, u2.profile_picture as reported_picture
            FROM reports r
            JOIN users u1 ON r.reporter_id = u1.id
            JOIN users u2 ON r.reported_user_id = u2.id
            ORDER BY r.created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

export const updateReportStatus = async (req: AuthRequest, res: Response) => {
    if (req.user?.role !== "admin") return res.status(403).json({ message: "Forbidden" });
    const { reportId } = req.params;
    const { status } = req.body;

    if (!['pending', 'resolved', 'dismissed', 'warned', 'suspended', 'banned'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
    }

    const client = await pgPool.connect();
    try {
        await client.query("BEGIN");

        const { rows: reportRows } = await client.query(
            `UPDATE reports SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING reported_user_id`,
            [status, reportId]
        );

        if (reportRows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Report not found" });
        }

        const reportedUserId = reportRows[0].reported_user_id;

        if (status === 'warned') {
            await createNotification({
                userId: reportedUserId,
                type: 'security',
                title: 'Account Warning',
                message: 'You have received a formal warning due to a report against your account. Please review our community guidelines.',
                data: { reportId }
            });
        } else if (status === 'suspended') {
            await client.query("UPDATE users SET status = 'suspended' WHERE id = $1", [reportedUserId]);
            await createNotification({
                userId: reportedUserId,
                type: 'security',
                title: 'Account Suspended',
                message: 'Your account has been suspended for violating platform policies.',
                data: { reportId }
            });
        } else if (status === 'banned') {
            await client.query("UPDATE users SET status = 'banned' WHERE id = $1", [reportedUserId]);
            await createNotification({
                userId: reportedUserId,
                type: 'security',
                title: 'Account Permanently Banned',
                message: 'Your account has been permanently banned from the platform.',
                data: { reportId }
            });
        }

        await client.query("COMMIT");
        res.json({ message: `Report updated to ${status} and appropriate action taken.` });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error(err);
        res.status(500).json({ message: "Server error" });
    } finally {
        client.release();
    }
};
