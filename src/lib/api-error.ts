/**
 * Safely extracts a human-readable message from any thrown value.
 * Use in API route catch blocks instead of `(error: any) => error.message`
 * to satisfy `@typescript-eslint/no-explicit-any` without losing information.
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  try {
    return JSON.stringify(err);
  } catch {
    return 'An unexpected error occurred';
  }
}
