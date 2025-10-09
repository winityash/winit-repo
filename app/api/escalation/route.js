import { NextResponse } from 'next/server';
import { validateQueryParams, handleValidationError } from '@/lib/validation/middleware';
import { escalationModeSchema } from '@/lib/validation/schemas';
import { applyRateLimit } from '@/lib/rate-limit';

export async function GET(request) {
  try {
    // Rate limiting
    const rateLimitResponse = await applyRateLimit(request, 30);
    if (rateLimitResponse) return rateLimitResponse;

    // Validate query parameters
    const params = validateQueryParams(request, escalationModeSchema);
    const { mode } = params;

    const apiBaseUrl = process.env.API_BASE_URL_TWO;

    if (!apiBaseUrl) {
      throw new Error('API_BASE_URL_TWO is not configured in environment variables');
    }

    const headers = {
      'Content-Type': 'application/json',
    };

    if (process.env.NGROK_SKIP_BROWSER_WARNING) {
      headers['ngrok-skip-browser-warning'] = process.env.NGROK_SKIP_BROWSER_WARNING;
    }

    const timeoutMs = parseInt(process.env.API_TIMEOUT) || 10000;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const apiUrl = `${apiBaseUrl}/status/${mode}`;
      const response = await fetch(apiUrl, {
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        // Handle both direct response and nested status object
        const statusData = data.status || data;
        return NextResponse.json({
          status: {
            processing: statusData.processing || 0,
            pending: statusData.pending || 0,
            solved: statusData.solved || 0
          }
        });
      } else {
        const errorText = await response.text();
        console.warn(`Failed to fetch ${mode} data: ${response.status} - ${errorText}`);
        return NextResponse.json({
          status: {
            processing: 0,
            pending: 0,
            solved: 0
          }
        });
      }
    } catch (fetchError) {
      console.warn(`Error fetching ${mode} data:`, fetchError.message);
      return NextResponse.json({
        status: {
          processing: 0,
          pending: 0,
          solved: 0
        }
      });
    }
  } catch (error) {
    const validationError = handleValidationError(error);
    if (validationError) return validationError;

    console.error('[Escalation API] Error:', error.message);
    return NextResponse.json(
      {
        error: 'An error occurred processing your request'
      },
      { status: 500 }
    );
  }
}