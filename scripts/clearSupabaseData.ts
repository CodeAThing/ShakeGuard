import { supabase } from '@/lib/supabase';

/**
 * Clear all data from Supabase tables
 * This script will delete all rows from user_locations, earthquake_events, and sensor_readings tables
 * while preserving the table structure and schema
 */
async function clearAllData() {
  console.log('🧹 Starting to clear all data from Supabase tables...');
  
  try {
    // Clear user_locations table
    console.log('Clearing user_locations table...');
    const { error: userLocationsError, count: userLocationsCount } = await supabase
      .from('user_locations')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows (using a condition that matches all)

    if (userLocationsError) {
      console.error('Error clearing user_locations:', userLocationsError);
    } else {
      console.log(`✅ Cleared ${userLocationsCount || 'all'} rows from user_locations table`);
    }

    // Clear earthquake_events table
    console.log('Clearing earthquake_events table...');
    const { error: earthquakeEventsError, count: earthquakeEventsCount } = await supabase
      .from('earthquake_events')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

    if (earthquakeEventsError) {
      console.error('Error clearing earthquake_events:', earthquakeEventsError);
    } else {
      console.log(`✅ Cleared ${earthquakeEventsCount || 'all'} rows from earthquake_events table`);
    }

    // Clear sensor_readings table
    console.log('Clearing sensor_readings table...');
    const { error: sensorReadingsError, count: sensorReadingsCount } = await supabase
      .from('sensor_readings')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

    if (sensorReadingsError) {
      console.error('Error clearing sensor_readings:', sensorReadingsError);
    } else {
      console.log(`✅ Cleared ${sensorReadingsCount || 'all'} rows from sensor_readings table`);
    }

    console.log('🎉 Successfully cleared all data from Supabase tables!');
    console.log('📋 Table structures and schemas remain intact');
    
    // Verify tables are empty
    console.log('\n🔍 Verifying tables are empty...');
    
    const { count: userLocationsVerify } = await supabase
      .from('user_locations')
      .select('*', { count: 'exact', head: true });
    
    const { count: earthquakeEventsVerify } = await supabase
      .from('earthquake_events')
      .select('*', { count: 'exact', head: true });
    
    const { count: sensorReadingsVerify } = await supabase
      .from('sensor_readings')
      .select('*', { count: 'exact', head: true });

    console.log(`user_locations: ${userLocationsVerify || 0} rows remaining`);
    console.log(`earthquake_events: ${earthquakeEventsVerify || 0} rows remaining`);
    console.log(`sensor_readings: ${sensorReadingsVerify || 0} rows remaining`);

  } catch (error) {
    console.error('❌ Error during data clearing process:', error);
    throw error;
  }
}

// Execute the clearing function
clearAllData()
  .then(() => {
    console.log('\n✨ Data clearing completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Data clearing failed:', error);
    process.exit(1);
  });