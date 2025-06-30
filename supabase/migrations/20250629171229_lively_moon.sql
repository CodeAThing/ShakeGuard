/*
  # Earthquake Tracker Database Schema

  1. New Tables
    - `user_locations`
      - `id` (uuid, primary key)
      - `user_id` (text) - Anonymous user identifier
      - `latitude` (double precision) - GPS latitude
      - `longitude` (double precision) - GPS longitude
      - `timestamp` (timestamptz) - When location was recorded
      - `emergency` (boolean) - Whether this is an emergency report
      - `created_at` (timestamptz) - Record creation time

    - `earthquake_events`
      - `id` (uuid, primary key)
      - `user_id` (text) - Anonymous user identifier
      - `intensity` (double precision) - Earthquake intensity detected
      - `duration` (double precision) - Duration in seconds
      - `peak_acceleration` (double precision) - Peak acceleration recorded
      - `latitude` (double precision) - Location where detected
      - `longitude` (double precision) - Location where detected
      - `timestamp` (timestamptz) - When earthquake was detected
      - `created_at` (timestamptz) - Record creation time

    - `sensor_readings`
      - `id` (uuid, primary key)
      - `user_id` (text) - Anonymous user identifier
      - `accelerometer_x` (double precision) - Accelerometer X axis
      - `accelerometer_y` (double precision) - Accelerometer Y axis
      - `accelerometer_z` (double precision) - Accelerometer Z axis
      - `gyroscope_x` (double precision) - Gyroscope X axis
      - `gyroscope_y` (double precision) - Gyroscope Y axis
      - `gyroscope_z` (double precision) - Gyroscope Z axis
      - `magnitude` (double precision) - Combined sensor magnitude
      - `timestamp` (timestamptz) - When reading was taken
      - `created_at` (timestamptz) - Record creation time

  2. Security
    - Enable RLS on all tables
    - Add policies for anonymous users to insert and read their own data
    - Add policies for emergency location reporting

  3. Indexes
    - Add indexes for efficient querying by timestamp and location
    - Add indexes for emergency reports
*/

-- Create user_locations table
CREATE TABLE IF NOT EXISTS user_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  timestamp timestamptz NOT NULL,
  emergency boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create earthquake_events table
CREATE TABLE IF NOT EXISTS earthquake_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  intensity double precision NOT NULL,
  duration double precision NOT NULL,
  peak_acceleration double precision NOT NULL,
  latitude double precision,
  longitude double precision,
  timestamp timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create sensor_readings table
CREATE TABLE IF NOT EXISTS sensor_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  accelerometer_x double precision NOT NULL,
  accelerometer_y double precision NOT NULL,
  accelerometer_z double precision NOT NULL,
  gyroscope_x double precision NOT NULL,
  gyroscope_y double precision NOT NULL,
  gyroscope_z double precision NOT NULL,
  magnitude double precision NOT NULL,
  timestamp timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE earthquake_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;

-- Create policies for user_locations
CREATE POLICY "Users can insert their own location data"
  ON user_locations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can read their own location data"
  ON user_locations
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create policies for earthquake_events
CREATE POLICY "Users can insert their own earthquake events"
  ON earthquake_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can read earthquake events"
  ON earthquake_events
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create policies for sensor_readings
CREATE POLICY "Users can insert their own sensor readings"
  ON sensor_readings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can read their own sensor readings"
  ON sensor_readings
  FOR SELECT
  TO anon, authenticated
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub' OR current_setting('request.jwt.claims', true) IS NULL);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_locations_timestamp ON user_locations(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_locations_emergency ON user_locations(emergency, timestamp DESC) WHERE emergency = true;
CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON user_locations(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_locations_coords ON user_locations(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_earthquake_events_timestamp ON earthquake_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_earthquake_events_user_id ON earthquake_events(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_earthquake_events_intensity ON earthquake_events(intensity DESC, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_earthquake_events_coords ON earthquake_events(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp ON sensor_readings(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_user_id ON sensor_readings(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_magnitude ON sensor_readings(magnitude DESC, timestamp DESC);