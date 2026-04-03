export async function withDbRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error: unknown) {
      attempt++;
      const message = error instanceof Error ? error.message : String(error);
      console.warn(
        `Database operation failed (Attempt ${attempt} of ${maxRetries}). Retrying...`,
        message
      );
      if (attempt >= maxRetries) throw error;
      // Wait a brief moment before retrying to let the TCP connection reset
      await new Promise(res => setTimeout(res, 500 * attempt));
    }
  }
  throw new Error("Database operation failed after max retries");
}

