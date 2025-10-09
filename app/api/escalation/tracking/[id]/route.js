import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const conversationId = params.id;

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    const apiBaseUrl = process.env.API_BASE_URL;

    if (!apiBaseUrl) {
      throw new Error('API_BASE_URL is not configured');
    }

    const headers = {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true'
    };

    const apiUrl = `${apiBaseUrl}/escalation/tracking/${conversationId}`;

    const response = await fetch(apiUrl, {
      headers,
      method: 'GET'
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    } else {
      const errorText = await response.text();
      console.error('Tracking API error:', response.status, errorText);
      return NextResponse.json(
        { timeline: [], error: 'No tracking data available' },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('Error fetching escalation tracking:', error);
    return NextResponse.json(
      { timeline: [], error: error.message },
      { status: 500 }
    );
  }
}
