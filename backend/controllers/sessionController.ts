import { Response } from "express";
import { pgPool } from "../config/database";
import { AuthRequest } from "../middlewares/authMiddleware";
import { createNotification, getAdminUserId } from "../utils/notificationService";
import { handleSessionBookingPoints, handleSessionCompletionPoints } from "../utils/rewardsService";

// Helper to format date cleanly (YYYY-MM-DD)
const formatDate = (date: any) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

// Create a new session (student books a session)
export const bookSession = async (req: AuthRequest, res: Response) => {
  const studentId = req.user?.id;
  const { 
    mentor_id, date, time, course, notes, type, location, 
    payment_status, transaction_uuid, total_amount, promoCodeId 
  } = req.body;

  if (!studentId) return res.status(401).json({ message: "Unauthorized" });
  if (!mentor_id || !date || !time || !course)
    return res.status(400).json({ message: "Missing required fields" });

  const client = await pgPool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. Create session
    const { rows: sessionRows } = await client.query(
      `INSERT INTO sessions 
       (mentor_id, student_id, date, time, course, notes, type, location, status, payment_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8, 'Pending', $9)
       RETURNING *`,
      [mentor_id, studentId, date, time, course, notes || null, type || "Online", location || null, payment_status || "Not Paid"]
    );

    const newSession = sessionRows[0];
    
    // 2. Handle Price and Discount
    const { rows: mentorInfo } = await client.query(`SELECT hourly_rate FROM mentors WHERE id = $1`, [mentor_id]);
    const baseAmount = mentorInfo[0]?.hourly_rate || 0;
    let amountToCharge = total_amount || baseAmount;
    let discountAmount = 0;

    if (promoCodeId) {
        const { rows: promoRows } = await client.query(
            "SELECT * FROM promo_codes WHERE id = $1 AND status = 'approved' AND is_active = true",
            [promoCodeId]
        );
        const promo = promoRows[0];
        if (promo) {
            if (promo.discount_type === 'percentage') {
                discountAmount = (baseAmount * Number(promo.discount_value)) / 100;
            } else {
                discountAmount = Number(promo.discount_value);
            }
            amountToCharge = Math.max(0, baseAmount - discountAmount);

            // Increment usage count
            await client.query("UPDATE promo_codes SET usage_count = usage_count + 1 WHERE id = $1", [promoCodeId]);
        }
    }
    
    // 3. Insert payment record if Paid
    if (payment_status === "Paid") {
      const adminRev = amountToCharge * 0.20;
      const mentorRev = amountToCharge * 0.80;
      
      await client.query(
        `INSERT INTO payments 
         (session_id, student_id, mentor_id, transaction_uuid, total_amount, admin_revenue, mentor_revenue, promo_code_id, discount_amount)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [newSession.id, studentId, mentor_id, transaction_uuid || null, amountToCharge, adminRev, mentorRev, promoCodeId || null, discountAmount]
      );
    }
    
    // Give booking points (loyalty + first booking logic handled inside)
    await handleSessionBookingPoints(studentId, mentor_id, client);
    
    await client.query('COMMIT');

    res.status(201).json({ message: "Session booked", session: newSession });

    // Send Notification to Mentor
    const io = req.app.get("io");
    const mentorUserId = await getMentorUserId(mentor_id);
    const cleanTime = newSession.time.split(':').slice(0, 2).join(':'); // HH:MM
    const cleanDate = formatDate(date);
    await createNotification({
      userId: mentorUserId,
      type: "booking",
      title: "New Booking Request",
      message: `${req.user?.name || "A student"} has booked a mentorship session with you for ${cleanDate} at ${cleanTime}. Please review and respond to the booking request.`,
      data: { sessionId: newSession.id },
      io,
    });

    // If paid via eSewa, send success notification to Student AND Admin
    if (payment_status === "Paid") {
      await createNotification({
        userId: studentId,
        type: "booking",
        title: "Session Booked Successfully",
        message: `Your payment was successful and your session for ${cleanDate} at ${cleanTime} is confirmed. Awaiting mentor response.`,
        data: { sessionId: newSession.id },
        io,
      });

      // Admin payment notification
      try {
        const adminId = await getAdminUserId();
        if (adminId) {
          await createNotification({
            userId: adminId,
            type: "interaction",
            title: "New eSewa Payment Received",
            message: `${req.user?.name || "A student"} paid for a session on ${cleanDate} at ${cleanTime}.`,
            data: { sessionId: newSession.id },
            io,
          });
        }
      } catch (e) { console.error("Admin payment notif failed:", e); }
    }
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error(err);
    if (err.code === "23505") {
      // Unique violation: double booking
      return res.status(400).json({ message: "Time slot already booked" });
    }
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};

// Get sessions for a mentor
export const getMentorSessions = async (req: AuthRequest, res: Response) => {
  const mentorId = req.user?.id;
  if (!mentorId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const { rows } = await pgPool.query(
      `SELECT s.*, u.name AS student_name, u.profile_picture
       FROM sessions s
       JOIN mentors m ON s.mentor_id = m.id
       JOIN users u ON u.id = s.student_id
       WHERE m.user_id = $1
       ORDER BY s.date ASC, s.time ASC`,
      [mentorId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get sessions for a student
export const getStudentSessions = async (req: AuthRequest, res: Response) => {
  const studentId = req.user?.id;
  if (!studentId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const { rows } = await pgPool.query(
      `SELECT s.*, u.name AS mentor_name, u.profile_picture AS mentor_profile_picture, u.id AS mentor_user_id,
              CASE WHEN r.id IS NOT NULL THEN true ELSE false END as has_review
       FROM sessions s
       JOIN mentors m ON m.id = s.mentor_id
       JOIN users u ON m.user_id = u.id
       LEFT JOIN reviews r ON r.session_id = s.id
       WHERE s.student_id = $1
       ORDER BY s.date ASC, s.time ASC`,
      [studentId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateSessionStatus = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { sessionId } = req.params;
  const { status } = req.body;

  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  if (!status) return res.status(400).json({ message: "Status required" });

  try {
    const query = `
      UPDATE sessions 
      SET status = $1, 
          updated_at = now()
      WHERE id = $2
      RETURNING *`;
    const params = [status, sessionId];

    const { rows } = await pgPool.query(query, params);

    if (!rows.length) return res.status(404).json({ message: "Session not found" });

    const session = rows[0];
    res.json({ message: "Status updated", session });

    // Send Notification to Student/Mentor
    const io = req.app.get("io");
    const isMentor = req.user?.role === "mentor";
    const targetUserId = isMentor ? session.student_id : (await getMentorUserId(session.mentor_id));

    const cleanTime = session.time.split(':').slice(0, 2).join(':'); // HH:MM
    const cleanDate = formatDate(session.date);
    if (status === "Accepted") {
      await createNotification({
        userId: session.student_id,
        type: "booking",
        title: "Booking Accepted",
        message: `${req.user?.name || "The mentor"} has accepted your session on ${cleanDate} at ${cleanTime}.`,
        data: { sessionId: session.id },
        io,
      });
    } else if (status === "Rejected") {
      await createNotification({
        userId: session.student_id,
        type: "cancellation",
        title: "Booking Rejected",
        message: `${req.user?.name || "The mentor"} has rejected your booking request for ${cleanDate} at ${cleanTime}.`,
        data: { sessionId: session.id },
        io,
      });
    } else if (status === "Cancelled") {
      await createNotification({
        userId: targetUserId,
        type: "cancellation",
        title: "Session Cancelled",
        message: `${req.user?.name || "The other participant"} has cancelled the session on ${cleanDate} at ${cleanTime}.`,
        data: { sessionId: session.id },
        io,
      });
    } else if (status === "Completed") {
      // Emit session_completed event to the session room
      io.to(`session_${sessionId}`).emit("session_completed", session);

      // Notify admin of completed session
      try {
        const adminId = await getAdminUserId();
        if (adminId) {
          await createNotification({
            userId: adminId,
            type: "interaction",
            title: "Session Completed",
            message: `A session scheduled for ${cleanDate} at ${cleanTime} has been marked as completed.`,
            data: { sessionId: session.id },
            io,
          });
        }
      } catch (e) { console.error("Admin session complete notif failed:", e); }

      // Give Completion points
      try {
        await handleSessionCompletionPoints(session.student_id, session.mentor_id);
      } catch (e) {
        console.error("Error giving completion points", e);
      }
    }
  } catch (err) {
    console.error("Error updating session status:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Request Cancellation (student or mentor)
export const requestCancellation = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { sessionId } = req.params;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const { rows } = await pgPool.query(
      `UPDATE sessions 
       SET status = 'Cancel Requested', 
           cancel_requested_by = $1, 
           cancel_requested_at = NOW() 
       WHERE id = $2 RETURNING *`,
      [userId, sessionId]
    );
    if (!rows.length) return res.status(404).json({ message: "Session not found" });

    const session = rows[0];
    res.json({ message: "Cancellation requested", session });

    // Send Notification
    const io = req.app.get("io");
    const isMentor = req.user?.role === "mentor";
    const targetUserId = isMentor ? session.student_id : (await getMentorUserId(session.mentor_id));

    await createNotification({
      userId: targetUserId,
      type: "cancellation",
      title: "Cancellation Request",
      message: `${req.user?.name || "The other participant"} has requested to cancel the session on ${formatDate(session.date)}.`,
      data: { sessionId: session.id },
      io,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Request Reschedule
export const requestReschedule = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { sessionId } = req.params;
  const { newDate, newTime } = req.body;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  if (!newDate || !newTime) return res.status(400).json({ message: "New date and time required" });

  try {
    const cleanTime = newTime.split(':').slice(0, 2).join(':'); // HH:MM
    const { rows } = await pgPool.query(
      `UPDATE sessions 
       SET status = 'Reschedule Requested', 
           rescheduled_date = $1, 
           rescheduled_time = $2, 
           reschedule_requested_by = $3, 
           reschedule_requested_at = NOW() 
       WHERE id = $4 RETURNING *`,
      [newDate, cleanTime, userId, sessionId]
    );
    if (!rows.length) return res.status(404).json({ message: "Session not found" });

    const session = rows[0];
    res.json({ message: "Reschedule requested", session });

    // Send Notification
    const io = req.app.get("io");
    const isMentor = req.user?.role === "mentor";
    const targetUserId = isMentor ? session.student_id : (await getMentorUserId(session.mentor_id));

    const cleanDate = formatDate(newDate);
    await createNotification({
      userId: targetUserId,
      type: "booking",
      title: "Reschedule Request",
      message: `${req.user?.name || "The other participant"} has requested to reschedule the session to ${cleanDate} at ${cleanTime}.`,
      data: { sessionId: session.id },
      io,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Respond to Reschedule/Cancellation
export const respondToRequest = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { sessionId } = req.params;
  const { type, action } = req.body; // type: 'reschedule'|'cancel', action: 'accept'|'reject'
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const { rows: sessionRows } = await pgPool.query(`SELECT * FROM sessions WHERE id = $1`, [sessionId]);
    if (!sessionRows.length) return res.status(404).json({ message: "Session not found" });
    const session = sessionRows[0];

    const io = req.app.get("io");

    if (type === 'reschedule') {
      if (action === 'accept') {
        const { rows } = await pgPool.query(
          `UPDATE sessions 
           SET date = rescheduled_date, 
               time = rescheduled_time, 
               status = 'Accepted', 
               rescheduled_date = NULL, 
               rescheduled_time = NULL, 
               reschedule_requested_by = NULL, 
               reschedule_requested_at = NULL 
           WHERE id = $1 RETURNING *`,
          [sessionId]
        );
        res.json({ message: "Reschedule accepted", session: rows[0] });
        await createNotification({
          userId: session.reschedule_requested_by,
          type: "booking",
          title: "Reschedule Accepted",
          message: `${req.user?.name} has accepted the reschedule request.`,
          data: { sessionId },
          io,
        });
      } else {
        const { rows } = await pgPool.query(
          `UPDATE sessions 
           SET status = 'Accepted', 
               rescheduled_date = NULL, 
               rescheduled_time = NULL, 
               reschedule_requested_by = NULL, 
               reschedule_requested_at = NULL 
           WHERE id = $1 RETURNING *`,
          [sessionId]
        );
        res.json({ message: "Reschedule rejected", session: rows[0] });
        await createNotification({
          userId: session.reschedule_requested_by,
          type: "cancellation",
          title: "Reschedule Rejected",
          message: `${req.user?.name} has rejected the reschedule request.`,
          data: { sessionId },
          io,
        });
      }
    } else if (type === 'cancel') {
        if (action === 'accept') {
            await pgPool.query(`DELETE FROM sessions WHERE id = $1`, [sessionId]);
            res.json({ message: "Cancellation accepted and session removed" });
            await createNotification({
                userId: session.cancel_requested_by,
                type: "cancellation",
                title: "Cancellation Accepted",
                message: `${req.user?.name} has accepted the cancellation request.`,
                data: { sessionId },
                io,
            });
        } else {
            const { rows } = await pgPool.query(
                `UPDATE sessions 
                 SET status = 'Accepted', 
                     cancel_requested_by = NULL, 
                     cancel_requested_at = NULL 
                 WHERE id = $1 RETURNING *`,
                [sessionId]
            );
            res.json({ message: "Cancellation rejected", session: rows[0] });
            await createNotification({
                userId: session.cancel_requested_by,
                type: "cancellation",
                title: "Cancellation Rejected",
                message: `${req.user?.name} has rejected the cancellation request.`,
                data: { sessionId },
                io,
            });
        }
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Helper to get mentor's user_id from mentor_id
async function getMentorUserId(mentorId: string) {
    const { rows } = await pgPool.query(`SELECT user_id FROM mentors WHERE id = $1`, [mentorId]);
    return rows[0]?.user_id;
}

// Mark an in-person session as cash paid (called by mentor)
export const markSessionCashPaid = async (req: AuthRequest, res: Response) => {
  const { sessionId } = req.params;
  const client = await pgPool.connect();
  try {
    await client.query('BEGIN');

    const { rows: sessionRows } = await client.query(
      `UPDATE sessions SET payment_status = 'Paid' WHERE id = $1 RETURNING *`,
      [sessionId]
    );
    if (!sessionRows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: "Session not found" });
    }
    const session = sessionRows[0];

    const { rows: existingPayment } = await client.query(
      `SELECT id FROM payments WHERE session_id = $1`, [sessionId]
    );

    if (!existingPayment.length) {
      const { rows: mentorInfo } = await client.query(
        `SELECT hourly_rate FROM mentors WHERE id = $1`, [session.mentor_id]
      );
      const amount = mentorInfo[0]?.hourly_rate || 0;
      await client.query(
        `INSERT INTO payments (session_id, student_id, mentor_id, total_amount, admin_revenue, mentor_revenue)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [sessionId, session.student_id, session.mentor_id, amount, amount * 0.20, amount * 0.80]
      );
    }

    await client.query('COMMIT');
    res.json({ message: "Marked as cash paid" });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("markSessionCashPaid error:", err);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};
