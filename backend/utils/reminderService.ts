import { pgPool } from "../config/database";
import { createNotification } from "./notificationService";
import { handleSessionCompletionPoints } from "./rewardsService";

export const startReminderService = () => {
    // Check every 5 minutes
    setInterval(async () => {
        try {
            const io = (global as any).io;
            if (!io) return;

            const { rows: sessions } = await pgPool.query(`
                SELECT s.*, u_student.name as student_name, u_mentor.name as mentor_name, 
                       m.user_id as mentor_user_id
                FROM sessions s
                JOIN users u_student ON s.student_id = u_student.id
                JOIN mentors m ON s.mentor_id = m.id
                JOIN users u_mentor ON m.user_id = u_mentor.id
                WHERE s.status = 'Accepted' 
                  AND (s.date + s.time) >= NOW()
            `);

            const now = new Date();

            for (const session of sessions) {
                const sessionDateStr = session.date instanceof Date ? session.date.toISOString().split('T')[0] : session.date;
                const sessionDateTime = new Date(`${sessionDateStr}T${session.time}`);
                
                if (isNaN(sessionDateTime.getTime())) continue;

                const diffMs = sessionDateTime.getTime() - now.getTime();
                const diffHours = diffMs / (1000 * 60 * 60);
                const diffMinutes = diffMs / (1000 * 60);

                const cleanTime = session.time.split(':').slice(0, 2).join(':'); 
                const cleanDate = sessionDateStr;

                const sendReminder = async (intervalLabel: string, column: string) => {
                    // Notify Student
                    await createNotification({
                        userId: session.student_id,
                        type: "reminder",
                        title: "Upcoming Session Reminder",
                        message: `Your session with ${session.mentor_name} on ${cleanDate} at ${cleanTime} starts in ${intervalLabel}!`,
                        data: { sessionId: session.id },
                        io
                    });

                    // Notify Mentor
                    await createNotification({
                        userId: session.mentor_user_id,
                        type: "reminder",
                        title: "Upcoming Session Reminder",
                        message: `Your session with ${session.student_name} on ${cleanDate} at ${cleanTime} starts in ${intervalLabel}!`,
                        data: { sessionId: session.id },
                        io
                    });

                    // Mark as sent
                    await pgPool.query(`UPDATE sessions SET ${column} = TRUE WHERE id = $1`, [session.id]);
                };

                // Check 24 hours (between 23.5 and 24 hours to give a 30m window)
                if (!session.reminder_24h_sent && diffHours <= 24 && diffHours > 23.5) {
                    await sendReminder("24 hours", "reminder_24h_sent");
                }
                // Check 12 hours
                else if (!session.reminder_12h_sent && diffHours <= 12 && diffHours > 11.5) {
                    await sendReminder("12 hours", "reminder_12h_sent");
                }
                // Check 6 hours
                else if (!session.reminder_6h_sent && diffHours <= 6 && diffHours > 5.5) {
                    await sendReminder("6 hours", "reminder_6h_sent");
                }
                // Check 1 hour
                else if (!session.reminder_1h_sent && diffHours <= 1 && diffHours > 0.5) {
                    await sendReminder("1 hour", "reminder_1h_sent");
                }
                // Check 10 minutes (between 5 and 10 mins)
                else if (!session.reminder_10m_sent && diffMinutes <= 10 && diffMinutes > 5) {
                    await sendReminder("10 minutes", "reminder_10m_sent");
                }
            }

            // --- AUTO-COMPLETE STARTED SESSIONS (AFTER 1 HOUR) ---
            const { rows: startedSessions } = await pgPool.query(`
                SELECT s.*, m.user_id as mentor_user_id
                FROM sessions s
                JOIN mentors m ON s.mentor_id = m.id
                WHERE s.status = 'Started' 
                  AND s.updated_at <= NOW() - INTERVAL '1 hour'
            `);

            for (const session of startedSessions) {
                try {
                    await pgPool.query(`
                        UPDATE sessions 
                        SET status = 'Completed', 
                            updated_at = NOW() 
                        WHERE id = $1
                    `, [session.id]);

                    // Emit event to notify any active participants
                    io.to(`session_${session.id}`).emit("session_completed", session);

                    // Process rewards
                    try {
                        await handleSessionCompletionPoints(session.student_id, session.mentor_id);
                    } catch (rewardError) {
                        console.error(`Reward processing failed for session ${session.id}:`, rewardError);
                    }

                    console.log(`Auto-completed session ${session.id} after 1 hour timeout`);
                } catch (sessionError) {
                    console.error(`Error auto-completing session ${session.id}:`, sessionError);
                }
            }
        } catch (error) {
            console.error("Reminder service error:", error);
        }
    }, 5 * 60 * 1000); // 5 minutes
};
