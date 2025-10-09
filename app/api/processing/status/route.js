import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const apiBaseUrl = process.env.API_BASE_URL || 'https://8a91e4ca3c15.ngrok-free.app';

    // Get date parameters from query string
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Build query string with date filters
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);

    const queryString = queryParams.toString();
    const apiUrl = `${apiBaseUrl}/lpo/processing/status${queryString ? `?${queryString}` : ''}`;

    console.log('Fetching processing status from:', apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      cache: 'no-cache'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Processing Status API Response:', data);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Processing status API error:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: error.message,
        data: {
          status_distribution: [],
          hourly_volume: [],
          timestamp: null
        }
      }, 
      { status: 500 }
    );
  }
}
