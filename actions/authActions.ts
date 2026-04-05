"use server";

/**
 * Identity lives in Privy only — no local DB user row to sync.
 * AuthGuard still awaits this so the dashboard can show a short loading state.
 */
export async function syncUser(_privyId: string, _email?: string) {
  return { success: true as const };
}
