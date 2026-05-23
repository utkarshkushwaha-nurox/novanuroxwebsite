import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { ADMIN_MFA_PATH, clearAdminSession, grantMfaEntry } from "@/lib/admin";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Hard reset on mount: ALWAYS wipe any prior session before a new login
  // attempt so stale tokens (admin or not) can't bleed into the next sign-in.
  useEffect(() => {
    void clearAdminSession();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!supabaseConfigured) {
      setError("Supabase isn't configured. Add credentials in .env first.");
      return;
    }

    setLoading(true);
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError("Invalid email or password. Please try again.");
      return;
    }
    if (!data.user) {
      await clearAdminSession();
      window.location.href = "/404";
      return;
    }
    // Password OK — funnel through MFA gate. The MFA page will either
    // enroll a new TOTP factor or challenge an existing one before
    // letting the session reach the dashboard.
    grantMfaEntry();
    navigate(ADMIN_MFA_PATH);
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
              <h1 className="font-display text-xl font-bold">Admin Login</h1>
              <p className="text-xs text-muted-foreground">Restricted area — admins only</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full h-11 rounded-md border border-border bg-input/40 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Password
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full h-11 rounded-md border border-border bg-input/40 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60"
              />
            </label>
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-gradient-neon h-11 text-sm font-bold text-background shadow-neon disabled:opacity-60"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Sign In
            </button>
          </form>
          <p className="mt-5 text-xs text-muted-foreground text-center">
            Create your admin user in Supabase → Authentication → Users.
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:text-primary">
            ← Back to site
          </Link>
        </div>
      </div>
    </div>
  );
}
