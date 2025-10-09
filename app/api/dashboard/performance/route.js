import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const metricType = searchParams.get('metric_type') || process.env.DEFAULT_METRIC_TYPE || 'processing_time';
    const days = searchParams.get('days') || process.env.DEFAULT_DAYS || '7';
    const includeEmailDetails = searchParams.get('include_email_details') || process.env.DEFAULT_INCLUDE_EMAIL_DETAILS || 'true';

    const apiBaseUrl = process.env.API_BASE_URL;
    const performanceEndpoint = process.env.DASHBOARD_PERFORMANCE_ENDPOINT || '/dashboard/performance-chart';
    
    if (!apiBaseUrl) {
      throw new Error('API_BASE_URL is not configured in environment variables');
    }

    const apiUrl = `${apiBaseUrl}${performanceEndpoint}?metric_type=${metricType}&days=${days}&include_email_details=${includeEmailDetails}`;
    
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
    console.error('Error fetching performance data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch performance data',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}