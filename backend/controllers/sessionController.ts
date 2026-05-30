import { Response } from "express";
import { pgPool } from "../config/database";
import { AuthRequest } from "../middlewares/authMiddleware";
import { createNotification, getAdminUserId } from "../utils/notificationService";
import { handleSessionBookingPoints, handleSessionCompletionPoints, addPoints } from "../utils/rewardsService";
import { sendSessionConfirmationEmail } from "../utils/emailService";

const formatDate = (date: any) => {
  if (!date) return "";
  if (typeof date === "string") return date.split("T")[0];
  const d = new Date(date);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
};

const parseSessionDateTime = (date: string | Date, time: string | Date) => {
  const datePart = formatDate(date);
  const [year, month, day] = datePart.split("-").map(Number);

  if (time instanceof Date) {
    return new Date(year, month - 1, day, time.getHours(), time.getMinutes(), 0);
  }

  const normalizedTime = String(time || "").trim().toLowerCase();

  if (normalizedTime.includes("am") || normalizedTime.includes("pm")) {
    const match = normalizedTime.match(/(\d+):(\d+)\s*(am|pm)/);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const modifier = match[3];
      if (modifier === "pm" && hours < 12) hours += 12;
      if (modifier === "am" && hours === 12) hours = 0;
      return new Date(year, month - 1, day, hours, minutes, 0);
    }
  }

  const [hours = 0, minutes = 0] = normalizedTime.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0);
};

const getRefundPercentage = (date: string | Date, time: string | Date, cancelledByRole?: string) => {
  if (cancelledByRole === "mentor") return 100;

  const sessionDate = parseSessionDateTime(date, time);
  const hoursUntilSession = (sessionDate.getTime() - Date.now()) / (1000 * 60 * 60);

  if (hoursUntilSession >= 24) return 100;
  if (hoursUntilSession >= 12) return 50;
  return 0;
};

let refundSchemaReady: Promise<void> | null = null;

const ensureRefundSchema = () => {
  if (!refundSchemaReady) {
    refundSchemaReady = (async () => {
      await pgPool.query(`
        CREATE TABLE IF NOT EXISTS refunds (
          id SERIAL PRIMARY KEY,
          session_id TEXT UNIQUE,
          payment_id TEXT,
          student_id TEXT,
          amount NUMERIC(10, 2) DEFAULT 0,
          refund_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
          percentage INTEGER DEFAULT 0,
          refund_percentage INTEGER NOT NULL DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'not_eligible',
          processed_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);
    })();
  }

  return refundSchemaReady;
};

const createRefundIfEligible = async (session: any, io?: any, cancelledByRole?: string) => {
  await ensureRefundSchema();

  const { rows: paymentRows } = await pgPool.query(
    `SELECT id, total_amount
     FROM payments
     WHERE session_id::text = $1::text
     ORDER BY created_at DESC
     LIMIT 1`,
    [session.id]
  );

  const payment = paymentRows[0];
  if (!payment) return null;

  const totalAmount = Number(payment.total_amount || 0);
  if (totalAmount <= 0) return null;

  const refundPercentage = getRefundPercentage(session.date, session.time, cancelledByRole);
  const refundAmount = Number(((totalAmount * refundPercentage) / 100).toFixed(2));
  const { rows: existingRefundRows } = await pgPool.query(
    `SELECT status FROM refunds WHERE session_id::text = $1::text LIMIT 1`,
    [session.id]
  );
  const wasAlreadyProcessed = existingRefundRows[0]?.status === "processed";

  const status = refundAmount > 0 ? "processed" : "not_eligible";

  const { rows: refundRows } = await pgPool.query(
    `INSERT INTO refunds (
       session_id,
       payment_id,
       student_id,
       amount,
       refund_amount,
       percentage,
       refund_percentage,
       status,
       processed_at
     )
     VALUES ($1, $2, $3, $4, $4, $5, $5, $6, CASE WHEN $4::numeric > 0 THEN NOW() ELSE NULL END)
     ON CONFLICT (session_id) DO UPDATE SET
       payment_id = EXCLUDED.payment_id,
       student_id = EXCLUDED.student_id,
       amount = EXCLUDED.amount,
       refund_amount = EXCLUDED.refund_amount,
       percentage = EXCLUDED.percentage,
       refund_percentage = EXCLUDED.refund_percentage,
       status = CASE WHEN refunds.status = 'processed' THEN refunds.status ELSE EXCLUDED.status END,
       processed_at = CASE
         WHEN refunds.status = 'processed' THEN refunds.processed_at
         WHEN EXCLUDED.status = 'processed' THEN NOW()
         ELSE refunds.processed_at
       END,
       updated_at = NOW()
     RETURNING *`,
    [session.id, String(payment.id), session.student_id, refundAmount, refundPercentage, status]
  );

  if (refundAmount > 0 && refundRows[0].status === "processed" && !wasAlreadyProcessed) {
    await createNotification({
      userId: session.student_id,
      type: "cancellation",
      title: "Refund Processed",
      message: `Your refund of Rs. ${refundAmount.toFixed(2)} has been processed.`,
      data: { sessionId: session.id, refundId: refundRows[0].id, refundAmount, refundPercentage },
      io,
    });
  }

  return refundRows[0];
};

export const getSessionById = async (req: AuthRequest, res: Response) => {
  const { sessionId } = req.params;
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const { rows } = await pgPool.query(
      `SELECT s.*,
              stu.name AS student_name,
              stu.profile_picture,
              mentor_user.id AS mentor_user_id,
              mentor_user.name AS mentor_name
       FROM sessions s
       JOIN users stu ON stu.id = s.student_id
       JOIN mentors m ON m.id = s.mentor_id
       JOIN users mentor_user ON mentor_user.id = m.user_id
       WHERE s.id = $1
         AND (s.student_id = $2 OR m.user_id = $2)`,
      [sessionId, userId]
    );
    if (!rows.length) return res.status(404).json({ message: "Session not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

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

    const { rowCount: availableMentorCount } = await client.query(
      `SELECT 1
       FROM mentors m
       JOIN users u ON u.id = m.user_id
       WHERE m.id = $1
         AND m.status = 'accepted'
         AND COALESCE(u.status, 'active') NOT IN ('suspended', 'banned')`,
      [mentor_id]
    );

    if (availableMentorCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Mentor not found" });
    }

    const { rowCount: bookedSlotCount } = await client.query(
      `SELECT 1
       FROM sessions
       WHERE mentor_id = $1
         AND date = $2
         AND "time" = $3
         AND status NOT IN ('Cancelled', 'Rejected')
       LIMIT 1`,
      [mentor_id, date, time]
    );

    if ((bookedSlotCount ?? 0) > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "Time slot already booked" });
    }

    const { rows: sessionRows } = await client.query(
      `INSERT INTO sessions 
       (mentor_id, student_id, date, time, course, notes, type, location, status, payment_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8, 'Pending', $9)
       RETURNING *`,
      [mentor_id, studentId, date, time, course, notes || null, type || "Online", location || null, payment_status || "Not Paid"]
    );

    const newSession = sessionRows[0];

    const { rows: mentorInfo } = await client.query(`
      SELECT m.hourly_rate, u.email as mentor_email, u.name as mentor_name 
      FROM mentors m 
      JOIN users u ON m.user_id = u.id 
      WHERE m.id = $1
    `, [mentor_id]);
    const mentorDetail = mentorInfo[0];
    const baseAmount = mentorDetail?.hourly_rate || 0;
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
        amountToCharge = Math.max(0, Number(baseAmount) - Number(discountAmount));

        if (Number(discountAmount) > Number(baseAmount)) {
          const excessCredits = Math.floor(Number(discountAmount) - Number(baseAmount));
          if (excessCredits > 0) {
            await addPoints(studentId, excessCredits, `Promo Credit Overflow: ${promo.code}`, client);
          }
        }

        await client.query("UPDATE promo_codes SET usage_count = usage_count + 1 WHERE id = $1", [promoCodeId]);
      }
    }

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

    await handleSessionBookingPoints(studentId, mentor_id, client);

    await client.query('COMMIT');

    res.status(201).json({ message: "Session booked", session: newSession });

    const io = req.app.get("io");
    const mentorUserId = await getMentorUserId(mentor_id);
    const cleanTime = newSession.time.split(':').slice(0, 2).join(':'); 
    const cleanDate = formatDate(date);
    await createNotification({
      userId: mentorUserId,
      type: "booking",
      title: "New Booking Request",
      message: `${req.user?.name || "A student"} has booked a mentorship session with you for ${cleanDate} at ${cleanTime}. Please review and respond to the booking request.`,
      data: { sessionId: newSession.id },
      io,
    });

    try {
      const details = {
        studentName: req.user?.name || "Student",
        mentorName: mentorDetail?.mentor_name || "Mentor",
        date: cleanDate,
        time: cleanTime,
        course: course,
        price: amountToCharge.toString(),
        type: type || "Online",
        location: location || null
      };

      if (req.user?.email) {
        sendSessionConfirmationEmail(req.user.email, req.user.name || "Student", details, false);
      }

      if (mentorDetail?.mentor_email) {
        sendSessionConfirmationEmail(mentorDetail.mentor_email, mentorDetail.mentor_name || "Mentor", details, true);
      }
    } catch (err) {
      console.error("Session email notification error:", err);
    }

    if (payment_status === "Paid") {
      await createNotification({
        userId: studentId,
        type: "booking",
        title: "Session Booked Successfully",
        message: `Your payment was successful and your session for ${cleanDate} at ${cleanTime} is confirmed. Awaiting mentor response.`,
        data: { sessionId: newSession.id },
        io,
      });

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
      
      return res.status(409).json({ message: "Time slot already booked" });
    }
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};

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
        AND COALESCE(u.status, 'active') NOT IN ('suspended', 'banned')
       ORDER BY s.date ASC, s.time ASC`,
      [mentorId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

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
        AND COALESCE(u.status, 'active') NOT IN ('suspended', 'banned')
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

    const io = req.app.get("io");
    const isMentor = req.user?.role === "mentor";
    const targetUserId = isMentor ? session.student_id : (await getMentorUserId(session.mentor_id));

    const cleanTime = session.time.split(':').slice(0, 2).join(':'); 
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
      await createRefundIfEligible(session, io, req.user?.role);

      await createNotification({
        userId: session.student_id,
        type: "cancellation",
        title: "Booking Rejected",
        message: `${req.user?.name || "The mentor"} has rejected your booking request for ${cleanDate} at ${cleanTime}.`,
        data: { sessionId: session.id },
        io,
      });
    } else if (status === "Cancelled") {
      await createRefundIfEligible(session, io, req.user?.role);

      await createNotification({
        userId: targetUserId,
        type: "cancellation",
        title: "Session Cancelled",
        message: `${req.user?.name || "The other participant"} has cancelled the session on ${cleanDate} at ${cleanTime}.`,
        data: { sessionId: session.id },
        io,
      });
    } else if (status === "Completed") {
      
      io.to(`session_${sessionId}`).emit("session_completed", session);

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

export const requestReschedule = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { sessionId } = req.params;
  const { newDate, newTime } = req.body;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  if (!newDate || !newTime) return res.status(400).json({ message: "New date and time required" });

  try {
    const cleanTime = newTime.split(':').slice(0, 2).join(':'); 
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

export const respondToRequest = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { sessionId } = req.params;
  const { type, action } = req.body; 
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
        const mentorUserId = await getMentorUserId(session.mentor_id);
        const cancellationRequestedByRole =
          String(session.cancel_requested_by) === String(mentorUserId) ? "mentor" : "student";

        const { rows } = await pgPool.query(
          `UPDATE sessions
           SET status = 'Cancelled',
               cancel_requested_by = NULL,
               cancel_requested_at = NULL,
               updated_at = NOW()
           WHERE id = $1
           RETURNING *`,
          [sessionId]
        );
        const cancelledSession = rows[0];
        const refund = await createRefundIfEligible(cancelledSession, io, cancellationRequestedByRole);

        res.json({
          message: refund?.refund_amount > 0
            ? "Cancellation accepted. Refund processed."
            : "Cancellation accepted. No refund is available for this cancellation window.",
          session: cancelledSession,
          refund,
        });
        await createNotification({
          userId: session.cancel_requested_by,
          type: "cancellation",
          title: "Cancellation Accepted",
          message: refund?.refund_amount > 0
            ? `${req.user?.name} has accepted the cancellation request. Your refund has been processed.`
            : `${req.user?.name} has accepted the cancellation request. This cancellation is not eligible for a refund.`,
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

async function getMentorUserId(mentorId: string) {
  const { rows } = await pgPool.query(`SELECT user_id FROM mentors WHERE id = $1`, [mentorId]);
  return rows[0]?.user_id;
}

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
