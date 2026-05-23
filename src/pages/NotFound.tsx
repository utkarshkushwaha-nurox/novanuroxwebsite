import { Link } from "react-router-dom";
import { Home, AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
      <div className="absolute -top-32 -left-32 h-72 w-72 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 h-72 w-72 rounded-full bg-primary/15 blur-3xl pointer-events-none" />

      <div className="relative text-center max-w-lg rounded-2xl bg-gradient-card border border-border p-8 md:p-12 shadow-card">
        <div className="mx-auto h-14 w-14 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
          <AlertTriangle size={26} />
        </div>
        <div className="mt-6 font-display text-7xl md:text-8xl font-bold text-gradient-neon leading-none">
          404
        </div>
        <h1 className="mt-4 font-display text-2xl md:text-3xl font-bold">
          Lost in the matrix
        </h1>
        <p className="mt-3 text-muted-foreground text-sm md:text-base">
          The page you&apos;re looking for doesn&apos;t exist, or you don&apos;t
          have permission to view it.
        </p>
        <Link
          to="/"
          className="mt-7 inline-flex items-center justify-center gap-2 rounded-md bg-gradient-neon px-6 h-11 text-sm font-bold text-background shadow-neon hover:opacity-95 transition-smooth"
        >
          <Home size={16} /> Go Back to Home
        </Link>
      </div>
    </div>
  );
}
