// Helper to create standardized proxy routes
import { NextResponse } from 'next/server';

// Require environment variables - no fallback URLs for security
const API_BASE_URL = process.env.API_BASE_URL;
const API_BASE_URL_TWO = process.env.API_BASE_URL_TWO;

if (!API_BASE_URL || !API_BASE_URL_TWO) {
  console.error('CRITICAL: API_BASE_URL and API_BASE_URL_TWO must be set in environment variables');
}

const headers = {
  'ngrok-skip-browser-warning': 'true',
  'Content-Type': 'application/json'
};

export async function proxyRequest(endpoint, options = {}) {
  try {
    // Use API_BASE_URL_TWO for settings and user management endpoints
    const baseUrl = endpoint.includes('/api/users') ||
                    endpoint.includes('/api/communication-templates') ||
                    endpoint.includes('/api/template-placeholders') ||
                    endpoint.includes('/api/system-configuration') ||
                    endpoint.includes('/api/price-tolerance') ||
                    endpoint.includes('/api/uom-') ||
                    endpoint.includes('/api/quantity-deviation') ||
                    endpoint.includes('/api/site-validation') ||
                    endpoint.includes('/api/business-rules') ||
                    endpoint.includes('/api/escalation-')
                    ? API_BASE_URL_TWO : API_BASE_URL;

    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API responded with status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error with ${endpoint}:`, error.message);
    // Don't expose internal error details to client
    return NextResponse.json(
      { status: 'error', message: 'An error occurred processing your request' },
      { status: 500 }
    );
  }
}
