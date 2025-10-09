import { NextResponse } from 'next/server';

// Simple in-memory rate limiter (use Redis in production)
const rateLimitMap = new Map();

function cleanupOldEntries() {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now - value.resetTime > 60000) {
      rateLimitMap.delete(key);
    }
  }
}

// Cleanup every minute
setInterval(cleanupOldEntries, 60000);

export async function applyRateLimit(request, limit = 10, windowMs = 60000) {
  const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             'unknown';

  const key = `${ip}-${new URL(request.url).pathname}`;
  const now = Date.now();

  const rateLimit = rateLimitMap.get(key);

  if (!rateLimit) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return null;
  }

  if (now > rateLimit.resetTime) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return null;
  }

  if (rateLimit.count >= limit) {
    const retryAfter = Math.ceil((rateLimit.resetTime - now) / 1000);
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetTime / 1000)),
        },
      }
    );
  }

  rateLimit.count++;
  return null;
}
