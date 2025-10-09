import { AlertTriangle, Calendar, Users, TrendingUp } from "lucide-react";

const ProcessFlow = () => {
  const steps = [
    {
      number: "01",
      title: "The problem",
      heading: "Homes need constant care",
      description: "UK homes lose £3,400 yearly from emergency repairs. Missed maintenance. Lost documents.",
      icon: AlertTriangle,
      iconColor: "text-red-500",
      bgColor: "bg-red-50"
    },
    {
      number: "02", 
      title: "The moment",
      heading: "Everything scheduled automatically",
      description: "Never miss what matters. From boilers to bins.",
      icon: Calendar,
      iconColor: "text-blue-500",
      bgColor: "bg-blue-50"
    },
    {
      number: "03",
      title: "The magic", 
      heading: "3 quotes in 3 seconds", 
      description: "No calls. No searching. Just results.",
      icon: Users,
      iconColor: "text-green-500", 
      bgColor: "bg-green-50"
    },
    {
      number: "04",
      title: "The value",
      heading: "Add £5,000 to your sale price", 
      description: "Complete maintenance history. Every receipt saved.",
      icon: TrendingUp,
      iconColor: "text-purple-500",
      bgColor: "bg-purple-50"
    }
  ];

  return (
    <section className="py-20 bg-muted/10 overflow-hidden">
      <div className="container">
        <div className="relative max-w-7xl mx-auto">
          {/* Diagonal connecting path */}
          <div className="absolute inset-0 pointer-events-none">
            <svg 
              className="w-full h-full" 
              viewBox="0 0 1200 800" 
              fill="none"
              preserveAspectRatio="xMidYMid meet"
            >
              <path
                d="M200 150 Q400 100 600 200 Q800 300 1000 250 Q900 400 700 500 Q500 600 300 550"
                stroke="hsl(var(--primary))"
                strokeWidth="3"
                strokeDasharray="12 8"
                opacity="0.4"
                fill="none"
              />
            </svg>
          </div>

          {/* Steps in diagonal grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-24 gap-y-20 relative z-10">
            {steps.map((step, index) => (
              <div 
                key={index} 
                className={`w-full max-w-md mx-auto ${
                  index % 2 === 0 ? 'lg:justify-self-start' : 'lg:justify-self-end lg:mt-24'
                }`}
              >
                {/* Step Number and Title */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg">
                    <span className="text-black font-bold text-lg">
                      {step.number}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-yellow-400 tracking-widest">
                    {step.title}
                  </div>
                </div>

                {/* Text Content Above */}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-foreground mb-3 leading-tight">
                    {step.heading}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Small Floating Image */}
                <div className="relative mx-auto w-64 h-32 mt-8">
                  {index === 0 && (
                    <div className="bg-white rounded-xl shadow-strong border p-4 transform hover:scale-105 transition-transform duration-300">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span className="text-sm font-semibold text-red-800">Emergency Alert</span>
                        </div>
                        <div className="text-sm text-red-700">Boiler service overdue</div>
                        <div className="text-sm text-red-600 mt-1 font-medium">Emergency cost: £340</div>
                      </div>
                    </div>
                  )}

                  {index === 1 && (
                    <div className="bg-white rounded-xl shadow-strong border p-4 transform hover:scale-105 transition-transform duration-300">
                      <div className="space-y-3">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-semibold text-blue-800">Smart Reminder</span>
                          </div>
                          <div className="text-sm text-blue-700">Boiler Service Due in 7 days</div>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                          <div className="text-sm text-green-700 text-center font-medium">✓ Scheduled automatically</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {index === 2 && (
                    <div className="bg-white rounded-xl shadow-strong border p-4 transform hover:scale-105 transition-transform duration-300">
                      <div className="space-y-3">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="text-sm font-semibold text-green-800 mb-2">3 Quotes Ready</div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Smith Heating</span>
                              <span className="font-medium">£85</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Quick Boilers</span>
                              <span className="font-medium">£95</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {index === 3 && (
                    <div className="bg-white rounded-xl shadow-strong border p-4 transform hover:scale-105 transition-transform duration-300">
                      <div className="space-y-3">
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="h-4 w-4 text-purple-500" />
                            <span className="text-sm font-semibold text-purple-800">Property Value</span>
                          </div>
                          <div className="text-sm text-purple-700">Complete maintenance history</div>
                          <div className="text-sm text-purple-600 font-medium">+£6,500 sale value</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProcessFlow;