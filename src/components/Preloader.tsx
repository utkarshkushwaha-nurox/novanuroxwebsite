import { useEffect, useState } from "react";

export function Preloader() {
  const [done, setDone] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setDone(true), 1700);
    const t2 = setTimeout(() => setHidden(true), 2200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (hidden) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-background transition-opacity duration-500 ${
        done ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      aria-hidden={done}
    >
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="relative flex flex-col items-center gap-8">
        <div className="relative">
          <div className="absolute inset-0 rounded-full blur-2xl bg-primary/40 animate-pulse-neon" />
          <div className="relative h-20 w-20 rounded-full border-2 border-primary/30 border-t-primary animate-spin-slow" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-primary font-display font-bold text-xl">N</span>
          </div>
        </div>
        <div className="text-center">
          <div className="font-display text-2xl font-bold tracking-wider text-gradient-neon">
            NOVA NUROX
          </div>
          <div className="mt-1 text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Initializing AI Co-Pilot
          </div>
        </div>
        <div className="h-[2px] w-56 overflow-hidden rounded-full bg-secondary">
          <div className="h-full bg-gradient-neon animate-preloader" />
        </div>
      </div>
    </div>
  );
}
