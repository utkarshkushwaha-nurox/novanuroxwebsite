export function About() {
  return (
    <section id="about" className="py-20 md:py-28 relative">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-xs uppercase tracking-[0.3em] text-primary">About</span>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold">
            Where <span className="text-gradient-neon">Curiosity</span> Meets Code
          </h2>
          <p className="mt-6 text-muted-foreground md:text-lg leading-relaxed">
            Nova Nurox is an AI-first education ecosystem built for the next generation of
            creators. We don&apos;t teach you to memorize — we teach you to{" "}
            <span className="text-foreground font-semibold">co-create with AI</span>, ship real
            projects, and lead the 2026 wave of intelligent software.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mt-14 max-w-5xl mx-auto">
          {[
            {
              t: "AI-First",
              d: "Every lesson, every project — built around modern AI co-pilots and LLMs.",
            },
            {
              t: "Build, Don't Memorize",
              d: "From your first prompt to a full-stack project shipped in 10 days.",
            },
            {
              t: "Phone-Friendly",
              d: "All you need is a browser. Code on your phone with Replit — anywhere.",
            },
          ].map((c) => (
            <div
              key={c.t}
              className="rounded-xl bg-gradient-card p-6 border border-border hover:border-primary/40 transition-smooth shadow-card"
            >
              <h3 className="font-display text-xl font-bold">{c.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{c.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
