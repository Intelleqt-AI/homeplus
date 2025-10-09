import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, Calendar, Users, CheckCircle, ArrowRight } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      step: "01",
      icon: Home,
      title: "Set up your home profile",
      description: "Add your property details, systems, and appliances. We'll create a personalized maintenance schedule.",
      color: "primary"
    },
    {
      step: "02", 
      icon: Calendar,
      title: "Receive smart reminders",
      description: "Get notifications for upcoming maintenance, annual checks, and seasonal home care tasks.",
      color: "accent"
    },
    {
      step: "03",
      icon: Users,
      title: "Connect with top trades",
      description: "When work is needed, we instantly show you the 3 best local professionals for the job.",
      color: "primary"
    },
    {
      step: "04",
      icon: CheckCircle,
      title: "Track & maintain",
      description: "Log completed work, store warranties, and build your comprehensive home history.",
      color: "primary"
    }
  ];

  return (
    <section 
      id="how-it-works" 
      className="relative py-20 min-h-[80vh] bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url('/lovable-uploads/acf44c09-60bb-42e0-92c9-266e66dffe45.png')`
      }}
    >
      <div className="absolute inset-0 bg-black/20" />
      
      <div className="container relative z-10">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
            How{" "}
            <span className="text-yellow-400">
              Home+
            </span>{" "}
            works
          </h2>
          <p className="text-sm text-white/80">
            Add your home, set key dates, upload one document and let Home+ handle the reminders and trade matching.
          </p>
        </div>

      </div>
      <div className="absolute bottom-0 left-0 right-0 pb-8 z-10">
        <div className="container">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((step, index) => (
              <div 
                key={index} 
                className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-4 flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-yellow-400 text-black flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {step.step}
                </div>
                <h3 className="text-sm font-medium text-white text-left">{step.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;