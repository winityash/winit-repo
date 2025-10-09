import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://8a91e4ca3c15.ngrok-free.app';

    // Get date parameters from query string
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Build query string with date filters
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);

    const queryString = queryParams.toString();
    const url = `${apiBaseUrl}/dashboard/overview${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to fetch dashboard overview',
        error: error.message
      },
      { status: 500 }
    );
  }
}