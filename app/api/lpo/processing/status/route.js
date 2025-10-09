import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://8a91e4ca3c15.ngrok-free.app';
    const apiUrl = `${apiBaseUrl}/lpo/processing/status`;

    console.log('Fetching LPO processing status from:', apiUrl);

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
    console.log('LPO Processing Status API Response:', data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('LPO processing status API error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error.message,
        data: {
          status_distribution: [],
          hourly_volume: [],
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}