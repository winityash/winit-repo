import { NextResponse } from 'next/server';
import { validateRequest, validateQueryParams, handleValidationError } from '@/lib/validation/middleware';
import { priceToleranceSchema, paginationSchema } from '@/lib/validation/schemas';
import { applyRateLimit } from '@/lib/rate-limit';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL_TWO;

if (!API_BASE_URL) {
  console.error('CRITICAL: NEXT_PUBLIC_API_BASE_URL_TWO must be set');
}

export async function GET(request) {
  try {
    // Rate limiting
    const rateLimitResponse = await applyRateLimit(request, 20);
    if (rateLimitResponse) return rateLimitResponse;

    // Validate query parameters
    const params = validateQueryParams(request, paginationSchema);
    const response = await fetch(`${API_BASE_URL}/api/price-tolerance-rules?skip=${params.skip}&limit=${params.limit}`, {
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
    const validationError = handleValidationError(error);
    if (validationError) return validationError;

    console.error('[Price Tolerance API] Error:', error.message);
    return NextResponse.json(
      { status: 'error', message: 'An error occurred processing your request' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Stricter rate limiting for write operations
    const rateLimitResponse = await applyRateLimit(request, 10);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();

    // Validate request body
    const validation = await validateRequest(priceToleranceSchema)(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error },
        { status: 400 }
      );
    }

    const response = await fetch(`${API_BASE_URL}/api/price-tolerance-rules`, {
      method: 'POST',
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(validation.data),
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Price Tolerance API] Error:', error.message);
    return NextResponse.json(
      { status: 'error', message: 'An error occurred processing your request' },
      { status: 500 }
    );
  }
}
