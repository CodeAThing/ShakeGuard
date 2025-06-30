/*
  # Create earthquake_reports table

  1. New Tables
    - `earthquake_reports`
      - `id` (uuid, primary key)
      - `user_id` (text, not null)
      - `latitude` (double precision, not null)
      - `longitude` (double precision, not null)
      - `intensity` (double precision, not null, 1-10 range)
      - `description` (text, optional)
      - `timestamp` (timestamptz, not null)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `earthquake_reports` table
    - Add policy for anyone to read earthquake reports
    - Add policy for users to insert earthquake reports

  3. Performance
    - Index on timestamp for chronological queries
    - Index on coordinates for spatial queries
    - Index on intensity and timestamp for filtering

  4. Sample Data
    - Insert test earthquake reports for development
*/

-- Create earthquake_reports table
CREATE TABLE IF NOT EXISTS earthquake_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  intensity double precision NOT NULL CHECK (intensity >= 1 AND intensity <= 10),
  description text DEFAULT '',
  timestamp timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE earthquake_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DO $$
BEGIN
  DROP POLICY IF EXISTS "Anyone can read earthquake reports" ON earthquake_reports;
  DROP POLICY IF EXISTS "Users can insert earthquake reports" ON earthquake_reports;
EXCEPTION
  WHEN undefined_object THEN
    -- Policies don't exist, continue
    NULL;
END $$;

-- Create policies for earthquake_reports
CREATE POLICY "Anyone can read earthquake reports"
  ON earthquake_reports
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can insert earthquake reports"
  ON earthquake_reports
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_earthquake_reports_timestamp ON earthquake_reports(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_earthquake_reports_coords ON earthquake_reports(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_earthquake_reports_intensity ON earthquake_reports(intensity DESC, timestamp DESC);

-- Insert sample data only if table is empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM earthquake_reports LIMIT 1) THEN
    INSERT INTO earthquake_reports (user_id, latitude, longitude, intensity, description, timestamp) VALUES
      ('sample-user-1', 40.7128, -74.0060, 3.2, 'Felt light shaking in Manhattan office building', now() - interval '2 hours'),
      ('sample-user-2', 40.7589, -73.9851, 4.1, 'Strong vibrations felt in Central Park area', now() - interval '4 hours'),
      ('sample-user-3', 40.6782, -73.9442, 2.8, 'Brief tremor noticed in Brooklyn', now() - interval '6 hours'),
      ('sample-user-4', 40.7505, -73.9934, 5.2, 'Significant shaking, books fell from shelves', now() - interval '8 hours'),
      ('sample-user-5', 40.7282, -74.0776, 3.7, 'Moderate earthquake felt in Jersey City', now() - interval '12 hours');
  END IF;
END $$;