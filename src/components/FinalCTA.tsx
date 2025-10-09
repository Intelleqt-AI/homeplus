import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const FinalCTA = () => {
  const features = [
    "No credit card required",
    "Free forever - no premium tiers", 
    "Your data never sold",
    "Cancel anytime"
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container">
        <div className="max-w-6xl mx-auto bg-black rounded-3xl p-8 md:p-12 lg:p-16 shadow-2xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
                Join 10,000+ UK homeowners already saving time and money
              </h2>
            </div>

            <div className="space-y-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                    <Check className="h-3 w-3 text-black" />
                  </div>
                  <span className="text-lg text-white">{feature}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Button 
              variant="outline" 
              size="lg" 
              className="bg-white text-black border-white hover:bg-white/90 font-semibold px-8"
            >
              Start your free Home+ account
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;