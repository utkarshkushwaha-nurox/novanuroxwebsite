import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import {
  ADMIN_EMAIL,
  ADMIN_MFA_PATH,
  clearAdminSessionAndRedirect,
  consumeDashboardEntry,
  hasAal2,
} from "@/lib/admin";

/**
 * Route-level admin guard.
 *
 * Runs BEFORE the protected children mount. Requires:
 *  1. A live Supabase session              (else → /admin/login)
 *  2. The session belongs to the admin email (else → /404)
 *  3. The session is AAL2 — i.e. MFA was   (else → /admin/mfa)
 *     verified in this session
 */
export default function RequireAdmin({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"checking" | "ok">("checking");

  useEffect(() => {
    if (!supabaseConfigured) {
      setStatus("ok");
      return;
    }
    // Flow guard: dashboard is only reachable from a successful MFA verify.
    // Direct URL typing (no flow token) → 404.
    if (!consumeDashboardEntry()) {
      navigate("/404", { replace: true });
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (cancelled) return;

      if (!session) {
        navigate("/admin/login", { replace: true });
        return;
      }
      // Email allowlist: only the configured admin email may proceed. Any
      // other authenticated user is signed out and 404'd.
      if (session.user?.email !== ADMIN_EMAIL) {
        await clearAdminSessionAndRedirect("/404");
        return;
      }

      // MFA factor check. The admin email is already verified above, so it's
      // safe to route to enrollment if no verified factor exists yet — this
      // is the legitimate first-time setup path.
      const { data: factors, error: factorsErr } =
        await supabase.auth.mfa.listFactors();
      if (cancelled) return;
      if (factorsErr) {
        // Real API failure — bounce to MFA page so user can retry / enroll.
        navigate(ADMIN_MFA_PATH, { replace: true });
        return;
      }
      const verifiedFactor = factors.totp.find((f) => f.status === "verified");
      if (!verifiedFactor) {
        // No verified factor → enroll one. Don't 404 the legitimate admin.
        navigate(ADMIN_MFA_PATH, { replace: true });
        return;
      }

      // MFA gate: only AAL2 sessions (TOTP verified this session) may enter.
      if (!(await hasAal2())) {
        navigate(ADMIN_MFA_PATH, { replace: true });
        return;
      }
      if (!cancelled) setStatus("ok");
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (status === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }
  return <>{children}</>;
}
