import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DashboardPreview from "@/components/DashboardPreview";
import DetailedFeatures from "@/components/DetailedFeatures";
import HowItWorks from "@/components/HowItWorks";
import UserTypeFeatures from "@/components/UserTypeFeatures";
import Testimonials from "@/components/Testimonials";
import TradePilot from "@/components/TradePilot";
import FinalCTA from "@/components/FinalCTA";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { Link } from "react-router-dom";

const Home2 = () => {
  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section - Restructured layout matching reference */}
      <section className="pt-12 pb-20 bg-gray-50 relative overflow-hidden">
        <div className="container max-w-7xl mx-auto px-4">
          {/* Centered Hero Text */}
          <div className="text-center space-y-8 mb-28 md:mb-36 lg:mb-44">
            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-tight">
              <span className="whitespace-nowrap">Your home runs better</span> <br />
              with Home<span className="text-primary">+</span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl text-black leading-relaxed max-w-2xl mx-auto">
              Your complete home management system. Maintenance, trades, documents - all sorted. Forever free.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-primary hover:bg-primary/90 px-8 text-primary-foreground font-semibold" asChild>
                <Link to="/signup">
                  Sign up free
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-black text-gray-700 hover:bg-gray-50 px-8"
              >
                <Play className="h-4 w-4 mr-2" />
                See How It Works
              </Button>
            </div>
            
            {/* Bullet Points */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-black">No credit card required</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-black">Free forever</span>
              </div>
            </div>
          </div>

          {/* Yellow Block Section with phone centered and extending upward */}
          <div className="bg-primary rounded-3xl shadow-2xl relative overflow-visible min-h-[350px] pb-[40px]">
            {/* Phone positioned absolutely - centered horizontally, extending upward from center of yellow block */}
            <div className="absolute left-1/2 top-[-120px] transform -translate-x-1/2 z-20">
              <div className="w-[280px] h-[570px] bg-black rounded-[1.5rem] p-1 shadow-2xl">
                <div className="w-full h-full bg-white rounded-[1.2rem] overflow-hidden relative">
                  {/* iPhone Status Bar */}
                  <div className="absolute top-0 left-0 right-0 h-12 bg-white z-10 flex items-center justify-between px-6 pt-2">
                    <span className="text-black font-semibold text-sm">9:41</span>
                    <div className="flex items-center gap-1">
                      <div className="flex gap-1">
                        <div className="w-1 h-1 bg-black rounded-full"></div>
                        <div className="w-1 h-1 bg-black rounded-full"></div>
                        <div className="w-1 h-1 bg-black rounded-full"></div>
                        <div className="w-1 h-1 bg-black/30 rounded-full"></div>
                      </div>
                      <svg className="w-6 h-4 ml-1" fill="black" viewBox="0 0 24 24">
                        <path d="M2 17h20v2H2zm1.15-4.05L4 11l.85 1.95.66-.03c.54 0 .99.45.99.99s-.45.99-.99.99L4 13.9 3.15 11.95c-.13-.28-.05-.61.18-.82.23-.21.57-.27.82-.18z"/>
                      </svg>
                      <div className="w-6 h-3 border border-black rounded-sm ml-1">
                        <div className="w-4 h-full bg-black rounded-sm"></div>
                      </div>
                    </div>
                  </div>
                  <img 
                    src="/lovable-uploads/a5bfbbbe-43fa-4bae-b154-c673324488b1.png" 
                    alt="Home+ Dashboard Interface" 
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Content inside yellow block - Grid layout with phone spacer */}
            <div className="px-8 md:px-12 pt-16 pb-8">
              <div className="grid grid-cols-[1fr_280px_1fr] gap-8 items-center min-h-[280px]">
                {/* Left Content - Text content */}
                <div className="space-y-6">
                  <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-black">
                    Stop losing £3,400 yearly to home emergencies
                  </h2>
                  <p className="text-xl text-black/70 leading-relaxed">
                    Home+ prevents problems before they happen. When maintenance is due, 
                    we instantly match you with 3 verified local trades. No searching. No calling.
                    Everything tracked. Forever free.
                  </p>
                  
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="bg-black text-primary border-black hover:bg-black/90 font-semibold px-8"
                  >
                    Get Started
                  </Button>
                </div>

                {/* Middle - Phone spacer (empty div to account for phone width) */}
                <div></div>

                {/* Right Content - Features */}
                <div className="grid grid-cols-1 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                      <svg className="h-3 w-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-black">Save £847/year</p>
                      <p className="text-xs text-black/70">Prevent costly emergencies</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                      <svg className="h-3 w-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-black">3 quotes, 60 seconds</p>
                      <p className="text-xs text-black/70">Verified trades instantly ready</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                      <svg className="h-3 w-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-black">Never miss deadlines</p>
                      <p className="text-xs text-black/70">Automatic reminders set forever</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                      <svg className="h-3 w-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-black">Protect home value</p>
                      <p className="text-xs text-black/70">Complete digital service history</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rest of homepage content - from Index.tsx */}
      <main>
        <DashboardPreview />
        <DetailedFeatures />
        <HowItWorks />
        <UserTypeFeatures />
        <Testimonials />
        <TradePilot />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Home2;