import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const NAV = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Ecosystem", href: "#ecosystem" },
  { label: "Founders", href: "#founders" },
  { label: "Course", href: "#course" },
  { label: "Why Nurox", href: "#why" },
  { label: "FAQs", href: "#faqs" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const onAdmin = location.pathname.startsWith("/admin");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-smooth ${
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border/60"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between gap-2 px-3 sm:px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2 group min-w-0">
          <div className="relative h-8 w-8 shrink-0 rounded-md bg-gradient-neon flex items-center justify-center font-display font-bold text-background shadow-neon">
            N
          </div>
          <span className="font-display font-bold tracking-wide text-base sm:text-lg truncate">
            NOVA <span className="text-gradient-neon">NUROX</span>
          </span>
        </Link>

        {!onAdmin && (
          <nav className="hidden lg:flex items-center gap-7">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-smooth"
              >
                {n.label}
              </a>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-3">
          {!onAdmin && (
            <Link
              to="/partner"
              className="inline-flex items-center justify-center rounded-md border border-primary/40 bg-primary/5 px-2.5 sm:px-4 h-9 sm:h-10 text-[11px] sm:text-sm font-semibold text-primary hover:bg-primary/10 transition-smooth"
            >
              For Schools
            </Link>
          )}
          {!onAdmin && (
            <a
              href="#join"
              className="inline-flex items-center justify-center rounded-md bg-gradient-neon px-2.5 sm:px-4 h-9 sm:h-10 text-[11px] sm:text-sm font-semibold text-background shadow-glow hover:opacity-90 transition-smooth whitespace-nowrap"
            >
              Join Alpha
            </a>
          )}
          {!onAdmin && (
            <button
              className="lg:hidden p-2 text-foreground"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          )}
        </div>
      </div>

      {open && !onAdmin && (
        <div className="lg:hidden border-t border-border/60 bg-background/95 backdrop-blur-xl">
          <nav className="container mx-auto flex flex-col p-4 gap-1">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="px-3 py-3 rounded-md text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-smooth"
              >
                {n.label}
              </a>
            ))}
            <a
              href="#join"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex items-center justify-center rounded-md bg-gradient-neon px-4 h-11 text-sm font-semibold text-background"
            >
              Join Alpha Batch
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
