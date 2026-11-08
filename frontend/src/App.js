import React from "react";
import "@/App.css";

// Initialize Firebase SDK (Auth/Firestore/Functions clients).
// SDK is initialized but Auth UI is not exposed yet — see /src/lib/firebase.js.
import "@/lib/firebase";

import Navbar from "@/components/sections/Navbar";
import Hero from "@/components/sections/Hero";
import HeritageStrip from "@/components/sections/HeritageStrip";
import OriginStory from "@/components/sections/OriginStory";
import HowWeWork from "@/components/sections/HowWeWork";
import RobotShowcase from "@/components/sections/RobotShowcase";
import DocumentMarquee from "@/components/sections/DocumentMarquee";
import InteractiveDemo from "@/components/sections/InteractiveDemo";
import UseCases from "@/components/sections/UseCases";
import HowWeStart from "@/components/sections/HowWeStart";
import FAQ from "@/components/sections/FAQ";
import Contact from "@/components/sections/Contact";
import Footer from "@/components/sections/Footer";

function App() {
  return (
    <div className="App min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Navbar />
      <main>
        <Hero />
        <HeritageStrip />
        <OriginStory />
        <HowWeWork />
        <RobotShowcase />
        <DocumentMarquee />
        <InteractiveDemo />
        <UseCases />
        <HowWeStart />
        <FAQ />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

export default App;
