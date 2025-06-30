import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface UserLocation {
  id?: string;
  user_id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  emergency: boolean;
}

export interface EarthquakeEvent {
  id?: string;
  user_id: string;
  intensity: number;
  duration: number;
  peak_acceleration: number;
  latitude?: number;
  longitude?: number;
  timestamp: string;
}

export interface SensorReading {
  id?: string;
  user_id: string;
  accelerometer_x: number;
  accelerometer_y: number;
  accelerometer_z: number;
  gyroscope_x: number;
  gyroscope_y: number;
  gyroscope_z: number;
  magnitude: number;
  timestamp: string;
}

export interface EarthquakeReport {
  id?: string;
  user_id: string;
  latitude: number;
  longitude: number;
  intensity: number;
  description?: string;
  timestamp: string;
  created_at?: string;
}