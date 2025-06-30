import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    console.log('🧹 API: Starting to clear all data from Supabase tables...');
    
    const results = {
      userLocations: { success: false, count: 0, error: null },
      earthquakeEvents: { success: false, count: 0, error: null },
      sensorReadings: { success: false, count: 0, error: null },
      earthquakeReports: { success: false, count: 0, error: null }
    };

    // Clear user_locations table
    try {
      const { error: userLocationsError, count: userLocationsCount } = await supabase
        .from('user_locations')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (userLocationsError) {
        results.userLocations.error = userLocationsError.message;
      } else {
        results.userLocations.success = true;
        results.userLocations.count = userLocationsCount || 0;
      }
    } catch (error) {
      results.userLocations.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Clear earthquake_events table
    try {
      const { error: earthquakeEventsError, count: earthquakeEventsCount } = await supabase
        .from('earthquake_events')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (earthquakeEventsError) {
        results.earthquakeEvents.error = earthquakeEventsError.message;
      } else {
        results.earthquakeEvents.success = true;
        results.earthquakeEvents.count = earthquakeEventsCount || 0;
      }
    } catch (error) {
      results.earthquakeEvents.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Clear sensor_readings table
    try {
      const { error: sensorReadingsError, count: sensorReadingsCount } = await supabase
        .from('sensor_readings')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (sensorReadingsError) {
        results.sensorReadings.error = sensorReadingsError.message;
      } else {
        results.sensorReadings.success = true;
        results.sensorReadings.count = sensorReadingsCount || 0;
      }
    } catch (error) {
      results.sensorReadings.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Clear earthquake_reports table
    try {
      const { error: earthquakeReportsError, count: earthquakeReportsCount } = await supabase
        .from('earthquake_reports')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (earthquakeReportsError) {
        results.earthquakeReports.error = earthquakeReportsError.message;
      } else {
        results.earthquakeReports.success = true;
        results.earthquakeReports.count = earthquakeReportsCount || 0;
      }
    } catch (error) {
      results.earthquakeReports.error = error instanceof Error ? error.message : 'Unknown error';
    }

    // Verify tables are empty
    const verification = {
      userLocations: 0,
      earthquakeEvents: 0,
      sensorReadings: 0,
      earthquakeReports: 0
    };

    try {
      const { count: userLocationsVerify } = await supabase
        .from('user_locations')
        .select('*', { count: 'exact', head: true });
      verification.userLocations = userLocationsVerify || 0;

      const { count: earthquakeEventsVerify } = await supabase
        .from('earthquake_events')
        .select('*', { count: 'exact', head: true });
      verification.earthquakeEvents = earthquakeEventsVerify || 0;

      const { count: sensorReadingsVerify } = await supabase
        .from('sensor_readings')
        .select('*', { count: 'exact', head: true });
      verification.sensorReadings = sensorReadingsVerify || 0;

      const { count: earthquakeReportsVerify } = await supabase
        .from('earthquake_reports')
        .select('*', { count: 'exact', head: true });
      verification.earthquakeReports = earthquakeReportsVerify || 0;
    } catch (error) {
      console.error('Error during verification:', error);
    }

    const allSuccessful = results.userLocations.success && 
                         results.earthquakeEvents.success && 
                         results.sensorReadings.success &&
                         results.earthquakeReports.success;

    return Response.json({
      success: allSuccessful,
      message: allSuccessful 
        ? 'All data cleared successfully from Supabase tables' 
        : 'Some operations failed during data clearing',
      results,
      verification,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('API Error during data clearing:', error);
    
    return Response.json({
      success: false,
      message: 'Failed to clear data from Supabase tables',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}