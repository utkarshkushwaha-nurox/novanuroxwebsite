import { BookOpen, Code2, Layers, Sparkles } from "lucide-react";

const FEATURES = [
  {
    icon: BookOpen,
    t: "AI-First Curriculum",
    d: "Courses specifically designed to master AI tools and Copilot technologies.",
  },
  {
    icon: Code2,
    t: "Hands-on Projects",
    d: "Real-world coding experience using modern frameworks like React and Python.",
  },
  {
    icon: Layers,
    t: "Interactive Learning",
    d: "A modular approach to full-stack web development and AI integration.",
  },
  {
    icon: Sparkles,
    t: "Future-Ready Skills",
    d: "Learn the exact tools shaping 2026 — prompt engineering, gen AI, automations.",
  },
];

export function Ecosystem() {
  return (
    <section id="ecosystem" className="py-20 md:py-28 relative">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
      <div className="container relative mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-xs uppercase tracking-[0.3em] text-primary">Ecosystem</span>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold">
            We Learn You <span className="text-gradient-neon">AI</span>
          </h2>
          <p className="mt-3 text-primary font-semibold">
            Empowering the Next Generation of Creators with AI.
          </p>
          <p className="mt-6 text-muted-foreground md:text-lg leading-relaxed">
            <span className="text-foreground font-semibold">We Learn You AI</span> is a
            specialized educational initiative under the Nova Nurox ecosystem. It bridges the
            gap between traditional learning and the rapidly evolving world of Artificial
            Intelligence — making complex concepts accessible, practical, and engaging.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-14">
          {FEATURES.map((f) => (
            <div
              key={f.t}
              className="group rounded-xl bg-gradient-card p-6 border border-border hover:border-primary/50 hover:-translate-y-1 transition-smooth shadow-card"
            >
              <div className="h-11 w-11 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary group-hover:shadow-neon transition-smooth">
                <f.icon size={22} />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold">{f.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 max-w-4xl mx-auto rounded-2xl glow-border bg-card/40 backdrop-blur-sm p-8 md:p-10 text-center">
          <span className="text-xs uppercase tracking-[0.3em] text-primary">Our Vision</span>
          <p className="mt-4 text-lg md:text-xl leading-relaxed">
            To build a community where every student can transform their ideas into reality
            using the power of AI. From building a website from scratch to automating
            workflows — <span className="text-gradient-neon font-semibold">We Learn You AI</span>{" "}
            is the roadmap.
          </p>
        </div>
      </div>
    </section>
  );
}
