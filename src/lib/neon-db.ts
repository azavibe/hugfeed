import { Pool } from '@neondatabase/serverless';

// You should set NEON_DATABASE_URL in your .env file
console.log('DEBUG: NEON_DATABASE_URL:', process.env.NEON_DATABASE_URL);

if (!process.env.NEON_DATABASE_URL || process.env.NEON_DATABASE_URL === 'your_neon_database_url_here') {
  console.warn('NEON_DATABASE_URL is not set or is using placeholder value. Database operations will fail.');
}

const pool = new Pool({ connectionString: process.env.NEON_DATABASE_URL });

// Calendar CRUD
export async function getCalendarData(userId: string) {
  const result = await pool.query(
    'SELECT data FROM calendar WHERE user_id = $1',
    [userId]
  );
  if (result.rows.length === 0) return null;
  try {
    return JSON.parse(result.rows[0].data);
  } catch (error) {
    console.error('Error parsing calendar data:', error);
    return null;
  }
}

export async function setCalendarData(userId: string, calendarData: any) {
  let jsonString: string;
  
  if (typeof calendarData === 'string') {
    // Validate the string is valid JSON
    try {
      JSON.parse(calendarData);
      jsonString = calendarData;
    } catch {
      throw new Error('Invalid JSON string provided');
    }
  } else {
    // Convert object to JSON string
    try {
      jsonString = JSON.stringify(calendarData);
      // Validate the stringified result
      JSON.parse(jsonString);
    } catch {
      throw new Error('Unable to serialize calendar data to JSON');
    }
  }
  
  await pool.query(
    `INSERT INTO calendar (user_id, data)
     VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data`,
    [userId, jsonString]
  );
}

// Messages CRUD
export async function getMessages(userId: string) {
  try {
    const result = await pool.query(
      'SELECT data FROM messages WHERE user_id = $1',
      [userId]
    );
    if (result.rows.length === 0) return null;
    try {
      return JSON.parse(result.rows[0].data);
    } catch (error) {
      console.error('Error parsing messages data:', error);
      return null;
    }
  } catch (error) {
    console.error('Error getting messages:', error);
    throw error;
  }
}

export async function setMessages(userId: string, messages: any) {
  try {
    console.log('setMessages called with:', { userId, messages, messagesType: typeof messages });
    let jsonString: string;
    
    if (typeof messages === 'string') {
      console.log('Messages is already a string:', messages);
      // Validate the string is valid JSON
      try {
        JSON.parse(messages);
        jsonString = messages;
      } catch {
        throw new Error('Invalid JSON string provided');
      }
    } else {
      // Convert object to JSON string
      try {
        console.log('Converting messages to JSON string:', messages);
        jsonString = JSON.stringify(messages);
        console.log('Stringified result:', jsonString);
        // Validate the stringified result
        JSON.parse(jsonString);
      } catch (error) {
        console.error('Serialization error:', error);
        throw new Error('Unable to serialize messages data to JSON');
      }
    }
    
    await pool.query(
      `INSERT INTO messages (user_id, data)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data`,
      [userId, jsonString]
    );
  } catch (error) {
    console.error('Error setting messages:', error);
    throw error;
  }
}

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
    goals: row.goals ? (() => {
      try {
        return JSON.parse(row.goals);
      } catch {
        return [];
      }
    })() : [],
    preferredActivities: row.preferred_activities ? (() => {
      try {
        return JSON.parse(row.preferred_activities);
      } catch {
        return [];
      }
    })() : [],
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
