import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, ShieldCheck, Smartphone } from "lucide-react";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import {
  ADMIN_DASHBOARD_PATH,
  ADMIN_EMAIL,
  clearAdminSessionAndRedirect,
  consumeMfaEntry,
  grantDashboardEntry,
  grantMfaEntry,
  hasAal2,
} from "@/lib/admin";

type Mode = "loading" | "enroll" | "challenge" | "done";

/**
 * Admin MFA gate.
 *
 * Flow on mount:
 *  1. Must have a Supabase session (else → /admin/login).
 *  2. Must be the admin email (else → /404).
 *  3. If already AAL2 → straight to dashboard.
 *  4. If a verified TOTP factor exists → challenge (6-digit code).
 *  5. Otherwise → enroll (show QR + secret, then verify once).
 *
 * Uses supabase.auth.mfa.{enroll, challenge, verify, listFactors,
 * getAuthenticatorAssuranceLevel} — no service role key, all client-side.
 */
export default function AdminMfa() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("loading");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Enrollment artifacts (only populated in `enroll` mode)
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);

  // Cache the active factor id between mount + verify so we don't re-list.
  const activeFactorId = useRef<string | null>(null);

  useEffect(() => {
    if (!supabaseConfigured) {
      setError("Supabase isn't configured.");
      return;
    }
    // Flow guard: this page is only reachable after a successful login.
    // Direct URL access (no flow token) → 404.
    if (!consumeMfaEntry()) {
      navigate("/404", { replace: true });
      return;
    }
    let cancelled = false;

    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const session = sess.session;
      if (!session) {
        navigate("/admin/login", { replace: true });
        return;
      }
      // Email allowlist: non-admin sessions are wiped and 404'd.
      if (session.user?.email !== ADMIN_EMAIL) {
        await clearAdminSessionAndRedirect("/404");
        return;
      }

      // Already MFA-verified for this session → go to dashboard.
      if (await hasAal2()) {
        if (!cancelled) {
          setMode("done");
          grantDashboardEntry();
          navigate(ADMIN_DASHBOARD_PATH, { replace: true });
        }
        return;
      }

      // Decide enroll vs challenge based on existing factors.
      const { data: factors, error: listErr } = await supabase.auth.mfa.listFactors();
      if (cancelled) return;
      if (listErr) {
        setError(listErr.message);
        return;
      }
      const verified = factors.totp.find((f) => f.status === "verified");
      if (verified) {
        activeFactorId.current = verified.id;
        setMode("challenge");
        return;
      }

      // No verified factor yet — enroll a new one. Clean up any stale
      // unverified factors first (Supabase rejects duplicate enrollments).
      for (const f of factors.totp) {
        if (f.status !== "verified") {
          await supabase.auth.mfa.unenroll({ factorId: f.id });
        }
      }
      const { data: enroll, error: enrollErr } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `Admin TOTP (${new Date().toISOString().slice(0, 10)})`,
      });
      if (cancelled) return;
      if (enrollErr || !enroll) {
        setError(enrollErr?.message ?? "Failed to start MFA enrollment.");
        return;
      }
      activeFactorId.current = enroll.id;
      setFactorId(enroll.id);
      setQrSvg(enroll.totp.qr_code); // SVG markup string
      setSecret(enroll.totp.secret);
      setMode("enroll");
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = code.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      setError("Enter the 6-digit code from Google Authenticator.");
      return;
    }
    const fid = activeFactorId.current ?? factorId;
    if (!fid) {
      setError("Missing factor. Refresh and try again.");
      return;
    }
    setSubmitting(true);
    const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({ factorId: fid });
    if (chErr || !ch) {
      setSubmitting(false);
      setError(chErr?.message ?? "Failed to start MFA challenge.");
      return;
    }
    const { error: vErr } = await supabase.auth.mfa.verify({
      factorId: fid,
      challengeId: ch.id,
      code: trimmed,
    });
    setSubmitting(false);
    if (vErr) {
      setError(vErr.message);
      return;
    }
    // Confirm the session is now AAL2 before letting them in.
    if (!(await hasAal2())) {
      setError("MFA verified but session was not elevated. Please retry.");
      return;
    }
    grantDashboardEntry();
    navigate(ADMIN_DASHBOARD_PATH, { replace: true });
  }

  async function handleCancel() {
    await clearAdminSessionAndRedirect("/admin/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
      <div className="relative w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="h-9 w-9 rounded-md bg-gradient-neon flex items-center justify-center font-display font-bold text-background">
            N
          </div>
          <span className="font-display font-bold text-lg">
            NOVA <span className="text-gradient-neon">NUROX</span>
          </span>
        </Link>

        <div className="rounded-2xl bg-gradient-card border border-border p-7 md:p-8 shadow-card">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold">Two-Factor Auth</h1>
              <p className="text-xs text-muted-foreground">
                {mode === "enroll"
                  ? "Set up Google Authenticator"
                  : "Enter the code from Google Authenticator"}
              </p>
            </div>
          </div>

          {mode === "loading" && (
            <div className="mt-8 flex justify-center">
              <Loader2 className="animate-spin text-primary" size={28} />
            </div>
          )}

          {mode === "enroll" && qrSvg && (
            <div className="mt-6 space-y-4">
              <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
                <li className="flex items-center gap-1.5">
                  <Smartphone size={12} className="text-primary" /> Open Google Authenticator
                </li>
                <li>Tap “+” and scan the QR code below</li>
                <li>Enter the 6-digit code it generates to confirm</li>
              </ol>
              <div className="rounded-lg bg-white p-3 mx-auto w-fit">
                {/* Render the Supabase-returned SVG as an image so the browser
                    sandboxes it and ignores any embedded <script>/on* handlers. */}
                <img
                  src={`data:image/svg+xml;base64,${btoa(qrSvg)}`}
                  alt="MFA QR code"
                  className="block"
                />
              </div>
              {secret && (
                <div className="text-center">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Or enter this secret manually
                  </div>
                  <code className="mt-1 inline-block text-xs font-mono bg-secondary/50 border border-border rounded px-2 py-1 break-all">
                    {secret}
                  </code>
                </div>
              )}
              <VerifyForm
                code={code}
                setCode={setCode}
                error={error}
                submitting={submitting}
                onSubmit={handleVerify}
                onCancel={handleCancel}
                ctaLabel="Confirm & Enable MFA"
              />
            </div>
          )}

          {mode === "challenge" && (
            <div className="mt-6">
              <p className="text-xs text-muted-foreground">
                Open Google Authenticator on your phone and enter the 6-digit code shown for{" "}
                <span className="text-foreground">Nova Nurox Admin</span>.
              </p>
              <VerifyForm
                code={code}
                setCode={setCode}
                error={error}
                submitting={submitting}
                onSubmit={handleVerify}
                onCancel={handleCancel}
                ctaLabel="Verify"
              />
            </div>
          )}

          {error && mode === "loading" && (
            <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function VerifyForm({
  code,
  setCode,
  error,
  submitting,
  onSubmit,
  onCancel,
  ctaLabel,
}: {
  code: string;
  setCode: (s: string) => void;
  error: string | null;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  ctaLabel: string;
}) {
  return (
    <form onSubmit={onSubmit} className="mt-5 space-y-3">
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          6-digit code
        </span>
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          required
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="mt-1.5 w-full h-12 rounded-md border border-border bg-input/40 px-3 text-center text-lg font-mono tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60"
          placeholder="••••••"
        />
      </label>
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={submitting || code.length !== 6}
        className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-gradient-neon h-11 text-sm font-bold text-background shadow-neon disabled:opacity-60"
      >
        {submitting && <Loader2 size={16} className="animate-spin" />}
        {ctaLabel}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="w-full text-xs text-muted-foreground hover:text-primary"
      >
        Cancel & sign out
      </button>
    </form>
  );
}
