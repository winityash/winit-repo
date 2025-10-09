import { NextResponse } from 'next/server';
import { proxyRequest } from '@/lib/api/proxyHelper';
import { validateRequest, validateQueryParams, handleValidationError } from '@/lib/validation/middleware';
import { userSchema, paginationSchema } from '@/lib/validation/schemas';
import { applyRateLimit } from '@/lib/rate-limit';

export async function GET(request) {
  try {
    // Rate limiting
    const rateLimitResponse = await applyRateLimit(request, 20);
    if (rateLimitResponse) return rateLimitResponse;

    // Validate query parameters
    const params = validateQueryParams(request, paginationSchema);

    return proxyRequest(`/api/users?skip=${params.skip}&limit=${params.limit}`);
  } catch (error) {
    const validationError = handleValidationError(error);
    if (validationError) return validationError;

    console.error('[Users API] Error:', error.message);
    return NextResponse.json(
      { error: 'An error occurred processing your request' },
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
    const validation = await validateRequest(userSchema)(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error },
        { status: 400 }
      );
    }

    return proxyRequest('/api/users', {
      method: 'POST',
      body: JSON.stringify(validation.data)
    });
  } catch (error) {
    console.error('[Users API] Error:', error.message);
    return NextResponse.json(
      { error: 'An error occurred processing your request' },
      { status: 500 }
    );
  }
}
