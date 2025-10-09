import Header from "@/components/Header";
import Hero from "@/components/Hero";
import DashboardPreview from "@/components/DashboardPreview";
import DetailedFeatures from "@/components/DetailedFeatures";
import Features from "@/components/Features";

import HowItWorks from "@/components/HowItWorks";
import UserTypeFeatures from "@/components/UserTypeFeatures";
import Testimonials from "@/components/Testimonials";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <DashboardPreview />
        <DetailedFeatures />
        
        <HowItWorks />
        <Testimonials />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
