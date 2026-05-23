/**
 * Automated dev-only self-test for the admin guard.
 *
 * The admin gate is now: valid Supabase session + AAL2 (TOTP-verified).
 * There is no email allowlist anymore. This test verifies that
 * clearAdminSession() reliably wipes our Supabase storageKey so a stale
 * session can never bleed into a new login attempt.
 */
import { clearAdminSession } from "@/lib/admin";

const STORAGE_KEY = "nova-nurox-auth";

export async function runAdminGuardSelfTest(): Promise<void> {
  if (typeof window === "undefined") return;

  // Back up any real session blob so we don't disturb a logged-in admin.
  const backup = window.localStorage.getItem(STORAGE_KEY);

  try {
    // Plant a fake session blob.
    const fakeBlob = JSON.stringify({
      currentSession: {
        access_token: "fake",
        refresh_token: "fake",
        user: { email: "intruder@example.com", id: "fake-id" },
      },
      expiresAt: Date.now() / 1000 + 3600,
    });
    window.localStorage.setItem(STORAGE_KEY, fakeBlob);

    // clearAdminSession must wipe our storageKey.
    await clearAdminSession();
    const stillThere = window.localStorage.getItem(STORAGE_KEY);
    if (stillThere) {
      throw new Error(
        `[admin-guard self-test] FAIL: stale localStorage key "${STORAGE_KEY}" survived clearAdminSession().`,
      );
    }

    // eslint-disable-next-line no-console
    console.info(
      "%c[admin-guard] self-test passed ✓",
      "color: #10b981; font-weight: 600;",
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
  } finally {
    if (backup !== null) {
      window.localStorage.setItem(STORAGE_KEY, backup);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }
}
