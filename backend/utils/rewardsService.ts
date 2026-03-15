import { PoolClient } from "pg";
import { pgPool } from "../config/database";
import { createNotification } from "./notificationService";

export const addPoints = async (
  studentId: string,
  points: number,
  action: string,
  client?: PoolClient
) => {
  const query = `
    INSERT INTO rewards (student_id, action, points)
    VALUES ($1, $2, $3)
  `;
  const values = [studentId, action, points];
  
  if (client) {
    await client.query(query, values);
  } else {
    await pgPool.query(query, values);
  }

  // Generate notification (silently catches if error)
  await createNotification({
    userId: studentId,
    type: "reward",
    title: `You earned ${points} points! 🐝`,
    message: `You received +${points} points for: ${action}`,
  });
};

export const handleLoginPoints = async (studentId: string) => {
  const { rows } = await pgPool.query(
    `SELECT created_at FROM rewards 
     WHERE student_id = $1 AND action = 'Weekly Platform Activity' 
     ORDER BY created_at DESC LIMIT 1`,
    [studentId]
  );
  
  let shouldAward = false;
  const now = new Date();
  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  
  if (!rows.length) {
    const { rows: userRows } = await pgPool.query(
      `SELECT created_at FROM users WHERE id = $1`,
      [studentId]
    );
    if (userRows.length && userRows[0].created_at) {
      const accountCreated = new Date(userRows[0].created_at);
      if (now.getTime() - accountCreated.getTime() >= ONE_WEEK_MS) {
        shouldAward = true;
      }
    }
  } else {
    const lastLoginAward = new Date(rows[0].created_at);
    if (now.getTime() - lastLoginAward.getTime() >= ONE_WEEK_MS) {
      shouldAward = true;
    }
  }

  if (shouldAward) {
    await addPoints(studentId, 5, "Weekly Platform Activity");
  }
};

export const handleSessionBookingPoints = async (studentId: string, mentorId: string, client?: PoolClient) => {
  const queryRunner = client || pgPool;

  const { rows: countRows } = await queryRunner.query(
    `SELECT count(*) as count FROM sessions WHERE student_id = $1`, [studentId]
  );

  const totalBookings = parseInt(countRows[0].count);

  if (totalBookings === 1) {
     await addPoints(studentId, 15, "First Mentorship Session Booked", client);
  } else {
     const { rows: priorMentorSessions } = await queryRunner.query(
       `SELECT count(*) as count FROM sessions WHERE student_id = $1 AND mentor_id = $2`,
       [studentId, mentorId]
     );
     
     if (parseInt(priorMentorSessions[0].count) > 1) {
        await addPoints(studentId, 8, "Loyalty: Booked same mentor", client);
     }
  }
};

export const handleSessionCompletionPoints = async (studentId: string, mentorId: string, client?: PoolClient) => {
   const queryRunner = client || pgPool;
   
   await addPoints(studentId, 10, "Completed a Mentorship Session", client);

   const { rows: completedRows } = await queryRunner.query(
     `SELECT count(*) as count FROM sessions WHERE student_id = $1 AND status = 'Completed'`,
     [studentId]
   );
   const totalCompleted = parseInt(completedRows[0].count);

   if (totalCompleted === 5) {
     await addPoints(studentId, 25, "Milestone: 5 Sessions Completed", client);
   } else if (totalCompleted === 10) {
     await addPoints(studentId, 50, "Milestone: 10 Sessions Completed", client);
   }

   const { rows: completedWithMentor } = await queryRunner.query(
      `SELECT count(*) as count FROM sessions WHERE student_id = $1 AND mentor_id = $2 AND status = 'Completed'`,
      [studentId, mentorId]
   );
   
   if (parseInt(completedWithMentor[0].count) === 1) {
      await addPoints(studentId, 10, "First session with new mentor", client);
   }
};
