import { NextResponse } from 'next/server';
import { validateParams, handleValidationError } from '@/lib/validation/middleware';
import { idParamSchema } from '@/lib/validation/schemas';
import { applyRateLimit } from '@/lib/rate-limit';

export async function GET(request, { params }) {
  try {
    // Rate limiting
    const rateLimitResponse = await applyRateLimit(request, 30);
    if (rateLimitResponse) return rateLimitResponse;

    // Validate ID parameter
    const validatedParams = validateParams(params, idParamSchema);
    const conversationId = validatedParams.id;
    const apiBaseUrl = process.env.API_BASE_URL_TWO;
    const endpoint = `/conversations/${conversationId}`;
    
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
        console.error(`Conversation details API error: ${response.status} - ${errorText}`);
        // Return null instead of error
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
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
    const validationError = handleValidationError(error);
    if (validationError) return validationError;

    console.error('[Conversation Details API] Error:', error.message);
    return NextResponse.json(
      { 
        error: 'An error occurred processing your request'
      },
      { status: 500 }
    );
  }
}