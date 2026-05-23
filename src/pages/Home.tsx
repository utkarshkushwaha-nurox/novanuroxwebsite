import { Preloader } from "@/components/Preloader";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Ecosystem } from "@/components/Ecosystem";
import { Founders } from "@/components/Founders";
import { Course } from "@/components/Course";
import { WhyNurox } from "@/components/WhyNurox";
import { FAQs } from "@/components/FAQs";
import { Join } from "@/components/Join";
import { Footer } from "@/components/Footer";

export default function HomePage() {
  return (
    <>
      <Preloader />
      <Header />
      <main>
        <Hero />
        <About />
        <Ecosystem />
        <Founders />
        <Course />
        <WhyNurox />
        <FAQs />
        <Join />
      </main>
      <Footer />
    </>
  );
}
