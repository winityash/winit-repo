import { NextResponse } from 'next/server';
import { validateQueryParams, handleValidationError } from '@/lib/validation/middleware';
import { lpoQueueQuerySchema } from '@/lib/validation/schemas';
import { applyRateLimit } from '@/lib/rate-limit';

export async function GET(request) {
  try {
    // Rate limiting
    const rateLimitResponse = await applyRateLimit(request, 30);
    if (rateLimitResponse) return rateLimitResponse;

    // Validate query parameters
    const params = validateQueryParams(request, lpoQueueQuerySchema);
    const { page, limit, urgency_level, customer, sla_status, channel, sort_by, sort_order } = params;

    // Get date parameters from query string
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const date = searchParams.get('date');

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!apiBaseUrl) {
      throw new Error('API_BASE_URL not configured');
    }

    // Build query string
    const queryParams = new URLSearchParams({
      page,
      limit,
      urgency_level,
      sla_status,
      channel,
      sort_by,
      sort_order
    });

    // Only add customer if it's not empty
    if (customer) {
      queryParams.append('customer', customer);
    }

    // Add date filters if present
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);
    if (date) queryParams.append('date', date);

    let data;

    try {
      const response = await fetch(`${apiBaseUrl}/lpo/queue?${queryParams}`, {
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
    const validationError = handleValidationError(error);
    if (validationError) return validationError;

    console.error('[LPO Queue API] Error:', error.message);
    return NextResponse.json(
      {
        status: 'error',
        message: 'An error occurred processing your request'
      },
      { status: 500 }
    );
  }
}