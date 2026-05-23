import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    q: "What is Nova Nurox?",
    a: "Nova Nurox is an AI-first education platform that teaches students futuristic skills (AI & Coding). We merge traditional learning with modern AI tools.",
  },
  {
    q: "Who is the founder of Nova Nurox?",
    a: "Founded by Utkarsh Kushwaha — an 8th-grade student and developer — with a mission to make his peers tech-savvy.",
  },
  {
    q: "Is the 10-Day AI & Copilot Course paid?",
    a: "Yes, it's a premium intensive course. For the Alpha Batch (first 20 students), the special fee is ₹149, including expert guidance and certification.",
  },
  {
    q: "What will I learn in these 10 days?",
    a: "You'll learn AI basics, pro use of GitHub Copilot, prompt engineering, and how to build your own professional full-stack website using AI.",
  },
  {
    q: "Can a beginner join?",
    a: "Absolutely! Even with zero coding experience you can join. We start from the basics so every student can keep up.",
  },
  {
    q: "Do I need an expensive computer?",
    a: "Not at all! Any normal laptop/PC works — and you can even code from your smartphone! We use Replit which runs in the browser, so no heavy software needed.",
  },
  {
    q: "Will I get a certificate?",
    a: "Yes — after completing the course and submitting your final project, you'll receive an official Nova Nurox completion certificate.",
  },
];

export function FAQs() {
  return (
    <section id="faqs" className="py-20 md:py-28">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-xs uppercase tracking-[0.3em] text-primary">FAQs</span>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold">
            Frequently <span className="text-gradient-neon">Asked</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Everything you need to know before joining the Alpha Batch.
          </p>
        </div>

        <div className="max-w-3xl mx-auto mt-12">
          <Accordion type="single" collapsible className="space-y-3">
            {FAQS.map((f, i) => (
              <AccordionItem
                key={i}
                value={`q-${i}`}
                className="rounded-xl border border-border bg-gradient-card px-5 data-[state=open]:border-primary/40 transition-smooth"
              >
                <AccordionTrigger className="font-display text-base md:text-lg text-left hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
