Created new migration at supabase\migrations\20250324035930_create_user_profiles.sql
-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR NOT NULL,
  auth_id UUID NOT NULL,
  name VARCHAR NOT NULL,
  avatar_url VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, auth_id)
);

-- Create RLS policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read only their own profiles
CREATE POLICY "Users can read their own profiles"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = auth_id);

-- Policy to allow users to insert their own profiles
CREATE POLICY "Users can insert their own profiles"
  ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = auth_id);

-- Policy to allow users to update their own profiles
CREATE POLICY "Users can update their own profiles"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = auth_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();