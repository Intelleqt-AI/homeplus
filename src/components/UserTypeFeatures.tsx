import { Home, Building, Users, Key, Check } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const userTypes = [
  {
    icon: Home,
    category: "FOR HOMEOWNERS",
    title: "Never miss maintenance again",
    features: [
      "Automatic annual reminders",
      "3 instant quotes every time", 
      "Digital document vault",
      "Property value tracking"
    ],
    bottomText: "Save £847/year on average"
  },
  {
    icon: Building,
    category: "FOR LANDLORDS",
    title: "Manage unlimited properties", 
    features: [
      "Compliance dashboard",
      "Multi-property calendar",
      "Tenant portal access", 
      "Bulk maintenance booking"
    ],
    bottomText: "Stay 100% compliant, always"
  },
  {
    icon: Users,
    category: "FOR ESTATE AGENTS",
    title: "Add value for every client",
    features: [
      "White-label accounts",
      "Reduce fall-throughs 23%",
      "Digital home packs",
      "Commission tracking"
    ],
    bottomText: "Partner with Home+"
  },
  {
    icon: Key,
    category: "FOR RENTERS",
    title: "Protect your deposit",
    features: [
      "Move-in photo evidence",
      "Maintenance tracking",
      "Dispute resolution pack",
      "Portable rental history"
    ],
    bottomText: "98% deposit success rate"
  }
];

const UserTypeFeatures = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Built for every property journey
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From first-time buyers to seasoned investors, Home+ adapts to your unique needs and goals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {userTypes.map((userType, index) => {
            const Icon = userType.icon;
            
            return (
              <Card key={index} className="border-0 shadow-strong bg-background p-6 h-full">
                <CardHeader className="pb-4 px-0">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-yellow-400 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-black" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground tracking-wide uppercase">
                          {userType.category}
                        </div>
                        <div className="w-12 h-0.5 bg-primary mt-1"></div>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {userType.title}
                    </h3>
                  </div>
                </CardHeader>
                
                <CardContent className="px-0 space-y-4">
                  <div className="space-y-2">
                    {userType.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <Check className="w-2.5 h-2.5 text-primary-foreground" />
                        </div>
                        <span className="text-sm text-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-4">
                    <p className="text-base font-semibold text-foreground">
                      {userType.bottomText}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default UserTypeFeatures;