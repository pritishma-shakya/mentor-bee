import { pgPool } from "../config/database";

export interface Schedule {
  id: number;
  mentor_id: string;
  date: string; 
  times: string[]; 
  created_at: string;
  updated_at: string;
}

export const getMentorSchedules = async (mentorId: string): Promise<Schedule[]> => {
  const { rowCount: visibleMentorCount } = await pgPool.query(
    `SELECT 1
     FROM mentors m
     JOIN users u ON u.id = m.user_id
     WHERE m.id = $1
       AND m.status = 'accepted'
       AND COALESCE(u.status, 'active') NOT IN ('suspended', 'banned')`,
    [mentorId]
  );

  if (visibleMentorCount === 0) {
    return [];
  }

  const { rows: schedules } = await pgPool.query(
    `SELECT * FROM schedules WHERE mentor_id=$1 ORDER BY date ASC`,
    [mentorId]
  );

  const { rows: sessions } = await pgPool.query(
    `SELECT date, time FROM sessions WHERE mentor_id=$1 AND status NOT IN ('Cancelled', 'Rejected')`,
    [mentorId]
  );

  return schedules.map(r => {
    const rawTimes = typeof r.times === "string" ? JSON.parse(r.times) : r.times;
    const scheduleDate = r.date; 

    const formatDate = (date: any) => {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const normalizeTime = (time: string) => {
      const t = time.trim().toLowerCase();
      let hours = 0, minutes = 0;
      if (t.includes('am') || t.includes('pm')) {
        const match = t.match(/(\d+):(\d+)\s*(am|pm)/);
        if (match) {
          hours = parseInt(match[1]);
          minutes = parseInt(match[2]);
          const modifier = match[3];
          if (modifier === 'pm' && hours < 12) hours += 12;
          if (modifier === 'am' && hours === 12) hours = 0;
        }
      } else {
        const parts = t.split(':');
        hours = parseInt(parts[0]);
        minutes = parseInt(parts[1]) || 0;
      }
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    };

    const filteredTimes = rawTimes.filter((t: string) => {
      return !sessions.some((s: any) => {
        const sessionDateStr = formatDate(s.date);
        const scheduleDateStr = formatDate(scheduleDate);
        return sessionDateStr === scheduleDateStr && normalizeTime(s.time) === normalizeTime(t);
      });
    });

    return { ...r, times: filteredTimes };
  });
};

export const upsertSchedule = async (
  mentorId: string,
  date: string,
  times: string[],
  originalDate?: string
): Promise<Schedule> => {
  if (originalDate && originalDate !== date) {
    
    const { rows } = await pgPool.query(
      `UPDATE schedules
       SET date=$1, times=$2, updated_at=now()
       WHERE mentor_id=$3 AND date=$4
       RETURNING *`,
      [date, JSON.stringify(times), mentorId, originalDate]
    );
    return rows[0];
  } else {
    
    const { rows } = await pgPool.query(
      `INSERT INTO schedules (mentor_id, date, times)
       VALUES ($1, $2, $3)
       ON CONFLICT (mentor_id, date)
       DO UPDATE SET times = EXCLUDED.times, updated_at = now()
       RETURNING *`,
      [mentorId, date, JSON.stringify(times)]
    );
    return rows[0];
  }
};

export const deleteSchedule = async (mentorId: string, date: string): Promise<void> => {
  await pgPool.query(
    `DELETE FROM schedules WHERE mentor_id=$1 AND date=$2`,
    [mentorId, date]
  );
};
