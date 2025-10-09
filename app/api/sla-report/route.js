import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const apiBaseUrl = process.env.API_BASE_URL_TWO;
    const endpoint = '/sla-report';
    
    if (!apiBaseUrl) {
      throw new Error('API_BASE_URL_TWO is not configured in environment variables');
    }

    const apiUrl = `${apiBaseUrl}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
    };

    if (process.env.NGROK_SKIP_BROWSER_WARNING) {
      headers['ngrok-skip-browser-warning'] = process.env.NGROK_SKIP_BROWSER_WARNING;
    }

    const timeoutMs = parseInt(process.env.API_TIMEOUT) || 10000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(apiUrl, {
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`SLA Report API error: ${response.status} - ${errorText}`);
        // Return empty data structure instead of error
        return NextResponse.json({});
      }

      const data = await response.json();

      return NextResponse.json(data);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeoutMs}ms`);
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Error fetching SLA report data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch SLA report data',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}