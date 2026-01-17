import React, { useEffect, useRef } from 'react';
import { Shield, TrendingUp, Users, Lock, Target, Award, BarChart3, CheckCircle } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Navbar from './Navbar';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

const AboutUsPage = () => {
  const heroRef = useRef(null);
  const missionRef = useRef(null);
  const featuresRef = useRef(null);
  const valuesRef = useRef(null);
  const teamRef = useRef(null);
  const statsRef = useRef(null);

  useEffect(() => {
    // Hero section animation
    gsap.fromTo(
      heroRef.current,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
      }
    );

    // Mission section animation
    gsap.fromTo(
      missionRef.current,
      { opacity: 0, x: -50 },
      {
        opacity: 1,
        x: 0,
        duration: 1,
        scrollTrigger: {
          trigger: missionRef.current,
          start: 'top 80%',
          end: 'top 50%',
          scrub: true,
        },
      }
    );

    // Features animation
    const features = featuresRef.current?.children;
    if (features) {
      gsap.fromTo(
        features,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.2,
          scrollTrigger: {
            trigger: featuresRef.current,
            start: 'top 70%',
            end: 'top 40%',
            scrub: true,
          },
        }
      );
    }

    // Values animation
    const values = valuesRef.current?.children;
    if (values) {
      gsap.fromTo(
        values,
        { opacity: 0, scale: 0.8 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          scrollTrigger: {
            trigger: valuesRef.current,
            start: 'top 70%',
            end: 'top 40%',
            scrub: true,
          },
        }
      );
    }

    // Team animation
    const team = teamRef.current?.children;
    if (team) {
      gsap.fromTo(
        team,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.2,
          scrollTrigger: {
            trigger: teamRef.current,
            start: 'top 70%',
            end: 'top 40%',
            scrub: true,
          },
        }
      );
    }

    // Stats counter animation
    const counters = statsRef.current?.querySelectorAll('.counter');
    if (counters) {
      counters.forEach(counter => {
        const target = +counter.getAttribute('data-target');
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;

        const timer = setInterval(() => {
          current += increment;
          if (current > target) {
            counter.textContent = target.toLocaleString() + (counter.getAttribute('data-suffix') || '');
            clearInterval(timer);
          } else {
            counter.textContent = Math.floor(current).toLocaleString() + (counter.getAttribute('data-suffix') || '');
          }
        }, 16);

        return () => clearInterval(timer);
      });
    }

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  const teamMembers = [
    {
      name: 'Rajesh Kumar',
      role: 'CEO & Founder',
      description: 'Former SEBI compliance officer with 15+ years in financial markets',
      image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400',
    },
    {
      name: 'Priya Sharma',
      role: 'CTO',
      description: 'Ex-Fintech lead at major banking institution, specializes in secure trading systems',
      image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400',
    },
    {
      name: 'Arjun Mehta',
      role: 'Head of Product',
      description: 'Product strategist with expertise in transparent financial ecosystems',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400',
    },
    {
      name: 'Neha Patel',
      role: 'Compliance Director',
      description: 'SEBI regulations expert ensuring platform compliance and security',
      image: 'https://images.unsplash.com/photo-1551836026-d5c2c2e57e6b?auto=format&fit=crop&w=400',
    },
  ];

  const values = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Transparency',
      description: 'Every trade is permanently recorded and cannot be altered',
    },
    {
      icon: <Lock className="w-8 h-8" />,
      title: 'Security',
      description: 'SEBI-verified advisors only. Your investments are protected',
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: 'Accuracy',
      description: 'Real performance metrics. No selective reporting',
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Trust',
      description: 'Building confidence through verified, accountable trading',
    },
  ];

  const features = [
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: 'SEBI-Verified Advisors',
      description: 'Only registered advisors with proven credentials can join our platform',
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: 'Immutable Trade Records',
      description: 'All trades are permanently locked with original entry prices',
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Real Performance Metrics',
      description: 'Transparent tracking of P&L, accuracy, and consistency',
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'One-Click Trade Execution',
      description: 'Seamless trading directly from advisor signals',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#003366] via-[#2d1b69] to-[#4c1d95]">
        <div className="absolute inset-0 bg-black/30" />
        <div className="container mx-auto px-4 pt-24 pb-20 relative">
          <div ref={heroRef} className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
              <Shield className="w-5 h-5 text-white" />
              <span className="text-white/90 font-medium">Trust. Verify. Trade.</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Welcome to <span className="text-emerald-400">VeriFi</span>
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Revolutionizing the trading ecosystem with complete transparency and accountability. 
              Where every trade tells the true story.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <button className="px-8 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition shadow-lg hover:shadow-xl">
                Explore Advisors
              </button>
              <button className="px-8 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div ref={statsRef} className="bg-gradient-to-br from-gray-800 to-gray-900 py-12 border-y border-gray-700">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-400 mb-2">
                <span className="counter" data-target="500">0</span>
                <span data-suffix="+" className="text-blue-400">+</span>
              </p>
              <p className="text-gray-300 font-medium">Verified Advisors</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-purple-400 mb-2">
                <span className="counter" data-target="25000">0</span>
                <span data-suffix="+" className="text-purple-400">+</span>
              </p>
              <p className="text-gray-300 font-medium">Active Investors</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-emerald-400 mb-2">
                <span className="counter" data-target="98">0</span>
                <span data-suffix="%" className="text-emerald-400">%</span>
              </p>
              <p className="text-gray-300 font-medium">Platform Accuracy</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-rose-400 mb-2">
                ₹<span className="counter" data-target="150">0</span>
                <span data-suffix="Cr+" className="text-rose-400">Cr+</span>
              </p>
              <p className="text-gray-300 font-medium">Total Trade Volume</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="container mx-auto px-4 py-16">
        <div ref={missionRef} className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">Our Mission</h2>
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-8 shadow-lg">
            <p className="text-lg text-gray-300 mb-6">
              In today's trading ecosystem, investors face a critical challenge: <span className="font-semibold text-blue-400">lack of transparency</span>. 
              Advisors can manipulate performance data, hide losing trades, and create false narratives of success.
            </p>
            <p className="text-lg text-gray-300">
              At VeriFi, we're building a <span className="font-semibold text-emerald-400">trust-first platform</span> where every trade is permanently recorded, 
              every advisor is SEBI-verified, and every performance metric tells the complete, unedited truth.
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-white mb-12 text-center">How VeriFi Works</h2>
        <div ref={featuresRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="p-3 bg-gradient-to-br from-blue-900/30 to-blue-800/30 rounded-lg border border-blue-700/30 inline-block mb-4">
                <div className="text-blue-400">{feature.icon}</div>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Values Section */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 py-16 border-y border-gray-700">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">Our Core Values</h2>
          <div ref={valuesRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="p-4 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl border border-gray-600 inline-block mb-4">
                  <div className="text-blue-400">{value.icon}</div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{value.title}</h3>
                <p className="text-gray-400">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>


      {/* CTA Section */}
      <div className="bg-gradient-to-r from-[#003366] to-[#4c1d95] py-16 border-t border-gray-700">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Join the Transparency Revolution
          </h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Whether you're an advisor building credibility or an investor seeking trustworthy guidance, 
            VeriFi provides the platform for transparent, accountable trading.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button className="px-8 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition shadow-lg hover:shadow-xl">
              Get Started as Investor
            </button>
            <button className="px-8 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition">
              Join as Advisor
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-950 text-white py-12 border-t border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-8 h-8 text-emerald-400" />
                <span className="text-2xl font-bold text-white">VeriFi</span>
              </div>
              <p className="text-gray-400">Transparent Advisor Trading Platform</p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-gray-400 mb-2">© 2024 VeriFi. All rights reserved.</p>
              <p className="text-gray-400">Compliant with SEBI Regulations</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUsPage;