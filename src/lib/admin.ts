// Admin authorization.
// Access is gated SOLELY by Supabase auth + TOTP MFA (AAL2).
// No email allowlist — any user with a valid Supabase session AND a verified
// TOTP factor (AAL2) may enter the admin dashboard.
import { supabase } from "@/lib/supabase";

// Obscured admin dashboard path (security-by-obscurity layer on top of the
// real auth check). The login URL stays at /admin/login so muscle memory
// works, but the dashboard itself sits at this non-guessable path.
export const ADMIN_DASHBOARD_PATH = "/AdminDashboardNovaNurox";
export const ADMIN_MFA_PATH = "/admin/mfa";
export const ADMIN_EMAIL = "nuroxindiaofficial@gmail.com";

// ---------------------------------------------------------------------------
// Flow tokens — enforce the strict path: /admin/login → /admin/mfa → dashboard
// Direct URL typing to /admin/mfa or the dashboard path will fail this check
// and route the user to /404. Tokens live in sessionStorage so they die with
// the tab, and are single-use (consumed on entry).
// ---------------------------------------------------------------------------
const MFA_FLOW_KEY = "nnx-flow-mfa";
const DASH_FLOW_KEY = "nnx-flow-dash";
const FLOW_TTL_MS = 5 * 60 * 1000; // 5 minutes

function setFlow(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, String(Date.now()));
  } catch {
    /* ignore */
  }
}

// Remember the last successful consume per key for a short window so
// React StrictMode's double-invoke (and quick remounts) doesn't fail the
// second call. Real direct-URL access has no prior grant AND no recent
// consume, so it still 404s.
const recentConsume: Record<string, number> = {};
const RECONSUME_WINDOW_MS = 10_000;

function consumeFlow(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (raw) {
      window.sessionStorage.removeItem(key);
      const ts = Number(raw);
      if (Number.isFinite(ts) && Date.now() - ts < FLOW_TTL_MS) {
        recentConsume[key] = Date.now();
        return true;
      }
    }
    const recent = recentConsume[key];
    if (recent && Date.now() - recent < RECONSUME_WINDOW_MS) return true;
    return false;
  } catch {
    return false;
  }
}

export function grantMfaEntry() {
  setFlow(MFA_FLOW_KEY);
}
export function consumeMfaEntry(): boolean {
  return consumeFlow(MFA_FLOW_KEY);
}
export function grantDashboardEntry() {
  setFlow(DASH_FLOW_KEY);
}
export function consumeDashboardEntry(): boolean {
  return consumeFlow(DASH_FLOW_KEY);
}

/**
 * Returns true only if the current Supabase session has been elevated to
 * AAL2 (i.e. the user has presented a verified TOTP factor in this session).
 * AAL1 = password only. AAL2 = password + MFA. Admin requires AAL2.
 */
export async function hasAal2(): Promise<boolean> {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error || !data) return false;
  return data.currentLevel === "aal2";
}

/**
 * Returns the user's first verified TOTP factor (if any). Used to decide
 * whether to enroll a new factor or challenge an existing one.
 */
export async function getVerifiedTotpFactor() {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error || !data) return null;
  return data.totp.find((f) => f.status === "verified") ?? null;
}

/**
 * Hard-refresh-safe session reset.
 *
 * 1. Signs out of Supabase (revokes the refresh token server-side).
 * 2. Wipes ALL localStorage + sessionStorage (no stale JS state can survive).
 * 3. Defensively re-removes the well-known auth keys in case .clear() was
 *    blocked by browser policy (private mode, etc.).
 *
 * Safe to call from any route — never throws.
 */
export async function clearAdminSession(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch {
    // ignore — we still want to wipe local storage below
  }
  if (typeof window !== "undefined") {
    try {
      window.localStorage.clear();
      window.sessionStorage.clear();
    } catch {
      // ignore storage access errors
    }
    // Defensive belt-and-suspenders: explicitly nuke known auth keys in case
    // .clear() didn't run (some browsers block it on cross-origin iframes).
    try {
      const targeted = ["nova-nurox-auth", "supabase.auth.token"];
      targeted.forEach((k) => {
        window.localStorage.removeItem(k);
        window.sessionStorage.removeItem(k);
      });
      // Sweep any remaining sb-* / supabase.auth.* / nova-nurox-auth* keys.
      [window.localStorage, window.sessionStorage].forEach((store) => {
        const kill: string[] = [];
        for (let i = 0; i < store.length; i++) {
          const k = store.key(i);
          if (!k) continue;
          if (
            k.startsWith("sb-") ||
            k.startsWith("supabase.auth") ||
            k.startsWith("nova-nurox-auth")
          ) {
            kill.push(k);
          }
        }
        kill.forEach((k) => store.removeItem(k));
      });
    } catch {
      // ignore
    }
  }
}

/**
 * Clear the session AND force a full browser reload to the given path.
 * Using window.location.href (not navigate) guarantees no React state,
 * in-memory Supabase client cache, or stale context survives.
 */
export async function clearAdminSessionAndRedirect(path: string = "/404"): Promise<void> {
  await clearAdminSession();
  if (typeof window !== "undefined") {
    window.location.href = path;
  }
}
