import { Calendar, TrendingUp, FileText, Users, Camera, Building } from "lucide-react";
import { Button } from "@/components/ui/button";

const DetailedFeatures = () => {
  const features = [
    {
      icon: Calendar,
      title: "The smart home calendar",
      subtitle: "Never miss what matters",
      description: "Your maintenance, automated forever. Pre-loaded with everything UK homes need: annual boiler service, EICR checks, EPC renewals, gas safety certificates. Plus bins, insurance, and seasonal tasks.",
      points: [
        "Never miss legal requirements",
        "Prevent £3,400 yearly losses", 
        "Get reminded before things break"
      ]
    },
    {
      icon: TrendingUp,
      title: "Protect and grow your home value", 
      subtitle: "Watch your investment grow",
      description: "Track your property value and see how maintenance protects your biggest asset.",
      points: [
        "Property value tracking with local market data",
        "Maintenance history adds £5,000-7,000 to sale price",
        "Digital home pack exports in one click",
        "Complete service records for buyers and lenders"
      ]
    },
    {
      icon: FileText,
      title: "Smart, searchable document vault",
      subtitle: "Every document, one tap away",
      description: "Every certificate, warranty, and receipt in one secure place. Auto-categorized. Never lose important documents. Export everything when selling.",
      points: [
        "Legal certificates (Gas, EICR, EPC)",
        "Insurance documents", 
        "Service history",
        "Warranties and guarantees"
      ]
    },
    {
      icon: Users,
      title: "When a task is due, we bring the pros to you",
      subtitle: "3 trusted pros, 3 quotes, 3 seconds",
      description: "When any task is due, we automatically find 3 local, verified trades. Compare quotes side-by-side. Book in seconds. No phone calls needed.",
      points: [
        "Task becomes due",
        "We match 3 trades instantly",
        "You compare and choose", 
        "Everything documented"
      ]
    }
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container">
        <div className="max-w-7xl mx-auto">
          <div className="grid gap-24 lg:gap-32">
            {features.map((feature, index) => (
              <div key={index} className={`grid lg:grid-cols-2 gap-8 lg:gap-12 items-center ${index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''}`}>
                <div className={`space-y-6 ${index % 2 === 1 ? 'lg:col-start-2' : ''}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-yellow-400 flex items-center justify-center">
                      <feature.icon className="h-6 w-6 text-black" />
                    </div>
                    <div className="text-sm font-medium text-foreground tracking-wide">
                      {feature.subtitle}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-4">
                      {feature.title}
                    </h3>
                    {feature.description && (
                      <p className="text-foreground mb-6 leading-relaxed">
                        {feature.description}
                      </p>
                    )}
                  </div>

                  {feature.points.length > 0 && (
                    <div className="space-y-3">
                      {feature.points.map((point, pointIndex) => (
                        <div key={pointIndex} className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                          <span className="text-muted-foreground leading-relaxed">{point}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={`${index % 2 === 1 ? 'lg:col-start-1' : ''}`}>
                  {index === 0 ? (
                    <div className="relative">
                      {/* Main calendar image */}
                      <div className="relative rounded-2xl overflow-hidden shadow-strong">
                        <img 
                          src="/lovable-uploads/bdc13c15-fd4d-45b9-8f6e-7a4b8ce3caa7.png" 
                          alt="Smart home calendar showing maintenance schedule"
                          className="w-full h-auto object-cover"
                        />
                      </div>
                      
                      {/* iPhone overlay - positioned on the right */}
                      <div className="absolute -bottom-8 -right-8 w-32 sm:w-36">
                        {/* iPhone Frame */}
                        <div className="relative w-full aspect-[9/19.5] bg-black rounded-[1.2rem] p-0.5 shadow-2xl">
                          <div className="w-full h-full bg-white rounded-[1rem] relative overflow-hidden">
                            {/* iPhone Notch */}
                            <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-16 h-4 bg-black rounded-full z-10"></div>
                            
                            {/* Calendar App Image */}
                            <img 
                              src="/lovable-uploads/2a63de38-deca-4e50-9304-058bafa06c82.png" 
                              alt="Home+ Calendar App Interface"
                              className="w-full h-full object-contain p-1"
                            />
                            
                            {/* Home Indicator */}
                            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-black rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : index === 1 ? (
                    <div className="relative">
                      {/* Main insights dashboard */}
                      <div className="relative rounded-2xl overflow-hidden shadow-strong">
                        <img 
                          src="/lovable-uploads/efb07637-d7f5-40ed-af83-770cfdb35caa.png" 
                          alt="Home insights dashboard showing property value and maintenance tracking"
                          className="w-full h-auto object-cover"
                        />
                      </div>
                      
                      {/* iPhone overlay - positioned on the left */}
                      <div className="absolute -bottom-8 -left-8 w-32 sm:w-36">
                        {/* iPhone Frame */}
                        <div className="relative w-full aspect-[9/19.5] bg-black rounded-[1.2rem] p-0.5 shadow-2xl">
                          <div className="w-full h-full bg-white rounded-[1rem] relative overflow-hidden">
                            {/* iPhone Notch */}
                            <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-16 h-4 bg-black rounded-full z-10"></div>
                            
                            {/* Home Dashboard App Image */}
                            <img 
                              src="/lovable-uploads/34cddaf0-285a-45f5-887c-03e40cfe2940.png" 
                              alt="Home+ Dashboard Interface"
                              className="w-full h-full object-contain p-1"
                            />
                            
                            {/* Home Indicator */}
                            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-black rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : index === 2 ? (
                    <div className="relative">
                      {/* Main documents table */}
                      <div className="relative rounded-2xl overflow-hidden shadow-strong">
                        <img 
                          src="/lovable-uploads/a51e965d-7e33-4f70-9513-bd80182c9801.png" 
                          alt="Smart document vault with searchable home documents"
                          className="w-full h-auto object-cover"
                        />
                      </div>
                      
                      {/* iPhone overlay - positioned on the right */}
                      <div className="absolute -bottom-8 -right-8 w-32 sm:w-36">
                        {/* iPhone Frame */}
                        <div className="relative w-full aspect-[9/19.5] bg-black rounded-[1.2rem] p-0.5 shadow-2xl">
                          <div className="w-full h-full bg-white rounded-[1rem] relative overflow-hidden">
                            {/* iPhone Notch */}
                            <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-16 h-4 bg-black rounded-full z-10"></div>
                            
                            {/* Documents App Image */}
                            <img 
                              src="/lovable-uploads/2c8aa9fb-719f-4e1a-af8a-cc734ee9f73a.png" 
                              alt="Home+ Documents Interface"
                              className="w-full h-full object-contain p-1"
                            />
                            
                            {/* Home Indicator */}
                            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-black rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : index === 3 ? (
                    <div className="relative">
                      {/* Main job leads interface */}
                      <div className="relative rounded-2xl overflow-hidden shadow-strong">
                        <img 
                          src="/lovable-uploads/86788b6f-037f-4bdc-a8c4-50a51eb5b572.png" 
                          alt="Job leads showing trusted trades with quotes and ratings"
                          className="w-full h-auto object-cover"
                        />
                      </div>
                      
                      {/* iPhone overlay - positioned on the left */}
                      <div className="absolute -bottom-8 -left-8 w-32 sm:w-36">
                        {/* iPhone Frame */}
                        <div className="relative w-full aspect-[9/19.5] bg-black rounded-[1.2rem] p-0.5 shadow-2xl">
                          <div className="w-full h-full bg-white rounded-[1rem] relative overflow-hidden">
                            {/* iPhone Notch */}
                            <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-16 h-4 bg-black rounded-full z-10"></div>
                            
                            {/* Get Quotes App Image */}
                            <img 
                              src="/lovable-uploads/2166f6d3-62a1-4118-95dc-612c7b96e796.png" 
                              alt="Home+ Get Quotes Interface"
                              className="w-full h-full object-contain p-1"
                            />
                            
                            {/* Home Indicator */}
                            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-black rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative rounded-2xl overflow-hidden shadow-xl border border-border/50 bg-background p-8">
                      <div className="aspect-[4/3] bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl flex items-center justify-center">
                        <feature.icon className="h-16 w-16 text-primary/30" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent pointer-events-none" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-16">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Sign up free
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DetailedFeatures;