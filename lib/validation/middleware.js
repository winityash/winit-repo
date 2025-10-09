import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export class ValidationError extends Error {
  constructor(message, errors) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export async function validateRequest(schema) {
  return async (data) => {
    try {
      const validated = await schema.parseAsync(data);
      return { success: true, data: validated };
    } catch (error) {
      if (error instanceof ZodError) {
        return {
          success: false,
          error: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        };
      }
      throw error;
    }
  };
}

export function validateQueryParams(request, schema) {
  const { searchParams } = new URL(request.url);
  const params = Object.fromEntries(searchParams);

  try {
    return schema.parse(params);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError('Invalid query parameters', error.errors);
    }
    throw error;
  }
}

export function validateParams(params, schema) {
  try {
    return schema.parse(params);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError('Invalid path parameters', error.errors);
    }
    throw error;
  }
}

export function handleValidationError(error) {
  if (error instanceof ValidationError) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        details: error.errors,
      },
      { status: 400 }
    );
  }
  return null;
}

// Note: We rely on Zod validation and parameterized queries/ORM for security.
// Blacklist-based sanitization is brittle and has been removed in favor of
// comprehensive schema validation and proper backend query handling.
