import { NextResponse } from 'next/server';
import { proxyRequest } from '@/lib/api/proxyHelper';
import { validateRequest, validateQueryParams, handleValidationError } from '@/lib/validation/middleware';
import { systemConfigSchema, paginationSchema } from '@/lib/validation/schemas';
import { applyRateLimit } from '@/lib/rate-limit';

export async function GET(request) {
  try {
    const rateLimitResponse = await applyRateLimit(request, 20);
    if (rateLimitResponse) return rateLimitResponse;

    const params = validateQueryParams(request, paginationSchema);

    return proxyRequest(`/api/system-configuration?skip=${params.skip}&limit=${params.limit}`);
  } catch (error) {
    const validationError = handleValidationError(error);
    if (validationError) return validationError;

    console.error('[System Config API] Error:', error.message);
    return NextResponse.json(
      { error: 'An error occurred processing your request' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const rateLimitResponse = await applyRateLimit(request, 5);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const validation = await validateRequest(systemConfigSchema)(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error },
        { status: 400 }
      );
    }

    return proxyRequest('/api/system-configuration', {
      method: 'POST',
      body: JSON.stringify(validation.data)
    });
  } catch (error) {
    console.error('[System Config API] Error:', error.message);
    return NextResponse.json(
      { error: 'An error occurred processing your request' },
      { status: 500 }
    );
  }
}
