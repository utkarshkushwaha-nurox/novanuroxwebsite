import { AlertTriangle, Zap } from "lucide-react";

const PROBLEMS = [
  "Schools teach you to memorize, not to build.",
  "By graduation, the technology you learned is already obsolete.",
  "A massive Skill Gap stands between a degree and a high-paying tech job.",
];

const SOLUTIONS = [
  {
    t: "AI-First Thinking",
    d: "We teach you to co-create with AI (Copilot, LLMs) and build 10× faster.",
  },
  {
    t: "Practical Mastery",
    d: "No boring lectures. Learn by doing — from first line of code to launching a full-stack project.",
  },
  {
    t: "Accessibility for All",
    d: "High-end PC or just a smartphone — Nova Nurox makes top-tier tech education available to everyone.",
  },
];

export function WhyNurox() {
  return (
    <section id="why" className="py-20 md:py-28 relative bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,oklch(0.15_0.03_260)_0%,oklch(0.10_0.015_260)_70%)]" />
      <div className="container relative mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-xs uppercase tracking-[0.3em] text-destructive">
            Harsh Reality
          </span>
          <h2 className="mt-3 text-3xl md:text-5xl lg:text-6xl font-bold">
            Why <span className="text-gradient-neon">Nova Nurox</span> Exists
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mt-16 max-w-6xl mx-auto">
          {/* The Problem */}
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-7 md:p-9">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/15 border border-destructive/30 flex items-center justify-center text-destructive">
                <AlertTriangle size={20} />
              </div>
              <h3 className="font-display text-2xl md:text-3xl font-bold">
                A Broken System
              </h3>
            </div>
            <p className="mt-5 text-muted-foreground leading-relaxed">
              The current education system is stuck in the past. Millions of students spend
              years learning outdated theories while the world outside is being transformed by
              Artificial Intelligence.
            </p>
            <ul className="mt-6 space-y-4">
              {PROBLEMS.map((p) => (
                <li key={p} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                  <span className="text-base md:text-lg font-display font-semibold text-foreground/95 leading-snug">
                    {p}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* The Solution */}
          <div className="rounded-2xl glow-border bg-card/40 p-7 md:p-9">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shadow-neon">
                <Zap size={20} />
              </div>
              <h3 className="font-display text-2xl md:text-3xl font-bold">
                The Mission: Bridging the Gap
              </h3>
            </div>
            <p className="mt-5 text-muted-foreground leading-relaxed">
              Age shouldn&apos;t be a barrier to innovation. If an 8th-grade student has the
              vision to build, they should have the tools to do it.
            </p>
            <div className="mt-6 space-y-4">
              {SOLUTIONS.map((s) => (
                <div key={s.t} className="rounded-lg border border-border bg-background/40 p-4">
                  <div className="font-display font-bold text-primary">{s.t}</div>
                  <div className="text-sm text-muted-foreground mt-1">{s.d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 max-w-3xl mx-auto text-center">
          <p className="font-display text-xl md:text-2xl text-foreground">
            Nova Nurox doesn&apos;t just prepare you for the future —{" "}
            <span className="text-gradient-neon">it empowers you to build it.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
