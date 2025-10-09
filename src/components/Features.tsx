import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Bell, 
  Users, 
  FileText, 
  Wrench, 
  Shield,
  Smartphone,
  TrendingUp,
  MapPin
} from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Wrench,
      title: "Predictive maintenance",
      description: "We'll nudge you before things break, saving hundreds in emergency repairs.",
      color: "primary"
    },
    {
      icon: FileText,
      title: "All your docs in one place",
      description: "Upload or scan warranties, certificates, and plans. Find them instantly.",
      color: "primary"
    },
    {
      icon: TrendingUp,
      title: "Live property value",
      description: "Track your home's worth with real-time market data and improvement impact.",
      color: "primary"
    },
    {
      icon: Bell,
      title: "Smart reminders",
      description: "Never miss boiler services, insurance renewals, or safety checks again.",
      color: "primary"
    },
    {
      icon: Shield,
      title: "Instant Trade Alerts",
      description: "Receive responses from the best vetted local tradespeople within hours.",
      color: "primary"
    },
    {
      icon: MapPin,
      title: "Multiple properties",
      description: "Manage rental properties, holiday homes, or help elderly parents easily.",
      color: "primary"
    }
  ];

  return (
    <section id="features" className="py-20 bg-gradient-card">
      <div className="container">

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="border-0 shadow-soft hover:shadow-medium transition-all duration-300 h-full">
                <CardHeader>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center flex-shrink-0">
                      <Icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center">
          <Button variant="hero" size="lg">
            Explore all features
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Features;