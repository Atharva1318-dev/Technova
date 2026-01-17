import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Button } from "@/components/ui/button"; // Corrected: Removed '/src'
import { Card, CardContent } from "@/components/ui/card"; // Corrected: Removed '/src'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"; // Corrected: Removed '/src'
import { BackgroundRippleEffect } from "../components/ui/background-ripple-effect"; // Verified path
import { GlowingEffect } from "../components/ui/glowing-effect"; // Verified path
import {
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Bot,
  Lock,
  Zap,
  Activity
} from "lucide-react";

// --- DATA: FEATURES ---
const features = [
  {
    title: "Blockchain Immutable Logs",
    description: "Every trade signal is recorded on the Solana blockchain. Advisors cannot delete or edit history when trades go wrong.",
    icon: <Lock className="w-6 h-6 text-blue-400" />,
  },
  {
    title: "AI Truth Engine",
    description: "Our AI validates entry prices against live market data instantly. No more 'fake entries' or retroactive calls.",
    icon: <Bot className="w-6 h-6 text-purple-400" />,
  },
  {
    title: "SEBI Verified Only",
    description: "We are an exclusive club. Only verified SEBI-registered advisors can publish signals on our platform.",
    icon: <ShieldCheck className="w-6 h-6 text-green-400" />,
  },
  {
    title: "Real-Time Trust Score",
    description: "Don't trust screenshots. Trust the math. We calculate advisor accuracy and risk in real-time.",
    icon: <TrendingUp className="w-6 h-6 text-pink-400" />,
  },
];

// --- DATA: HOW IT WORKS ---
const howItWorks = [
  {
    title: "Advisor Publishes Signal",
    description: "SEBI advisors post a Buy/Sell call. The system auto-locks the entry price using live API data.",
    icon: <Zap className="w-6 h-6" />,
  },
  {
    title: "AI & Smart Contract Verify",
    description: "Our AI analyzes market news for risk, and the Smart Contract records the trade hash on-chain.",
    icon: <Bot className="w-6 h-6" />,
  },
  {
    title: "Investor Executes",
    description: "Subscribers get a real-time alert and can execute the trade with one click via our mock broker.",
    icon: <Activity className="w-6 h-6" />,
  },
  {
    title: "P&L Tracked Forever",
    description: "Win or loss, the result is permanently logged. Trust Scores update automatically.",
    icon: <TrendingUp className="w-6 h-6" />,
  },
];

// --- DATA: FAQ ---
const faqs = [
  {
    question: "How do I know the trade history is real?",
    answer: "We use blockchain technology (Solana). Once a trade is published, a transaction hash is generated. This means the data is immutable—neither the advisor nor the platform admin can alter it.",
  },
  {
    question: "Is this platform for real money trading?",
    answer: "Currently, Technova operates as a high-fidelity simulation and advisory platform. You subscribe to real advisors, but the trade execution happens in a risk-free paper trading environment for validation.",
  },
  {
    question: "How does the AI Risk Analysis work?",
    answer: "Our AI agent scans real-time news and market sentiment the moment a trade is posted. It flags high-risk trades if they contradict major market news.",
  },
  {
    question: "Can anyone become an Advisor?",
    answer: "No. You must upload a valid SEBI Registration Certificate during onboarding. Our admin team verifies every document before granting publishing access.",
  },
];

export default function Home() {
  return (
    <div className="bg-neutral-950 text-white min-h-screen font-sans selection:bg-blue-500/30">

      {/* 2. HERO SECTION */}
      <section className="relative w-full py-32 md:py-40 lg:py-48 overflow-hidden flex flex-col items-center text-center">
        {/* <div className="absolute inset-0 z-0">
          <BackgroundRippleEffect rows={14} cols={30} interactive={true} />
        </div> */}
        {/* Ambient Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-900/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="container px-4 md:px-6 relative z-10 space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-400 backdrop-blur-xl">
            <span className="flex h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
            Live on Solana Devnet
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-balance max-w-5xl mx-auto bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40">
            Trust is no longer a promise. <br />
            It’s a <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">Smart Contract.</span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto max-w-[700px] text-neutral-400 text-lg md:text-xl leading-relaxed">
            The world's first verified trading ecosystem where SEBI-registered advisors are tracked by Blockchain and analyzed by AI. No deleted trades. No fake screenshots.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link to="/signup">
              <Button size="lg" className="h-14 px-8 rounded-full text-base font-semibold bg-white text-black hover:bg-neutral-200 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                Start Trading Now
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="h-14 px-8 rounded-full text-base border-white/10 bg-white/5 hover:bg-white/10 text-white backdrop-blur-sm">
                View Live Signals
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. FEATURES SECTION (Bento Grid with GlowingEffect) */}
      <section className="w-full py-20 bg-neutral-950">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Powerful Features for <span className="text-blue-400">Transparent</span> Growth
            </h2>
            <p className="text-neutral-400 max-w-2xl mx-auto">
              We replaced "Trust Me Bro" with Cryptography and Artificial Intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border border-white/10 rounded-3xl bg-neutral-900/50 backdrop-blur-sm overflow-hidden relative group"
              >
                {/* Aceternity Glowing Effect */}
                <GlowingEffect
                  blur={0}
                  borderWidth={2}
                  spread={80}
                  glow={true}
                  disabled={false}
                  proximity={64}
                  inactiveZone={0.01}
                />
                <CardContent className="pt-10 pb-8 px-6 text-center flex flex-col items-center z-10 relative h-full">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 mb-6 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-neutral-400 text-sm leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS SECTION */}
      <section className="w-full py-24 bg-neutral-950 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-900/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
              The Verification Flow
            </h2>
            <p className="text-neutral-400 text-lg">
              From Signal to Smart Contract in 4 simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((item, index) => (
              <div
                key={index}
                className="group relative p-8 rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-300 hover:-translate-y-2"
              >
                {/* Large Background Number */}
                <div className="absolute top-4 right-6 text-8xl font-bold text-white/[0.03] group-hover:text-white/[0.08] transition-colors duration-300 select-none z-0">
                  {index + 1}
                </div>

                <div className="relative z-10 flex flex-col items-start space-y-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center">
                    <div className="text-blue-400">
                      {item.icon}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-xl text-white mb-2">
                      {item.title}
                    </h3>
                    <p className="text-neutral-500 text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. FAQ SECTION */}
      <section className="w-full py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Frequently Asked Questions</h2>
            <p className="text-neutral-400">Transparency starts with answering your questions.</p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border border-white/10 rounded-2xl px-6 bg-white/[0.02] data-[state=open]:bg-white/[0.05] transition-colors duration-300"
                >
                  <AccordionTrigger className="text-left hover:no-underline py-6 font-semibold text-lg text-white">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-neutral-400 pb-6 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* 6. CTA SECTION (Ripple Effect) */}
      <section className="w-full py-20 px-4 md:px-6 mb-20">
        <div className="container mx-auto">
          <div className="relative rounded-[2.5rem] overflow-hidden border border-white/20 bg-neutral-950 shadow-2xl h-[500px] flex items-center justify-center">

            <div className="absolute inset-0 z-0">
              <BackgroundRippleEffect interactive={true} />
            </div>

            {/* Content Overlay */}
            <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6">
                Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">Upgrade</span> Your Trading?
              </h2>

              <p className="mx-auto max-w-[600px] text-neutral-400 text-xl mb-10">
                Join thousands of investors who stopped guessing and started following verified, data-backed advisors.
              </p>

              <Link to="/signup">
                <Button
                  size="lg"
                  className="h-16 px-10 rounded-full font-bold text-lg bg-white text-black hover:bg-gray-200 shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all hover:scale-105"
                >
                  Get Started Now <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      {/* <footer className="py-8 border-t border-white/10 text-center text-neutral-500 text-sm">
        <p>© 2026 Technova. All rights reserved. Built for Technova Hackathon.</p>
      </footer> */}
    </div>
  );
}