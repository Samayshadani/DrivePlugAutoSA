/**
 * Wraps a promise in a deterministic timeout
 */
export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage = 'Operation timed out'): Promise<T> {
  let timer: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });

  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    timeoutPromise,
  ]);
}
