import { NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL_TWO || process.env.NEXT_PUBLIC_API_BASE_URL || 'https://e8a4eb9316cc.ngrok-free.app';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || '';

    const url = date
      ? `${API_BASE_URL}/issue-distribution?date=${date}`
      : `${API_BASE_URL}/issue-distribution`;

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
    console.error('Error fetching issue distribution:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch issue distribution', error: error.message },
      { status: 500 }
    );
  }
}
