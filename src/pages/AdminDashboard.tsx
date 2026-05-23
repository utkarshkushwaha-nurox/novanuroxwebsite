import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Circle,
  GraduationCap,
  Loader2,
  LogOut,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import {
  supabase,
  supabaseConfigured,
  type Signup,
  type SchoolPartnership,
  type StudentEnrollment,
} from "@/lib/supabase";

import { friendlyError } from "@/lib/friendlyError";

type AdminRole = "student" | "school" | "enrollment";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [signups, setSignups] = useState<Signup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [role, setRole] = useState<AdminRole>("student");
  const [partnerships, setPartnerships] = useState<SchoolPartnership[]>([]);
  const [loadingPartnerships, setLoadingPartnerships] = useState(false);
  const [updatingPartnershipId, setUpdatingPartnershipId] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [updatingEnrollmentId, setUpdatingEnrollmentId] = useState<string | null>(null);
  // RLS verification state — true while we confirm Supabase accepts our JWT
  // for the protected `signups` table before showing any data UI.
  const [verifyingRls, setVerifyingRls] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [selectedSignups, setSelectedSignups] = useState<Set<string>>(new Set());
  const [selectedPartnerships, setSelectedPartnerships] = useState<Set<string>>(new Set());
  const [selectedEnrollments, setSelectedEnrollments] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  function toggleSel(set: Set<string>, id: string): Set<string> {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  }

  async function deleteRows(
    table: "signups" | "school_partnerships" | "student_enrollments",
    ids: string[],
  ) {
    if (ids.length === 0) return;
    if (!window.confirm(`Delete ${ids.length} row${ids.length === 1 ? "" : "s"}? This cannot be undone.`)) return;
    setDeleting(true);
    setError(null);
    const { error: err } = await supabase.from(table).delete().in("id", ids);
    if (err) {
      setError(friendlyError(err, "Could not delete the selected rows."));
      setDeleting(false);
      return;
    }
    if (table === "signups") {
      setSignups((l) => l.filter((x) => !ids.includes(x.id)));
      setSelectedSignups(new Set());
    } else if (table === "school_partnerships") {
      setPartnerships((l) => l.filter((x) => !ids.includes(x.id)));
      setSelectedPartnerships(new Set());
    } else {
      setEnrollments((l) => l.filter((x) => !ids.includes(x.id)));
      setSelectedEnrollments(new Set());
    }
    setDeleting(false);
  }

  async function togglePartnerPaid(p: SchoolPartnership) {
    setUpdatingPartnershipId(p.id);
    const { error: err } = await supabase
      .from("school_partnerships")
      .update({ payment_paid: !p.payment_paid })
      .eq("id", p.id);
    if (err) setError(friendlyError(err));
    else
      setPartnerships((list) =>
        list.map((x) => (x.id === p.id ? { ...x, payment_paid: !p.payment_paid } : x)),
      );
    setUpdatingPartnershipId(null);
  }


  // Detect Supabase / PostgREST RLS denials. PostgREST returns:
  //   - HTTP 401/403 (status on FetchError)
  //   - code "PGRST301" (JWT invalid) / "42501" (insufficient privilege)
  //   - message containing "row-level security" / "permission denied"
  function isForbiddenError(err: unknown): boolean {
    if (!err || typeof err !== "object") return false;
    const e = err as { code?: string; status?: number; message?: string };
    if (e.status === 401 || e.status === 403) return true;
    if (e.code === "PGRST301" || e.code === "42501") return true;
    const msg = (e.message ?? "").toLowerCase();
    return (
      msg.includes("row-level security") ||
      msg.includes("permission denied") ||
      msg.includes("forbidden")
    );
  }

  useEffect(() => {
    if (!supabaseConfigured) {
      setAuthChecked(true);
      return;
    }
    let cancelled = false;
    const verify = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (cancelled) return;
      if (!session) {
        navigate("/admin/login", { replace: true });
        return;
      }
      const userEmail = session.user.email ?? null;
      // No email allowlist — Supabase session + AAL2 (enforced by RequireAdmin) is the gate.
      setAuthed(true);
      setEmail(userEmail);
      setAuthChecked(true);
    };
    verify();
    const { data: sub } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) {
        setAuthed(false);
        navigate("/admin/login", { replace: true });
        return;
      }
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  async function loadSignups() {
    if (!supabaseConfigured) return;
    setRefreshing(true);
    setError(null);
    setVerifyingRls(true);
    const { data, error: err, status } = await supabase
      .from("signups")
      .select("*")
      .order("created_at", { ascending: false });
    setVerifyingRls(false);
    if (err) {
      const errWithStatus = { ...err, status } as typeof err & { status?: number };
      if (isForbiddenError(errWithStatus)) {
        setForbidden(true);
        setError(
          "Access denied by Row-Level Security. Your account does not have permission to read this table.",
        );
      } else {
        setError(friendlyError(err));
      }
    } else {
      setForbidden(false);
      setSignups((data ?? []) as Signup[]);
    }
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    if (authed) loadSignups();
  }, [authed]);

  async function loadPartnerships() {
    if (!supabaseConfigured) return;
    setLoadingPartnerships(true);
    const { data, error: err } = await supabase
      .from("school_partnerships")
      .select("*")
      .order("created_at", { ascending: false });
    if (err) setError(friendlyError(err));
    else setPartnerships((data ?? []) as SchoolPartnership[]);
    setLoadingPartnerships(false);
  }

  useEffect(() => {
    if (authed && role === "school") loadPartnerships();
  }, [authed, role]);

  async function loadEnrollments() {
    if (!supabaseConfigured) return;
    setLoadingEnrollments(true);
    const { data, error: err } = await supabase
      .from("student_enrollments")
      .select("*")
      .order("created_at", { ascending: false });
    if (err) setError(friendlyError(err));
    else setEnrollments((data ?? []) as StudentEnrollment[]);
    setLoadingEnrollments(false);
  }

  useEffect(() => {
    if (authed && role === "enrollment") loadEnrollments();
  }, [authed, role]);

  async function toggleEnrollmentPaid(s: StudentEnrollment) {
    setUpdatingEnrollmentId(s.id);
    const { error: err } = await supabase
      .from("student_enrollments")
      .update({ paid: !s.paid })
      .eq("id", s.id);
    if (err) setError(friendlyError(err));
    else
      setEnrollments((list) =>
        list.map((x) => (x.id === s.id ? { ...x, paid: !s.paid } : x)),
      );
    setUpdatingEnrollmentId(null);
  }

  async function setEnrollmentBatch(s: StudentEnrollment, batch: number | null) {
    setUpdatingEnrollmentId(s.id);
    const { error: err } = await supabase
      .from("student_enrollments")
      .update({ batch_number: batch })
      .eq("id", s.id);
    if (err) setError(friendlyError(err));
    else
      setEnrollments((list) =>
        list.map((x) => (x.id === s.id ? { ...x, batch_number: batch } : x)),
      );
    setUpdatingEnrollmentId(null);
  }

  async function togglePaid(s: Signup) {
    setUpdatingId(s.id);
    const { error: err, status } = await supabase
      .from("signups")
      .update({ paid: !s.paid })
      .eq("id", s.id);
    if (err) {
      const errWithStatus = { ...err, status } as typeof err & { status?: number };
      if (isForbiddenError(errWithStatus)) {
        setError("RLS denied this update. Admin policy may not cover UPDATE.");
      } else {
        setError(friendlyError(err));
      }
    } else {
      setSignups((list) =>
        list.map((x) => (x.id === s.id ? { ...x, paid: !s.paid } : x)),
      );
    }
    setUpdatingId(null);
  }

  async function toggleApproved(p: SchoolPartnership) {
    setUpdatingPartnershipId(p.id);
    const { error: err } = await supabase
      .from("school_partnerships")
      .update({ approved: !p.approved })
      .eq("id", p.id);
    if (err) setError(friendlyError(err));
    else
      setPartnerships((list) =>
        list.map((x) => (x.id === p.id ? { ...x, approved: !p.approved } : x)),
      );
    setUpdatingPartnershipId(null);
  }

  async function toggleAgreement(p: SchoolPartnership) {
    setUpdatingPartnershipId(p.id);
    const { error: err } = await supabase
      .from("school_partnerships")
      .update({ agreed_payment_model: !p.agreed_payment_model })
      .eq("id", p.id);
    if (err) setError(friendlyError(err));
    else
      setPartnerships((list) =>
        list.map((x) =>
          x.id === p.id ? { ...x, agreed_payment_model: !p.agreed_payment_model } : x,
        ),
      );
    setUpdatingPartnershipId(null);
  }

  async function logout() {
    await supabase.auth.signOut();
    navigate("/admin/login");
  }

  if (!supabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center rounded-2xl bg-gradient-card border border-border p-8">
          <h1 className="font-display text-2xl font-bold">Setup Required</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Add your Supabase URL and anon key to <code className="text-primary">.env</code> and
            run the SQL from <code className="text-primary">SUPABASE_SETUP.md</code>.
          </p>
          <Link
            to="/"
            className="mt-5 inline-flex items-center justify-center rounded-md bg-gradient-neon px-5 h-10 text-sm font-bold text-background"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!authed) return null;

  // Verifying RLS — we have a session but haven't confirmed Supabase will
  // serve us the protected table yet. Show a dedicated loading state so the
  // user knows we're checking permissions, not just fetching rows.
  if (verifyingRls && loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-primary" size={32} />
        <p className="text-sm text-muted-foreground">
          Verifying admin permissions…
        </p>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center rounded-2xl bg-gradient-card border border-destructive/30 p-8">
          <ShieldCheck className="mx-auto text-destructive" size={36} />
          <h1 className="mt-3 font-display text-2xl font-bold">Access Denied</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Row-Level Security blocked this request. Your account
            <span className="text-foreground"> ({email}) </span>
            does not satisfy the admin policy on this table.
          </p>
          <button
            onClick={logout}
            className="mt-5 inline-flex items-center justify-center rounded-md bg-gradient-neon px-5 h-10 text-sm font-bold text-background"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  const paidCount = signups.filter((s) => s.paid).length;
  const totalSeats = 20;

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-gradient-neon flex items-center justify-center font-display font-bold text-background">
              N
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-display font-bold text-sm">NOVA NUROX</span>
              <span className="text-[10px] uppercase tracking-wider text-primary">
                Admin Panel
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-muted-foreground truncate max-w-[160px]">
              {email}
            </span>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/50 px-3 h-9 text-xs font-semibold hover:bg-secondary transition-smooth"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 md:px-6 mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} className="text-primary" />
              <h1 className="font-display text-2xl md:text-3xl font-bold">Dashboard</h1>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {role === "student"
                ? "Manage Alpha Batch signups, mark payments, and contact users on WhatsApp."
                : role === "school"
                  ? "Review and approve incoming school partnership requests."
                  : "Manage student enrollments, assign batches, and mark payments."}
            </p>
          </div>

          <div className="inline-flex flex-wrap rounded-lg border border-border bg-card/40 p-1 self-start gap-1">
            <button
              onClick={() => setRole("student")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 h-9 text-xs font-semibold transition-smooth ${
                role === "student"
                  ? "bg-gradient-neon text-background shadow-neon"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <GraduationCap size={14} /> Student Admin
            </button>
            <button
              onClick={() => setRole("school")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 h-9 text-xs font-semibold transition-smooth ${
                role === "school"
                  ? "bg-gradient-neon text-background shadow-neon"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Building2 size={14} /> School Admin
            </button>
            <button
              onClick={() => setRole("enrollment")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 h-9 text-xs font-semibold transition-smooth ${
                role === "enrollment"
                  ? "bg-gradient-neon text-background shadow-neon"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users size={14} /> Enrollments
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {role === "student" ? (
          <>
            <div className="grid sm:grid-cols-3 gap-4 mt-6">
              <Stat label="Total Signups" value={signups.length} />
              <Stat label="Paid" value={paidCount} accent />
              <Stat
                label="Seats Left"
                value={Math.max(0, totalSeats - paidCount)}
                danger={paidCount >= totalSeats}
              />
            </div>

            <div className="mt-6 flex items-center justify-between gap-3 flex-wrap">
              <h2 className="font-display text-lg font-bold">All Signups</h2>
              <div className="flex items-center gap-2">
                {selectedSignups.size > 0 && (
                  <button
                    onClick={() => deleteRows("signups", Array.from(selectedSignups))}
                    disabled={deleting}
                    className="inline-flex items-center gap-1.5 rounded-md border border-destructive/40 bg-destructive/10 text-destructive px-3 h-9 text-xs font-semibold hover:bg-destructive/20 disabled:opacity-60"
                  >
                    <Trash2 size={14} /> Delete selected ({selectedSignups.size})
                  </button>
                )}
                <button
                  onClick={loadSignups}
                  disabled={refreshing}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/50 px-3 h-9 text-xs font-semibold hover:bg-secondary transition-smooth disabled:opacity-60"
                >
                  <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh
                </button>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-border bg-gradient-card overflow-hidden">
              {loading ? (
                <div className="p-12 flex justify-center">
                  <Loader2 className="animate-spin text-primary" size={28} />
                </div>
              ) : signups.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <Users className="mx-auto text-muted-foreground/40" size={36} />
                  <p className="mt-3 text-sm">No signups yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-3 py-3 w-10">
                          <input
                            type="checkbox"
                            aria-label="Select all"
                            checked={signups.length > 0 && selectedSignups.size === signups.length}
                            onChange={(e) =>
                              setSelectedSignups(
                                e.target.checked ? new Set(signups.map((x) => x.id)) : new Set(),
                              )
                            }
                          />
                        </th>
                        <th className="text-left px-4 py-3 font-semibold">Name</th>
                        <th className="text-left px-4 py-3 font-semibold">Email</th>
                        <th className="text-left px-4 py-3 font-semibold">WhatsApp</th>
                        <th className="text-left px-4 py-3 font-semibold">City</th>
                        <th className="text-left px-4 py-3 font-semibold">Joined</th>
                        <th className="text-left px-4 py-3 font-semibold">Paid</th>
                        <th className="text-right px-4 py-3 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {signups.map((s) => (
                        <tr
                          key={s.id}
                          className="border-t border-border hover:bg-secondary/30 transition-smooth"
                        >
                          <td className="px-3 py-3">
                            <input
                              type="checkbox"
                              aria-label={`Select ${s.full_name}`}
                              checked={selectedSignups.has(s.id)}
                              onChange={() => setSelectedSignups((p) => toggleSel(p, s.id))}
                            />
                          </td>
                          <td className="px-4 py-3 font-medium">{s.full_name}</td>
                          <td className="px-4 py-3 text-muted-foreground break-all">{s.email}</td>
                          <td className="px-4 py-3 text-muted-foreground font-mono">+91 {s.whatsapp}</td>
                          <td className="px-4 py-3 text-muted-foreground">{s.city || "—"}</td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            {new Date(s.created_at).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => togglePaid(s)}
                              disabled={updatingId === s.id}
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-smooth ${
                                s.paid
                                  ? "bg-primary/15 text-primary border border-primary/30 hover:shadow-neon"
                                  : "bg-secondary text-muted-foreground border border-border hover:bg-secondary/80"
                              }`}
                            >
                              {updatingId === s.id ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : s.paid ? (
                                <CheckCircle2 size={12} />
                              ) : (
                                <Circle size={12} />
                              )}
                              {s.paid ? "Paid" : "Unpaid"}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-2 justify-end">
                              <a
                                href={`https://wa.me/91${s.whatsapp}?text=${encodeURIComponent(
                                  `Hi ${s.full_name}, this is Nova Nurox Admin. Welcome to the Alpha Batch! 🚀`,
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-md bg-[#25D366]/15 border border-[#25D366]/40 text-[#25D366] px-3 h-8 text-xs font-semibold hover:bg-[#25D366]/25 transition-smooth"
                              >
                                <MessageCircle size={13} /> WhatsApp
                              </a>
                              <button
                                onClick={() => deleteRows("signups", [s.id])}
                                disabled={deleting}
                                className="inline-flex items-center justify-center rounded-md border border-destructive/40 bg-destructive/10 text-destructive h-8 w-8 hover:bg-destructive/20 disabled:opacity-60"
                                aria-label="Delete row"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : role === "school" ? (
          <>
            <div className="grid sm:grid-cols-3 gap-4 mt-6">
              <Stat label="Total Schools" value={partnerships.length} />
              <Stat label="Approved" value={partnerships.filter((p) => p.approved).length} accent />
              <Stat label="Pending" value={partnerships.filter((p) => !p.approved).length} />
            </div>

            <div className="mt-6 flex items-center justify-between gap-3 flex-wrap">
              <h2 className="font-display text-lg font-bold">Partnership Requests</h2>
              <div className="flex items-center gap-2">
                {selectedPartnerships.size > 0 && (
                  <button
                    onClick={() => deleteRows("school_partnerships", Array.from(selectedPartnerships))}
                    disabled={deleting}
                    className="inline-flex items-center gap-1.5 rounded-md border border-destructive/40 bg-destructive/10 text-destructive px-3 h-9 text-xs font-semibold hover:bg-destructive/20 disabled:opacity-60"
                  >
                    <Trash2 size={14} /> Delete selected ({selectedPartnerships.size})
                  </button>
                )}
                <button
                  onClick={loadPartnerships}
                  disabled={loadingPartnerships}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/50 px-3 h-9 text-xs font-semibold hover:bg-secondary transition-smooth disabled:opacity-60"
                >
                  <RefreshCw size={14} className={loadingPartnerships ? "animate-spin" : ""} /> Refresh
                </button>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-border bg-gradient-card overflow-hidden">
              {loadingPartnerships ? (
                <div className="p-12 flex justify-center">
                  <Loader2 className="animate-spin text-primary" size={28} />
                </div>
              ) : partnerships.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <Building2 className="mx-auto text-muted-foreground/40" size={36} />
                  <p className="mt-3 text-sm">No partnership requests yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-3 py-3 w-10">
                          <input
                            type="checkbox"
                            aria-label="Select all"
                            checked={partnerships.length > 0 && selectedPartnerships.size === partnerships.length}
                            onChange={(e) =>
                              setSelectedPartnerships(
                                e.target.checked
                                  ? new Set(partnerships.map((x) => x.id))
                                  : new Set(),
                              )
                            }
                          />
                        </th>
                        <th className="text-left px-4 py-3 font-semibold">School</th>
                        <th className="text-left px-4 py-3 font-semibold">Principal</th>
                        <th className="text-left px-4 py-3 font-semibold">Contact</th>
                        <th className="text-left px-4 py-3 font-semibold">WhatsApp</th>
                        <th className="text-left px-4 py-3 font-semibold">Start Date</th>
                        <th className="text-left px-4 py-3 font-semibold">Capacity</th>
                        <th className="text-left px-4 py-3 font-semibold">Total Pay</th>
                        <th className="text-left px-4 py-3 font-semibold">Payment</th>
                        <th className="text-left px-4 py-3 font-semibold">Agreement</th>
                        <th className="text-left px-4 py-3 font-semibold">Status</th>
                        <th className="text-right px-4 py-3 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partnerships.map((p) => (
                        <tr
                          key={p.id}
                          className="border-t border-border hover:bg-secondary/30 transition-smooth"
                        >
                          <td className="px-3 py-3">
                            <input
                              type="checkbox"
                              aria-label={`Select ${p.school_name}`}
                              checked={selectedPartnerships.has(p.id)}
                              onChange={() => setSelectedPartnerships((s) => toggleSel(s, p.id))}
                            />
                          </td>
                          <td className="px-4 py-3 font-medium">{p.school_name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{p.principal_name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{p.contact_person}</td>
                          <td className="px-4 py-3 text-muted-foreground font-mono">+91 {p.whatsapp}</td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            {new Date(p.preferred_start_date).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground font-mono">
                            {p.student_capacity ?? "—"}
                          </td>
                          <td className="px-4 py-3 font-mono">
                            ₹{(p.total_pay_amount ?? (p.student_capacity ?? 0) * 45).toLocaleString("en-IN")}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => togglePartnerPaid(p)}
                              disabled={updatingPartnershipId === p.id}
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-smooth ${
                                p.payment_paid
                                  ? "bg-primary/15 text-primary border border-primary/30"
                                  : "bg-secondary text-muted-foreground border border-border"
                              }`}
                            >
                              {updatingPartnershipId === p.id ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : p.payment_paid ? (
                                <CheckCircle2 size={12} />
                              ) : (
                                <Circle size={12} />
                              )}
                              {p.payment_paid ? "Paid" : "Unpaid"}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleAgreement(p)}
                              disabled={updatingPartnershipId === p.id}
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-smooth ${
                                p.agreed_payment_model
                                  ? "bg-primary/15 text-primary border border-primary/30"
                                  : "bg-destructive/15 text-destructive border border-destructive/30"
                              }`}
                            >
                              {updatingPartnershipId === p.id ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : p.agreed_payment_model ? (
                                <CheckCircle2 size={12} />
                              ) : (
                                <Circle size={12} />
                              )}
                              {p.agreed_payment_model ? "Agree" : "Disagree"}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleApproved(p)}
                              disabled={updatingPartnershipId === p.id}
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-smooth ${
                                p.approved
                                  ? "bg-primary/15 text-primary border border-primary/30 hover:shadow-neon"
                                  : "bg-secondary text-muted-foreground border border-border hover:bg-secondary/80"
                              }`}
                            >
                              {updatingPartnershipId === p.id ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : p.approved ? (
                                <CheckCircle2 size={12} />
                              ) : (
                                <Circle size={12} />
                              )}
                              {p.approved ? "Approved" : "Pending"}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-2 justify-end">
                              <a
                                href={`https://wa.me/91${p.whatsapp}?text=${encodeURIComponent(
                                  `Hello ${p.contact_person}, this is Nova Nurox regarding your partnership request for ${p.school_name}.`,
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-md bg-[#25D366]/15 border border-[#25D366]/40 text-[#25D366] px-3 h-8 text-xs font-semibold hover:bg-[#25D366]/25 transition-smooth"
                              >
                                <MessageCircle size={13} /> WhatsApp
                              </a>
                              <button
                                onClick={() => deleteRows("school_partnerships", [p.id])}
                                disabled={deleting}
                                className="inline-flex items-center justify-center rounded-md border border-destructive/40 bg-destructive/10 text-destructive h-8 w-8 hover:bg-destructive/20 disabled:opacity-60"
                                aria-label="Delete row"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="grid sm:grid-cols-3 gap-4 mt-6">
              <Stat label="Total Enrollments" value={enrollments.length} />
              <Stat label="Paid" value={enrollments.filter((e) => e.paid).length} accent />
              <Stat label="Unassigned" value={enrollments.filter((e) => !e.batch_number).length} />
            </div>

            <div className="mt-6 flex items-center justify-between gap-3 flex-wrap">
              <h2 className="font-display text-lg font-bold">Student Enrollments</h2>
              <div className="flex items-center gap-2">
                {selectedEnrollments.size > 0 && (
                  <button
                    onClick={() => deleteRows("student_enrollments", Array.from(selectedEnrollments))}
                    disabled={deleting}
                    className="inline-flex items-center gap-1.5 rounded-md border border-destructive/40 bg-destructive/10 text-destructive px-3 h-9 text-xs font-semibold hover:bg-destructive/20 disabled:opacity-60"
                  >
                    <Trash2 size={14} /> Delete selected ({selectedEnrollments.size})
                  </button>
                )}
                <button
                  onClick={loadEnrollments}
                  disabled={loadingEnrollments}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card/50 px-3 h-9 text-xs font-semibold hover:bg-secondary transition-smooth disabled:opacity-60"
                >
                  <RefreshCw size={14} className={loadingEnrollments ? "animate-spin" : ""} /> Refresh
                </button>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-border bg-gradient-card overflow-hidden">
              {loadingEnrollments ? (
                <div className="p-12 flex justify-center">
                  <Loader2 className="animate-spin text-primary" size={28} />
                </div>
              ) : enrollments.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <Users className="mx-auto text-muted-foreground/40" size={36} />
                  <p className="mt-3 text-sm">No enrollments yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-3 py-3 w-10">
                          <input
                            type="checkbox"
                            aria-label="Select all"
                            checked={enrollments.length > 0 && selectedEnrollments.size === enrollments.length}
                            onChange={(e) =>
                              setSelectedEnrollments(
                                e.target.checked
                                  ? new Set(enrollments.map((x) => x.id))
                                  : new Set(),
                              )
                            }
                          />
                        </th>
                        <th className="text-left px-4 py-3 font-semibold">Student</th>
                        <th className="text-left px-4 py-3 font-semibold">Class</th>
                        <th className="text-left px-4 py-3 font-semibold">School</th>
                        <th className="text-left px-4 py-3 font-semibold">Parent WhatsApp</th>
                        <th className="text-left px-4 py-3 font-semibold">Batch</th>
                        <th className="text-left px-4 py-3 font-semibold">Paid</th>
                        <th className="text-right px-4 py-3 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrollments.map((s) => (
                        <tr
                          key={s.id}
                          className="border-t border-border hover:bg-secondary/30 transition-smooth"
                        >
                          <td className="px-3 py-3">
                            <input
                              type="checkbox"
                              aria-label={`Select ${s.full_name}`}
                              checked={selectedEnrollments.has(s.id)}
                              onChange={() => setSelectedEnrollments((p) => toggleSel(p, s.id))}
                            />
                          </td>
                          <td className="px-4 py-3 font-medium">{s.full_name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{s.class_section}</td>
                          <td className="px-4 py-3 text-muted-foreground">{s.school_name}</td>
                          <td className="px-4 py-3 text-muted-foreground font-mono">+91 {s.parent_whatsapp}</td>
                          <td className="px-4 py-3">
                            <select
                              value={s.batch_number ?? ""}
                              disabled={updatingEnrollmentId === s.id}
                              onChange={(e) =>
                                setEnrollmentBatch(
                                  s,
                                  e.target.value === "" ? null : Number(e.target.value),
                                )
                              }
                              className="rounded-md border border-border bg-input/40 px-2 py-1 text-xs"
                            >
                              <option value="">—</option>
                              {[1, 2, 3, 4, 5].map((n) => (
                                <option key={n} value={n}>
                                  Batch {n}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleEnrollmentPaid(s)}
                              disabled={updatingEnrollmentId === s.id}
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-smooth ${
                                s.paid
                                  ? "bg-primary/15 text-primary border border-primary/30"
                                  : "bg-secondary text-muted-foreground border border-border"
                              }`}
                            >
                              {updatingEnrollmentId === s.id ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : s.paid ? (
                                <CheckCircle2 size={12} />
                              ) : (
                                <Circle size={12} />
                              )}
                              {s.paid ? "Paid" : "Unpaid"}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-2 justify-end">
                              <a
                                href={`https://wa.me/91${s.parent_whatsapp}?text=${encodeURIComponent(
                                  `Hi, this is Nova Nurox regarding ${s.full_name}'s AI Bootcamp enrollment.`,
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-md bg-[#25D366]/15 border border-[#25D366]/40 text-[#25D366] px-3 h-8 text-xs font-semibold hover:bg-[#25D366]/25 transition-smooth"
                              >
                                <MessageCircle size={13} /> WhatsApp
                              </a>
                              <button
                                onClick={() => deleteRows("student_enrollments", [s.id])}
                                disabled={deleting}
                                className="inline-flex items-center justify-center rounded-md border border-destructive/40 bg-destructive/10 text-destructive h-8 w-8 hover:bg-destructive/20 disabled:opacity-60"
                                aria-label="Delete row"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  danger,
}: {
  label: string;
  value: number;
  accent?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="rounded-xl bg-gradient-card border border-border p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div
        className={`mt-2 font-display text-3xl font-bold ${
          danger ? "text-destructive" : accent ? "text-gradient-neon" : "text-foreground"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
