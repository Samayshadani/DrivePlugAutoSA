import { ZodError } from 'zod';
import { apiError } from './response';

export class DomainError extends Error {
  public code: string;
  public status: number;
  public details?: any;

  constructor(code: string, message: string, status = 400, details?: any) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    const formattedErrors = error.issues.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    return apiError('VALIDATION_ERROR', 'Request validation failed', 422, formattedErrors);
  }

  if (error instanceof DomainError) {
    return apiError(error.code, error.message, error.status, error.details);
  }

  if (error instanceof Error) {
    console.error('[UNHANDLED_ERROR]:', error.message, error.stack);
    return apiError('INTERNAL_SERVER_ERROR', error.message || 'An unexpected error occurred', 500);
  }

  return apiError('UNKNOWN_ERROR', 'An unknown error occurred', 500);
}
