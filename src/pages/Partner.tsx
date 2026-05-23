import { useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { CalendarIcon, CheckCircle2, Loader2, Rocket, ShieldCheck } from "lucide-react";
import { z } from "zod";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { friendlyError } from "@/lib/friendlyError";

const schema = z.object({
  school_name: z.string().trim().min(2, "School name is required").max(160),
  principal_name: z.string().trim().min(2, "Principal name is required").max(120),
  contact_person: z.string().trim().min(2, "Contact person is required").max(160),
  whatsapp: z
    .string()
    .trim()
    .regex(/^[0-9]{10}$/, "Enter a 10-digit WhatsApp number"),
  preferred_start_date: z.date({ required_error: "Pick a start date" }),
  student_capacity: z
    .number()
    .refine((n) => [20, 40, 60, 80, 100].includes(n), "Pick a student capacity"),
  agreed: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the 30/70 payment model" }),
  }),
  confirmed_capacity: z.literal(true, {
    errorMap: () => ({
      message: "You must confirm the chosen student count and the calculated school payable",
    }),
  }),
});

const SCHOOL_PER_STUDENT = 45; // 30% of ₹149 total course fee

export default function PartnerPage() {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [schoolName, setSchoolName] = useState("");
  const [principalName, setPrincipalName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [studentCapacity, setStudentCapacity] = useState<number>(100);
  const [agreed, setAgreed] = useState(false);
  const [confirmedCapacity, setConfirmedCapacity] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse({
      school_name: schoolName,
      principal_name: principalName,
      contact_person: contactPerson,
      whatsapp,
      preferred_start_date: startDate,
      student_capacity: studentCapacity,
      agreed,
      confirmed_capacity: confirmedCapacity,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }
    if (!supabaseConfigured) {
      setError("Backend not configured.");
      return;
    }
    setSubmitting(true);
    const { error: err } = await supabase.from("school_partnerships").insert({
      school_name: parsed.data.school_name,
      principal_name: parsed.data.principal_name,
      contact_person: parsed.data.contact_person,
      whatsapp: parsed.data.whatsapp,
      preferred_start_date: format(parsed.data.preferred_start_date, "yyyy-MM-dd"),
      student_capacity: parsed.data.student_capacity,
      total_pay_amount: parsed.data.student_capacity * SCHOOL_PER_STUDENT,
      payment_paid: false,
      agreed_payment_model: parsed.data.agreed,
    });
    setSubmitting(false);
    if (err) {
      if (typeof console !== "undefined") console.error("partner submit", err);
      setError(friendlyError(err, "Could not submit your partnership request. Please try again."));
      return;
    }
    setSubmitted(true);
  }

  return (
    <>
      <Header />
      <main className="pt-28 md:pt-36 pb-20">
        <section className="container mx-auto px-4 md:px-6 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-primary">
            <ShieldCheck size={14} /> Institutional Partnership
          </div>
          <h1 className="mt-5 font-display text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
            The Nova Nurox{" "}
            <span className="text-gradient-neon">Institutional Partnership</span> Proposal
          </h1>
          <p className="mt-6 text-base md:text-lg text-muted-foreground leading-relaxed">
            Nova Nurox is an AI-first education startup designed to bridge the gap between
            classroom theory and future technology for students across India. We offer a
            specialized <span className="text-foreground font-semibold">10-day Intensive AI
            Bootcamp</span> specifically engineered for mobile-first learning, ensuring that
            every student can master cutting-edge AI tools directly from their smartphones
            without requiring expensive school computer labs. Aligned with the{" "}
            <span className="text-foreground font-semibold">NEP 2020 framework</span>, our
            mission is to empower <span className="text-foreground font-semibold">100
            students per school</span> through a high-impact, small-batch approach. To make
            this high-quality education accessible, we operate on a collaborative{" "}
            <span className="text-foreground font-semibold">30/70 cost-sharing model</span>:
            the total course fee of <span className="text-foreground font-semibold">₹149</span>{" "}
            per student is split with the school contributing{" "}
            <span className="text-foreground font-semibold">₹45 (30%)</span> from its
            institutional fund and the parents contributing the remaining{" "}
            <span className="text-foreground font-semibold">₹104 (70%)</span>. This partnership
            ensures both school support and parental commitment, allowing us to deliver
            personalized 1-on-1 attention in{" "}
            <span className="text-foreground font-semibold">5 batches of 20 students each</span>{" "}
            over a structured <span className="text-foreground font-semibold">100-day
            schedule</span>.
          </p>

          {!showForm && !submitted && (
            <div className="mt-10 flex justify-center">
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-gradient-neon px-7 h-12 text-sm font-bold text-background shadow-neon hover:scale-[1.02] transition-smooth"
              >
                <Rocket size={16} /> Partner With Us — Start Your 10-Day AI Program
              </button>
            </div>
          )}

          {showForm && !submitted && (
            <form
              onSubmit={onSubmit}
              className="mt-10 rounded-2xl border border-border bg-gradient-card p-6 md:p-8 space-y-5"
            >
              <h2 className="font-display text-xl font-bold">Partnership Application</h2>

              <Field label="School Name & Branch" hint="e.g., DPS, Kanpur">
                <Input
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="DPS, Kanpur"
                  required
                />
              </Field>

              <Field label="Principal's Full Name">
                <Input
                  value={principalName}
                  onChange={(e) => setPrincipalName(e.target.value)}
                  placeholder="Dr. A. Sharma"
                  required
                />
              </Field>

              <Field label="Contact Person & Designation" hint="e.g., HOD Computer Science">
                <Input
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="R. Verma, HOD Computer Science"
                  required
                />
              </Field>

              <Field label="Official WhatsApp Number">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-9 items-center rounded-md border border-input bg-secondary/40 px-3 text-sm text-muted-foreground">
                    +91
                  </span>
                  <Input
                    value={whatsapp}
                    onChange={(e) =>
                      setWhatsapp(e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    inputMode="numeric"
                    placeholder="9876543210"
                    required
                  />
                </div>
              </Field>

              <Field label="Preferred Start Date">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </Field>



              <div className="rounded-2xl bg-black border border-primary/40 p-5 md:p-6 space-y-4 text-white shadow-neon">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-primary">
                    Capacity & Payable
                  </span>
                  <span className="text-[11px] text-white/60">30/70 partnership policy</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold">Student Capacity</label>
                  <p className="text-xs text-white/60">
                    How many students can your school provide for this batch?
                  </p>
                  <select
                    value={studentCapacity}
                    onChange={(e) => {
                      setStudentCapacity(Number(e.target.value));
                      setConfirmedCapacity(false);
                    }}
                    className="flex h-10 w-full rounded-md border border-white/20 bg-white/5 text-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required
                  >
                    {[20, 40, 60, 80, 100].map((n) => (
                      <option key={n} value={n} className="text-black">
                        {n} students
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-xl border border-white/15 bg-white/[0.04] p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-white/70">
                    <span>School share per student (30%)</span>
                    <span className="font-mono text-white">₹{SCHOOL_PER_STUDENT}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-white/70">
                    <span>Students chosen</span>
                    <span className="font-mono text-white">{studentCapacity}</span>
                  </div>
                  <div className="h-px bg-white/10" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Total School Payable</span>
                    <span className="font-display text-2xl font-bold text-gradient-neon">
                      ₹{(studentCapacity * SCHOOL_PER_STUDENT).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/50">
                    Parents pay the remaining 70% (₹104 × {studentCapacity} = ₹
                    {(studentCapacity * 104).toLocaleString("en-IN")}) directly to Nova Nurox.
                  </p>
                </div>

                <label className="flex items-start gap-3 rounded-md border border-white/20 bg-white/[0.03] p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmedCapacity}
                    onChange={(e) => setConfirmedCapacity(e.target.checked)}
                    className="mt-1 h-4 w-4 accent-primary"
                  />
                  <span className="text-xs text-white/85">
                    We confirm <strong>{studentCapacity} students</strong> and agree to a school
                    payable of{" "}
                    <strong>
                      ₹{(studentCapacity * SCHOOL_PER_STUDENT).toLocaleString("en-IN")}
                    </strong>
                    . Enrollment will be capped at this number.
                  </span>
                </label>
              </div>

              <label className="flex items-start gap-3 rounded-md border border-border bg-background/40 p-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-primary"
                />
                <span className="text-sm text-muted-foreground">
                  We agree to the{" "}
                  <span className="text-foreground font-semibold">30/70 payment model</span>{" "}
                  (₹45/student from school — 30%; ₹104/student from parents — 70%).
                </span>
              </label>

              {error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-gradient-neon px-6 h-11 text-sm font-bold text-background shadow-neon hover:scale-[1.01] transition-smooth disabled:opacity-60"
                >
                  {submitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Rocket size={16} />
                  )}
                  Submit Partnership Request
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="inline-flex items-center justify-center rounded-md border border-border bg-card/40 px-5 h-11 text-sm font-semibold hover:bg-card transition-smooth"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {submitted && (
            <div className="mt-10 rounded-2xl border border-primary/30 bg-gradient-card p-8 text-center">
              <CheckCircle2 className="mx-auto text-primary" size={42} />
              <h2 className="mt-4 font-display text-2xl font-bold">Application Received</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Thank you. Our team will reach out on WhatsApp within 24 hours to schedule
                your onboarding call.
              </p>
              <Link
                to="/"
                className="mt-6 inline-flex items-center justify-center rounded-md border border-border bg-card/40 px-5 h-10 text-sm font-semibold hover:bg-card transition-smooth"
              >
                Back to Home
              </Link>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold">
        {label}
        {hint && <span className="ml-2 text-xs text-muted-foreground font-normal">({hint})</span>}
      </label>
      {children}
    </div>
  );
}
