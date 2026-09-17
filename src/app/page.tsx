import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import SurfaceDivider from "@/components/SurfaceDivider";
import HowItWorks from "@/components/HowItWorks";
import FreshDirt from "@/components/FreshDirt";
import BurrowPreview from "@/components/BurrowPreview";
import ProductSection from "@/components/ProductSection";
import OpenSource from "@/components/OpenSource";
import TokenStatus from "@/components/TokenStatus";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <SurfaceDivider />
        <HowItWorks />
        <FreshDirt />
        <BurrowPreview />
        <ProductSection />
        <OpenSource />
        <TokenStatus />
      </main>
      <Footer />
    </>
  );
}
