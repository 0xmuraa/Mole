import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Tremors from "@/components/Tremors";
import Epicenters from "@/components/Epicenters";
import SeismicTerminal from "@/components/SeismicTerminal";
import OpenSource from "@/components/OpenSource";
import TokenStatus from "@/components/TokenStatus";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Tremors />
        <Epicenters />
        <SeismicTerminal />
        <OpenSource />
        <TokenStatus />
      </main>
      <Footer />
    </>
  );
}
