import { Trophy, Lightbulb } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import founderUtkarsh from "@/assets/founder-utkarsh.jpeg";
import cofounderJayant from "@/assets/jayantcofounder.jpeg"; // Make sure this matches your file name exactly

const FOUNDERS = [
  {
    name: "Utkarsh Kushwaha",
    role: "Founder & Lead Developer & CEO",
    quote: "I don't just write code; I build futures. 🚀",
    bio: "Utkarsh is a Full-Stack Developer and UI/UX Designer who believes in pushing the boundaries of technology. Coding and AI deep-diving since 4th class, he started Nova Nurox so every student can learn to make AI their Co-Pilot — not their servant.",
    skills: ["React", "Python (Flask)", "Prompt Engineering", "Hardware Expert"],
    achievement: "Winner & Top Scorer — 7-Day Technical Fix-a-thon (2026)",
    icon: Trophy,
    initials: "UK",
    photo: founderUtkarsh,
  },
  {
    name: "Jayant Dubey", // Updated Name to Jayant Dubey
    role: "Co-Founder & Strategy Lead",
    quote: "Innovation is the heartbeat of Nova Nurox. 💡",
    bio: "Jayant handles strategy and operations to turn the Nova Nurox vision into reality. His focus: building India's most trusted AI-first education platform. He believes the right mentorship can turn any student into a next-gen creator.",
    skills: ["Strategy", "Operations", "Mentorship", "Growth"],
    achievement: "Driving India's AI-first education movement",
    icon: Lightbulb,
    initials: "JD", // Updated Initials to JD
    photo: cofounderJayant, // Pointing to Jayant's imported image
  },
];

export function Founders() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.idx);
            setVisibleCards((prev) => new Set(prev).add(idx));
          }
        });
      },
      { threshold: 0.2 },
    );

    const cards = sectionRef.current?.querySelectorAll("[data-idx]");
    cards?.forEach((c) => observer.observe(c));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="founders" ref={sectionRef} className="py-20 md:py-28 relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-xs uppercase tracking-[0.3em] text-primary">Owners</span>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold">
            Meet the <span className="text-gradient-neon">Founders</span>
          </h2>
          <p className="mt-4 text-muted-foreground md:text-lg">
            Two minds. One mission — turning students into creators.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-14 max-w-5xl mx-auto">
          {FOUNDERS.map((f, idx) => {
            const isVisible = visibleCards.has(idx);
            return (
              <article
                key={f.name}
                data-idx={idx}
                style={{ transitionDelay: `${idx * 150}ms` }}
                className={`rounded-2xl bg-gradient-card border border-border hover:border-primary/40 shadow-card overflow-hidden transition-all duration-700 ease-out hover:-translate-y-2 hover:shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.4)] ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
                }`}
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-gradient-neon">
                  <img
                    src={f.photo}
                    alt={`${f.name} — ${f.role}`}
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="font-display text-2xl md:text-3xl font-bold drop-shadow-lg">
                      {f.name}
                    </h3>
                    <p className="text-sm text-primary font-medium">{f.role}</p>
                  </div>
                </div>

                <div className="p-6 md:p-8">
                  <p className="text-base font-display italic text-foreground/90">
                    &ldquo;{f.quote}&rdquo;
                  </p>

                  <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{f.bio}</p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {f.skills.map((s) => (
                      <span
                        key={s}
                        className="px-3 py-1 rounded-full text-xs border border-border bg-secondary/50 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <f.icon size={18} className="text-primary mt-0.5 shrink-0" />
                    <p className="text-xs md:text-sm text-foreground/90">{f.achievement}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
