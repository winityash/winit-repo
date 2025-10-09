import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiBaseUrl = process.env.API_BASE_URL;
    const queueStatusEndpoint = process.env.QUEUE_STATUS_ENDPOINT || '/queue/status';
    
    if (!apiBaseUrl) {
      throw new Error('API_BASE_URL is not configured in environment variables');
    }

    const apiUrl = `${apiBaseUrl}${queueStatusEndpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
    };

    if (process.env.NGROK_SKIP_BROWSER_WARNING) {
      headers['ngrok-skip-browser-warning'] = process.env.NGROK_SKIP_BROWSER_WARNING;
    }

    const timeoutMs = parseInt(process.env.API_TIMEOUT) || 3000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(apiUrl, {
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
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
    console.error('Error fetching queue status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch queue status',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}