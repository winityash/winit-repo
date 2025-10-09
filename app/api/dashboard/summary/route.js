import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiBaseUrl = process.env.API_BASE_URL || 'https://8a91e4ca3c15.ngrok-free.app';
    const apiUrl = `${apiBaseUrl}/dashboard/summary`;
    
    console.log('Fetching from:', apiUrl);
    
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
    console.log('API Response:', data);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Dashboard summary API error:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: error.message,
        data: {
          today: {
            emails_processed: 0,
            pdfs_extracted: 0,
            avg_processing_time: 0,
            success_rate: 0
          },
          week: {
            emails_processed: 0,
            pdfs_extracted: 0,
            avg_processing_time: 0
          }
        }
      }, 
      { status: 500 }
    );
  }
}