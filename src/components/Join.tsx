import { useState } from "react";
import { z } from "zod";
import { CheckCircle2, Clock, Loader2, Lock } from "lucide-react";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { friendlyError } from "@/lib/friendlyError";
import { useSeatCount } from "@/hooks/useSeatCount";

const Schema = z.object({
  full_name: z.string().trim().min(2, "Please enter your full name").max(80),
  email: z.string().trim().email("Enter a valid email").max(120),
  whatsapp: z
    .string()
    .trim()
    .regex(/^[0-9]{10}$/, "WhatsApp must be exactly 10 digits"),
  city: z.string().trim().max(80).optional().or(z.literal("")),
});

type FormData = z.infer<typeof Schema>;
type Errors = Partial<Record<keyof FormData, string>>;

export function Join() {
  const { paidCount, seatsLeft, isFull, totalSeats } = useSeatCount();

  const [form, setForm] = useState<FormData>({
    full_name: "",
    email: "",
    whatsapp: "",
    city: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function update<K extends keyof FormData>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    const result = Schema.safeParse(form);
    if (!result.success) {
      const errs: Errors = {};
      result.error.issues.forEach((i) => {
        const key = i.path[0] as keyof FormData;
        if (!errs[key]) errs[key] = i.message;
      });
      setErrors(errs);
      return;
    }

    if (!supabaseConfigured) {
      setSubmitError(
        "Supabase isn't configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env",
      );
      return;
    }

    setSubmitting(true);

    // Check for existing email or WhatsApp
    const { data: existing, error: checkError } = await supabase
      .from("signups")
      .select("email, whatsapp")
      .or(`email.eq.${result.data.email},whatsapp.eq.${result.data.whatsapp}`)
      .limit(1);

    if (checkError) {
      setSubmitting(false);
      if (typeof console !== "undefined") console.error("join check", checkError);
      setSubmitError(friendlyError(checkError, "Could not submit. Please try again."));
      return;
    }

    if (existing && existing.length > 0) {
      setSubmitting(false);
      const dup = existing[0];
      if (dup.email === result.data.email) {
        setErrors((e) => ({ ...e, email: "This email is already registered" }));
      }
      if (dup.whatsapp === result.data.whatsapp) {
        setErrors((e) => ({ ...e, whatsapp: "This WhatsApp number is already registered" }));
      }
      return;
    }

    const { error } = await supabase.from("signups").insert({
      full_name: result.data.full_name,
      email: result.data.email,
      whatsapp: result.data.whatsapp,
      city: result.data.city || null,
    });
    setSubmitting(false);

    if (error) {
      if (typeof console !== "undefined") console.error("join submit", error);
      // Handle DB unique constraint violation
      if (error.code === "23505" || error.message.toLowerCase().includes("duplicate")) {
        setSubmitError("This email or WhatsApp number is already registered.");
      } else {
        setSubmitError(friendlyError(error, "Could not submit. Please try again."));
      }
      return;
    }

    setSuccess(true);
    setForm({ full_name: "", email: "", whatsapp: "", city: "" });
  }

  return (
    <section id="join" className="py-20 md:py-28 relative">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
      <div className="container relative mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-xs uppercase tracking-[0.3em] text-primary">Join</span>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold">
            Reserve Your <span className="text-gradient-neon">Alpha Seat</span>
          </h2>
          <p className="mt-4 text-muted-foreground md:text-lg">
            Founder&apos;s Alpha Batch — strictly limited to {totalSeats} students.
          </p>
        </div>

        {/* Seat counter */}
        <div className="max-w-3xl mx-auto mt-8">
          <div className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Seats filled</span>
              <span className="font-display font-bold">
                <span className="text-gradient-neon">{paidCount}</span> / {totalSeats}
              </span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-gradient-neon transition-all duration-700"
                style={{ width: `${Math.min(100, (paidCount / totalSeats) * 100)}%` }}
              />
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              {isFull ? (
                <span className="text-destructive font-semibold">Batch Full</span>
              ) : (
                <>
                  Only{" "}
                  <span className="text-primary font-semibold">{seatsLeft} seats left</span> in
                  the Alpha Batch.
                </>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto mt-8">
          <div
            className={`rounded-2xl bg-gradient-card border p-6 md:p-9 transition-smooth ${
              success ? "border-primary shadow-neon" : "border-border"
            }`}
          >
            {success ? (
              <div className="text-center py-6 animate-float-up">
                <div className="mx-auto h-16 w-16 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center text-primary shadow-neon">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="mt-5 font-display text-2xl md:text-3xl font-bold">
                  Seat <span className="text-gradient-neon">Confirmed!</span> 🚀
                </h3>
                <p className="mt-3 text-muted-foreground max-w-md mx-auto">
                  Welcome to the Nova Nurox Alpha Batch. You&apos;re officially in.
                </p>
                <div className="mt-5 inline-flex items-center gap-2 rounded-full glow-border bg-card/60 px-5 py-2.5 text-sm">
                  <Clock size={16} className="text-primary" />
                  <span>I will contact you within 24 hours to settle the payment.</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {isFull && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
                    <Lock size={16} /> Batch is full. New batches open soon.
                  </div>
                )}
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field
                    label="Full Name *"
                    error={errors.full_name}
                    value={form.full_name}
                    onChange={(v) => update("full_name", v)}
                    placeholder="Utkarsh Kushwaha"
                  />
                  <Field
                    label="Email *"
                    type="email"
                    error={errors.email}
                    value={form.email}
                    onChange={(v) => update("email", v)}
                    placeholder="you@example.com"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field
                    label="WhatsApp Number *"
                    error={errors.whatsapp}
                    value={form.whatsapp}
                    onChange={(v) => update("whatsapp", v.replace(/\D/g, "").slice(0, 10))}
                    placeholder="10-digit number"
                    inputMode="numeric"
                  />
                  <Field
                    label="City"
                    error={errors.city}
                    value={form.city ?? ""}
                    onChange={(v) => update("city", v)}
                    placeholder="(optional)"
                  />
                </div>

                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-foreground/90 flex items-start gap-2">
                  <Clock size={14} className="text-primary mt-0.5 shrink-0" />
                  <span>
                    No upfront payment required. <strong>I will contact you within 24 hours</strong>{" "}
                    to settle the payment.
                  </span>
                </div>

                {submitError && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    {submitError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || isFull}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-gradient-neon h-12 text-sm font-bold text-background shadow-neon hover:scale-[1.01] transition-smooth disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  {isFull ? "Batch Full" : submitting ? "Confirming..." : "Confirm Your Seat"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  error,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
}: {
  label: string;
  error?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: "text" | "numeric" | "email";
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`mt-1.5 w-full h-11 rounded-md border bg-input/40 px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-smooth ${
          error ? "border-destructive" : "border-border focus:border-primary/60"
        }`}
      />
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}
