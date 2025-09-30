-- Create tables for the hugfeed application

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  user_id VARCHAR(255) PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create calendar table  
CREATE TABLE IF NOT EXISTS calendar (
  user_id VARCHAR(255) PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_profile table
CREATE TABLE IF NOT EXISTS user_profile (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  pronouns VARCHAR(100),
  goals JSONB DEFAULT '[]'::jsonb,
  preferred_activities JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_user_id ON calendar(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profile_id ON user_profile(id);

-- Add update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_updated_at BEFORE UPDATE ON calendar 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profile_updated_at BEFORE UPDATE ON user_profile 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();