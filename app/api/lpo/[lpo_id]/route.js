import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { lpo_id } = params;

    if (!lpo_id) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'LPO ID is required'
        },
        { status: 400 }
      );
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://8a91e4ca3c15.ngrok-free.app';

    let data;

    try {
      const response = await fetch(`${apiBaseUrl}/lpo/${lpo_id}`, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      data = await response.json();
    } catch (fetchError) {
      console.warn('External API unavailable:', fetchError.message);
      return NextResponse.json(
        {
          status: 'error',
          message: 'External API unavailable',
          error: fetchError.message
        },
        { status: 503 }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching LPO details:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to fetch LPO details',
        error: error.message
      },
      { status: 500 }
    );
  }
}