import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="pt-20 pb-20 bg-white relative overflow-hidden">
      {/* Yellow fade from right to left */}
      <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-primary/20 via-primary/10 to-transparent pointer-events-none"></div>
      <div className="container max-w-7xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-tight">
              <span className="whitespace-nowrap">Your home runs better</span> <br />
              with Home<span className="text-primary">+</span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl text-black leading-relaxed max-w-lg">
              Your complete home management system.
              Maintenance, trades, documents - all sorted. Forever free.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
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
            <div className="space-y-3 pt-4">
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
          
          {/* Right Content - Phone and Callouts */}
          <div className="relative flex justify-center lg:justify-end">
            {/* Phone Container */}
            <div className="relative flex items-start gap-8">
              {/* Main Phone */}
              <div className="relative z-10">
                <div className="w-[280px] h-[570px] bg-black rounded-[3rem] p-1 shadow-2xl">
                  <div className="w-full h-full bg-white rounded-[2.7rem] overflow-hidden relative">
                    <img 
                      src="/lovable-uploads/f3867400-da62-456f-a6fb-5f11d7552fd6.png" 
                      alt="Home+ Dashboard"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </div>
              
              {/* Image Blocks */}
              <div className="space-y-6 mt-12">
                <img 
                  src="/lovable-uploads/7e9b46cc-0333-4916-bee4-be61cbf7212e.png" 
                  alt="Property Value"
                  className="w-56 h-auto rounded-xl"
                />
                <img 
                  src="/lovable-uploads/10669364-e854-488a-8807-e7ad2b54837f.png" 
                  alt="Compliance & Documents"
                  className="w-56 h-auto rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;