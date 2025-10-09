import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Features from "@/components/Features";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const FeaturesPage = () => {
  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="container text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight text-foreground">
              Everything your home needs
            </h1>
            <p className="text-xl text-foreground leading-relaxed max-w-3xl mx-auto">
              From predictive maintenance to trusted trades, Home+ keeps your property running smoothly with intelligent automation and local expertise.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg" className="text-lg" asChild>
              <Link to="/signup">Get started free</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <Features />
      
      <Footer />
    </div>
  );
};

export default FeaturesPage;