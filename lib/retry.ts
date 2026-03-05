export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; backoffMs?: number; label?: string } = {}
): Promise<T> {
  const { maxRetries = 2, backoffMs = 1000, label = 'operation' } = options;
  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxRetries) {
        console.warn(`[retry] ${label} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${backoffMs * (attempt + 1)}ms...`);
        await new Promise(r => setTimeout(r, backoffMs * (attempt + 1)));
      }
    }
  }
  throw lastError;
}
