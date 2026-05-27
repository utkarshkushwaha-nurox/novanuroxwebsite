import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, GraduationCap, Loader2, Rocket } from "lucide-react";
import { z } from "zod";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { friendlyError } from "@/lib/friendlyError";

// Zod schema for input form field constraint validation
const Schema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(80),
  class_section: z.string().trim().min(1, "Enter your class & section").max(40),
  school_name: z.string().trim().min(1, "Select your school"),
  parent_whatsapp: z
    .string()
    .trim()
    .regex(/^[0-9]{10}$/, "WhatsApp must be exactly 10 digits"),
});

type FormData = z.infer<typeof Schema>;
type SchoolOption = { school_name: string; student_capacity: number; enrolled_count: number };

export default function EnrollPage() {
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [schoolError, setSchoolError] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({
    full_name: "",
    class_section: "",
    school_name: "",
    parent_whatsapp: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!supabaseConfigured) {
        setLoadingSchools(false);
        return;
      }
      // Security Definer RPC execution for safety masking
      const { data, error } = await supabase.rpc("list_partner_schools");
      if (cancelled) return;
      if (error) {
        setSchoolError(
          "Could not load schools. Make sure the list_partner_schools() RPC exists in Supabase.",
        );
      } else {
        const rows = (data ?? []) as SchoolOption[];
        setSchools(rows.filter((r) => r.school_name));
      }
      setLoadingSchools(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function update<K extends keyof FormData>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const parsed = Schema.safeParse(form);
    if (!parsed.success) {
      const errs: Partial<Record<keyof FormData, string>> = {};
      parsed.error.issues.forEach((i) => {
        const k = i.path[0] as keyof FormData;
        if (!errs[k]) errs[k] = i.message;
      });
      setErrors(errs);
      return;
    }

    if (!supabaseConfigured) {
      setSubmitError("Backend not configured.");
      return;
    }

    const sel = schools.find((x) => x.school_name === parsed.data.school_name);
    if (sel && sel.student_capacity > 0 && sel.enrolled_count >= sel.student_capacity) {
      setSubmitError("This school's batch is already full. Please contact us on WhatsApp.");
      return;
    }

    setSubmitting(true);

    // Step 1: Create a pending record in Supabase
    const { data: enrollmentData, error } = await supabase
      .from("student_enrollments")
      .insert({
        full_name: parsed.data.full_name,
        class_section: parsed.data.class_section,
        school_name: parsed.data.school_name,
        parent_whatsapp: parsed.data.parent_whatsapp,
        paid: false,
      })
      .select()
      .single();

    if (error) {
      if (typeof console !== "undefined") console.error("enroll submit", error);
      const msg = (error as { message?: string }).message ?? "";
      if (msg.toLowerCase().includes("full") || msg.toLowerCase().includes("not an approved")) {
        setSubmitError("Registration closed for this school (capacity reached).");
      } else {
        setSubmitError(friendlyError(error, "Could not register. Please try again."));
      }
      setSubmitting(false);
      return;
    }

    // Step 2: Open Razorpay Payment Window Gateway Frame natively
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || "YOUR_PUBLIC_KEY_ID",
      amount: 104 * 100, // Stored explicitly in lesser-denomination units (Paise)
      currency: "INR",
      name: "Nova Nurox",
      description: `AI Intensive Bootcamp Registration - ${parsed.data.full_name}`,
      prefill: {
        name: parsed.data.full_name,
        contact: parsed.data.parent_whatsapp,
      },
      handler: async function (response: any) {
        // Fire database execution mutation changes upon success callback trap
        const { error: patchError } = await supabase
          .from("student_enrollments")
          .update({
            paid: true,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
          })
          .eq("id", enrollmentData.id);

        setSubmitting(false);
        if (!patchError) {
          setSuccess(true);
          setForm({ full_name: "", class_section: "", school_name: "", parent_whatsapp: "" });
        } else {
          setSubmitError("Payment captured, but structural update failed. Please text support.");
        }
      },
      modal: {
        ondismiss: function () {
          setSubmitting(false);
          setSubmitError("Payment screen was dismissed by the user before authorization.");
        },
      },
      theme: {
        color: "#00F0FF", // Custom high-contrast aesthetic cyan theme mapping
      },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  }

  return (
    <>
      <Header />
      <main className="pt-28 md:pt-36 pb-20">
        <section className="container mx-auto px-4 md:px-6 max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-primary">
            <GraduationCap size={14} /> Student Registration
          </div>
          <h1 className="mt-5 font-display text-3xl sm:text-4xl font-bold leading-tight">
            Join Your School&apos;s <span className="text-gradient-neon">AI Bootcamp</span>
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            Register for your school&apos;s 12-day Nova Nurox AI Bootcamp. Limited to 20 students
            per batch.
          </p>

          {success ? (
            <div className="mt-8 rounded-2xl border border-primary/30 bg-gradient-card p-8 text-center">
              <CheckCircle2 className="mx-auto text-primary" size={42} />
              <h2 className="mt-4 font-display text-2xl font-bold">Registration Received</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Your spot is confirmed! Your payment transaction record has been cleanly cataloged,
                and your seats are reserved inside the intensive cluster.
              </p>
              <Link
                to="/"
                className="mt-6 inline-flex items-center justify-center rounded-md border border-border bg-card/40 px-5 h-10 text-sm font-semibold hover:bg-card transition-smooth"
              >
                Back to Home
              </Link>
            </div>
          ) : (
            <form
              onSubmit={onSubmit}
              className="mt-8 rounded-2xl border border-border bg-gradient-card p-5 sm:p-7 space-y-4"
            >
              <Field
                label="Student Full Name"
                value={form.full_name}
                onChange={(v) => update("full_name", v)}
                error={errors.full_name}
                placeholder="e.g., Aarav Sharma"
              />

              <Field
                label="Class & Section"
                value={form.class_section}
                onChange={(v) => update("class_section", v)}
                error={errors.class_section}
                placeholder="e.g., 9-B"
              />

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold">School Name</label>
                {loadingSchools ? (
                  <div className="h-11 rounded-md border border-border bg-input/40 px-3 flex items-center text-sm text-muted-foreground">
                    <Loader2 size={14} className="animate-spin mr-2" /> Loading partner schools…
                  </div>
                ) : schoolError ? (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    {schoolError}
                  </div>
                ) : schools.length === 0 ? (
                  <>
                    <input
                      value={form.school_name}
                      onChange={(e) => update("school_name", e.target.value)}
                      placeholder="Type your school name"
                      className="w-full h-11 rounded-md border border-border bg-input/40 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      No partner schools yet — type your school name.
                    </p>
                  </>
                ) : (
                  <>
                    <select
                      value={form.school_name}
                      onChange={(e) => update("school_name", e.target.value)}
                      className={`w-full h-11 rounded-md border bg-input/40 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                        errors.school_name ? "border-destructive" : "border-border"
                      }`}
                    >
                      <option value="">Select your school…</option>
                      {schools.map((s) => {
                        const full =
                          s.enrolled_count >= s.student_capacity && s.student_capacity > 0;
                        return (
                          <option key={s.school_name} value={s.school_name} disabled={full}>
                            {s.school_name}
                            {s.student_capacity > 0
                              ? ` — ${s.enrolled_count}/${s.student_capacity}${full ? " (FULL)" : ""}`
                              : ""}
                          </option>
                        );
                      })}
                    </select>
                    {(() => {
                      const sel = schools.find((x) => x.school_name === form.school_name);
                      if (!sel) return null;
                      const full =
                        sel.enrolled_count >= sel.student_capacity && sel.student_capacity > 0;
                      return (
                        <p
                          className={`text-[11px] ${
                            full ? "text-destructive" : "text-muted-foreground"
                          }`}
                        >
                          {full
                            ? "This school's batch is full. Registration is closed."
                            : `${sel.student_capacity - sel.enrolled_count} seats left of ${sel.student_capacity}.`}
                        </p>
                      );
                    })()}
                  </>
                )}
                {errors.school_name && (
                  <span className="block text-xs text-destructive">{errors.school_name}</span>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold">Parent&apos;s WhatsApp Number</label>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-11 items-center rounded-md border border-input bg-secondary/40 px-3 text-sm text-muted-foreground">
                    +91
                  </span>
                  <input
                    value={form.parent_whatsapp}
                    onChange={(e) =>
                      update("parent_whatsapp", e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    inputMode="numeric"
                    placeholder="9876543210"
                    className={`flex-1 h-11 rounded-md border bg-input/40 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                      errors.parent_whatsapp ? "border-destructive" : "border-border"
                    }`}
                  />
                </div>
                {errors.parent_whatsapp && (
                  <span className="block text-xs text-destructive">{errors.parent_whatsapp}</span>
                )}
              </div>

              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-foreground/90">
                <strong>Registration Fee: ₹104</strong> (Payable instantly via secure gateway popup)
                <div className="text-[11px] text-muted-foreground mt-1">
                  Total course fee ₹149 — your school fund handles ₹45 (30%); parents process ₹104
                  (70%).
                </div>
              </div>

              {submitError && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-gradient-neon h-12 text-sm font-bold text-background shadow-neon hover:scale-[1.01] transition-smooth disabled:opacity-60"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />}
                Pay & Register for Bootcamp
              </button>
            </form>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full h-11 rounded-md border bg-input/40 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${
          error ? "border-destructive" : "border-border"
        }`}
      />
      {error && <span className="block text-xs text-destructive">{error}</span>}
    </div>
  );
}
