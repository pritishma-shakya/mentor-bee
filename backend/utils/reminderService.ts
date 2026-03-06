import { pgPool } from "../config/database";
import { createNotification } from "./notificationService";

export const startReminderService = () => {
    // Check every 5 minutes
    setInterval(async () => {
        try {
            const io = (global as any).io;
            if (!io) return;

            // Find sessions starting in the next 30 minutes that haven't been notified
            // Using a 40 minute window to be safe but marking as sent to avoid duplicates
            const { rows: sessions } = await pgPool.query(`
                SELECT s.*, u_student.name as student_name, u_mentor.name as mentor_name, 
                       m.user_id as mentor_user_id
                FROM sessions s
                JOIN users u_student ON s.student_id = u_student.id
                JOIN mentors m ON s.mentor_id = m.id
                JOIN users u_mentor ON m.user_id = u_mentor.id
                WHERE s.status = 'Accepted' 
                  AND s.reminder_sent = FALSE
                  AND (s.date + s.time) <= (NOW() + INTERVAL '35 minutes')
                  AND (s.date + s.time) >= NOW()
            `);

            for (const session of sessions) {
                const cleanTime = session.time.split(':').slice(0, 2).join(':'); // HH:MM
                // Notify Student
                await createNotification({
                    userId: session.student_id,
                    type: "reminder",
                    title: "Upcoming Session Reminder",
                    message: `Your session with ${session.mentor_name} on ${session.date} at ${cleanTime} starts in less than 30 minutes!`,
                    data: { sessionId: session.id },
                    io
                });

                // Notify Mentor
                await createNotification({
                    userId: session.mentor_user_id,
                    type: "reminder",
                    title: "Upcoming Session Reminder",
                    message: `Your session with ${session.student_name} on ${session.date} at ${cleanTime} starts in less than 30 minutes!`,
                    data: { sessionId: session.id },
                    io
                });

                // Mark as sent
                await pgPool.query(`UPDATE sessions SET reminder_sent = TRUE WHERE id = $1`, [session.id]);
            }
        } catch (error) {
            console.error("Reminder service error:", error);
        }
    }, 5 * 60 * 1000); // 5 minutes
};
