import PageBackdrop from "@/components/PageBackdrop";
import TokenBar from "@/components/TokenBar";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FlowTicker from "@/components/FlowTicker";
import StatsRow from "@/components/StatsRow";
import HowItWorks from "@/components/HowItWorks";
import TerminalSection from "@/components/TerminalSection";
import Epicenters from "@/components/Epicenters";
import OpenSource from "@/components/OpenSource";
import TokenStatus from "@/components/TokenStatus";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <PageBackdrop />
      <TokenBar />
      <Navbar />
      <main>
        <Hero />
        <FlowTicker />
        <StatsRow />
        <HowItWorks />
        <TerminalSection />
        <Epicenters />
        <OpenSource />
        <TokenStatus />
      </main>
      <Footer />
    </>
  );
}
