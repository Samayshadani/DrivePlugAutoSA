/**
 * Executes an async operation with exponential backoff and full jitter.
 * Formula: sleep = min(maxDelayMs, baseDelayMs * 2^attempt) * random(0, 1)
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxAttempts?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    shouldRetry?: (error: any) => boolean;
  } = {}
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 100;
  const maxDelayMs = options.maxDelayMs ?? 2000;
  const shouldRetry = options.shouldRetry ?? (() => true);

  let attempt = 0;

  while (attempt < maxAttempts) {
    try {
      return await operation();
    } catch (error) {
      attempt++;
      if (attempt >= maxAttempts || !shouldRetry(error)) {
        throw error;
      }

      // Exponential backoff with full jitter
      const exponentialDelay = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt));
      const jitteredDelay = Math.floor(Math.random() * exponentialDelay);

      await new Promise((resolve) => setTimeout(resolve, jitteredDelay));
    }
  }

  throw new Error('Retry loop exited unexpectedly');
}
