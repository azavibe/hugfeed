// Calendar CRUD
export async function getCalendarData(userId: string) {
  const result = await pool.query(
    'SELECT data FROM calendar WHERE user_id = $1',
    [userId]
  );
  if (result.rows.length === 0) return null;
  return JSON.parse(result.rows[0].data);
}

export async function setCalendarData(userId: string, calendarData: any) {
  await pool.query(
    `INSERT INTO calendar (user_id, data)
     VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data`,
    [userId, JSON.stringify(calendarData)]
  );
}

// Messages CRUD
export async function getMessages(userId: string) {
  const result = await pool.query(
    'SELECT data FROM messages WHERE user_id = $1',
    [userId]
  );
  if (result.rows.length === 0) return null;
  return JSON.parse(result.rows[0].data);
}

export async function setMessages(userId: string, messages: any) {
  await pool.query(
    `INSERT INTO messages (user_id, data)
     VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data`,
    [userId, JSON.stringify(messages)]
  );
}
import { Pool } from '@neondatabase/serverless';

// You should set NEON_DATABASE_URL in your .env file
console.log('DEBUG: NEON_DATABASE_URL:', process.env.NEON_DATABASE_URL);
const pool = new Pool({ connectionString: process.env.NEON_DATABASE_URL });

export async function getUserProfile(id: string) {
  const result = await pool.query(
    'SELECT id, name, pronouns, goals, preferred_activities FROM user_profile WHERE id = $1',
    [id]
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    id: row.id,
    name: row.name,
    pronouns: row.pronouns,
    goals: row.goals ? JSON.parse(row.goals) : [],
    preferredActivities: row.preferred_activities ? JSON.parse(row.preferred_activities) : [],
  };
}

export async function setUserProfile(profile: {
  id: string;
  name: string;
  pronouns?: string;
  goals?: string[];
  preferredActivities?: string[];
}) {
  await pool.query(
    `INSERT INTO user_profile (id, name, pronouns, goals, preferred_activities)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (id) DO UPDATE SET
       name = EXCLUDED.name,
       pronouns = EXCLUDED.pronouns,
       goals = EXCLUDED.goals,
       preferred_activities = EXCLUDED.preferred_activities`,
    [
      profile.id,
      profile.name,
      profile.pronouns ?? '',
      JSON.stringify(profile.goals ?? []),
      JSON.stringify(profile.preferredActivities ?? [])
    ]
  );
}
