import { Mail, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background/60 backdrop-blur-sm">
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-gradient-neon flex items-center justify-center font-display font-bold text-background">
                N
              </div>
              <span className="font-display font-bold text-lg">
                NOVA <span className="text-gradient-neon">NUROX</span>
              </span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              India&apos;s most futuristic AI Masterclass. Turning students into creators — one
              line of code at a time.
            </p>
          </div>

          <div>
            <h4 className="font-display font-bold uppercase tracking-wider text-xs text-foreground">
              Explore
            </h4>
            <ul className="mt-4 space-y-2 text-sm">
              {[
                { l: "About", h: "#about" },
                { l: "Course", h: "#course" },
                { l: "FAQs", h: "#faqs" },
                { l: "Join the Alpha Batch", h: "#join" },
              ].map((i) => (
                <li key={i.h}>
                  <a
                    href={i.h}
                    className="text-muted-foreground hover:text-primary transition-smooth"
                  >
                    {i.l}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold uppercase tracking-wider text-xs text-foreground">
              Contact
            </h4>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a
                  href="tel:+919275403796"
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-smooth"
                >
                  <Phone size={14} className="text-primary" /> +91 9275403796
                </a>
              </li>
              <li>
                <a
                  href="mailto:nuroxindiaofficial@gmail.com"
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-smooth break-all"
                >
                  <Mail size={14} className="text-primary shrink-0" />{" "}
                  nuroxindiaofficial@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Nova Nurox. All rights reserved.</p>
          <p>
            Crafted with ⚡ by <span className="text-primary">Utkarsh Kushwaha</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
