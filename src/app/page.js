import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import HowItWorks from "@/components/home/HowItWorks";
import LawyerCarousel from "@/components/home/LawyerCarousel";
import SpecializationsSection from "@/components/home/SpecializationsSection";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <LawyerCarousel />
        <SpecializationsSection />
      </main>
      <Footer />
    </>
  );
}
