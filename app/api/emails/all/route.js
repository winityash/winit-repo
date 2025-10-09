import { NextResponse } from 'next/server';
import { validateQueryParams, handleValidationError } from '@/lib/validation/middleware';
import { emailQuerySchema } from '@/lib/validation/schemas';
import { applyRateLimit } from '@/lib/rate-limit';

export async function GET(request) {
  try {
    // Rate limiting
    const rateLimitResponse = await applyRateLimit(request, 30);
    if (rateLimitResponse) return rateLimitResponse;

    // Validate query parameters
    const params = validateQueryParams(request, emailQuerySchema);
    const { limit, include_spam: includeSpam, mailbox_folder: mailboxFolder } = params;

    const apiBaseUrl = process.env.API_BASE_URL;
    if (!apiBaseUrl) {
      throw new Error('API_BASE_URL not configured');
    }
    let apiUrl = `${apiBaseUrl}/emails/all?limit=${limit}&include_spam=${includeSpam}`;
    
    if (mailboxFolder) {
      apiUrl += `&mailbox_folder=${encodeURIComponent(mailboxFolder)}`;
    }
    
    // Removed verbose logging for security
    
    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      cache: 'no-cache'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    // API response received successfully
    
    return NextResponse.json(data);
  } catch (error) {
    const validationError = handleValidationError(error);
    if (validationError) return validationError;

    console.error('[Emails API] Error:', error.message);
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'An error occurred processing your request',
        data: []
      }, 
      { status: 500 }
    );
  }
}
