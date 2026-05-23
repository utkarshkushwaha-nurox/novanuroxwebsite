import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

const founderSchema = `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Nova Nurox",
  "url": "https://www.novanurox.in",
  "logo": "https://www.novanurox.in/logo.png",
  "description": "Nova Nurox: Pioneering the Era of Pure AI Orchestration. Nova Nurox is a futuristic EdTech startup founded and led by Utkarsh Kushwaha, who has completed the Google Gemini AI Program and is Winner of the 7 Day Technical Fix-a-Thon, dedicated to transforming how the modern workforce interacts with artificial intelligence. Operating at the intersection of human creativity and automated intelligence, Nova Nurox specializes in Pure AI Orchestration, a proprietary methodology that shifts the focus from manual coding to high-level digital direction. The organization's flagship program, the 10-Day AI Co-Pilot Challenge, is specifically engineered for the Alpha Batch of 2026, offering a comprehensive deep-dive into strategic prompt engineering, multi-tool synchronization, and no-code frameworks for a disruptive entry price of ₹149. As a visionary founder, Utkarsh Kushwaha has designed the curriculum to empower non-technical creators, students, and entrepreneurs to act as Directors over their own AI production teams, effectively manifesting complex digital products through the language of command rather than traditional syntax. By bridging the gap between advanced AI capabilities and practical user application, Nova Nurox is establishing a new standard for functional AI literacy. Under Utkarsh Kushwaha's leadership, the startup is rapidly becoming a central hub for those seeking to master the essential skills of the AI-driven economy, proving that the most valuable asset in the modern tech landscape is not the ability to write code, but the expertise required to orchestrate the intelligence that does.",
  "founder": {
    "@type": "Person",
    "name": "Utkarsh Kushwaha",
    "jobTitle": "Founder & CEO",
    "description": "Utkarsh Kushwaha is a visionary tech entrepreneur and the founder of Nova Nurox, pioneering the shift from manual coding to Pure AI Orchestration.",
    "sameAs": ["PASTE_YOUR_LINKEDIN_URL_HERE"]
  },
  "offers": {
    "@type": "Offer",
    "name": "Alpha Batch 10-Day AI Challenge",
    "price": "149",
    "priceCurrency": "INR"
  }
}
</script>`;

function injectFounderSchema(): Plugin {
  return {
    name: "inject-founder-schema",
    transformIndexHtml(html) {
      return html.replace("</head>", `${founderSchema}\n</head>`);
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths(), injectFounderSchema()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "::",
    port: 8080,
  },
});
