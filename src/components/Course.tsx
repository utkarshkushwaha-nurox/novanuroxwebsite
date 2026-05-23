import { Check } from "lucide-react";

const DAYS = [
  { d: "Day 01", t: "The CEO Mindset", s: "ChatGPT / Gemini — Strategy & Blueprint" },
  { d: "Day 02", t: "Market Intelligence", s: "NotebookLM — Your Private Expert Bot" },
  { d: "Day 03", t: "Brand Visuals", s: "Nano Banana Pro — 4K Logo & Brand Photos" },
  { d: "Day 04", t: "Content Studio", s: "Canva Magic — 30 Days of Posts & Reels" },
  { d: "Day 05", t: "The Pitch Deck", s: "Gamma AI — Interactive Web Presentation" },
  { d: "Day 06", t: "Global Media", s: "ElevenLabs — Voice Cloning in 30+ Languages" },
  { d: "Day 07", t: "Executive Writing", s: "Claude Artifacts — Pro Blogs & Proposals" },
  { d: "Day 08", t: "Deep Research", s: "Perplexity — Market Gaps & Competitor Intel" },
  { d: "Day 09", t: "Grand Launch", s: "WhatsApp & Canva — Publish & Go Live" },
  { d: "Day 10", t: "The Finale", s: "Winner Announcement & Awards Ceremony" },
];

const INCLUDES = [
  "10 Days of Live Training",
  "Personal mentorship by Utkarsh Kushwaha",
  "VIP Community Access",
  "Digital Certificate of Completion",
  "Lifetime access to recordings",
  "Phone-friendly (Replit on browser)",
];

export function Course() {
  return (
    <section id="course" className="py-20 md:py-28 relative">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
      <div className="container relative mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-xs uppercase tracking-[0.3em] text-primary">The Course</span>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold">
            Nova Nurox: The{" "}
            <span className="text-gradient-neon">10-Day AI Course</span> Challenge
          </h2>
          <p className="mt-4 font-display text-lg text-primary">
            Build Your Empire & Go Live in 10 Days.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6 mt-14 max-w-6xl mx-auto">
          {/* Curriculum */}
          <div className="lg:col-span-3">
            <h3 className="font-display text-xl font-bold mb-5">Curriculum</h3>
            <ol className="relative space-y-4 before:content-[''] before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-px before:bg-border">
              {DAYS.map((day, i) => (
                <li key={day.d} className="relative pl-12">
                  <div className="absolute left-0 top-1 h-8 w-8 rounded-full bg-gradient-neon flex items-center justify-center font-display font-bold text-background text-sm shadow-glow">
                    {i + 1}
                  </div>
                  <div className="rounded-xl bg-gradient-card border border-border p-4 md:p-5 hover:border-primary/40 transition-smooth">
                    <div className="text-xs uppercase tracking-wider text-primary">{day.d}</div>
                    <div className="mt-1 font-display font-bold text-lg">{day.t}</div>
                    <div className="text-sm text-muted-foreground mt-0.5">{day.s}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Pricing card */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 rounded-2xl glow-border bg-card/60 backdrop-blur-sm p-6 md:p-7">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider">
                <span className="px-2 py-1 rounded-full bg-primary/15 text-primary">
                  Alpha Batch
                </span>
                <span className="text-muted-foreground">First 20 only</span>
              </div>

              <h3 className="mt-4 font-display text-xl font-bold">
                Join the Alpha Batch.
                <br />
                Lead the Future.
              </h3>

              <div className="mt-5 flex items-baseline gap-2">
                <span className="font-display text-5xl font-bold text-gradient-neon">₹149</span>
                <span className="text-muted-foreground line-through">₹2,499</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">Early Bird Offer</div>

              <ul className="mt-6 space-y-2.5">
                {INCLUDES.map((i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <Check size={16} className="text-primary mt-0.5 shrink-0" />
                    <span className="text-foreground/90">{i}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#join"
                className="mt-6 w-full inline-flex items-center justify-center rounded-md bg-gradient-neon h-12 text-sm font-bold text-background shadow-neon hover:scale-[1.02] transition-smooth"
              >
                Confirm Your Seat
              </a>
              <p className="text-[11px] text-muted-foreground text-center mt-3">
                No upfront payment. We&apos;ll contact you within 24 hours.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
