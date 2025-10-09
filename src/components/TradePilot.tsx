import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Users, Clock, Shield, ArrowRight } from "lucide-react";

const TradePilot = () => {
  return (
    <section id="trades" className="py-20 bg-black">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge variant="outline" className="w-fit border-white text-white">
                Trade Pilot connected
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
                Meet{" "}
                <span className="bg-gradient-accent bg-clip-text text-transparent">
                  Trade Pilot
                </span>
              </h2>
              <p className="text-xl text-white leading-relaxed">
                When your Home+ system identifies maintenance needs, Trade Pilot 
                instantly connects you with the top 3 local professionals for the job.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-accent" />
                <span className="font-semibold text-white">4.9/5 Rating</span>
              </div>
              <p className="text-sm text-white">Verified customer reviews</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="font-semibold text-white">10k+ Trades</span>
              </div>
              <p className="text-sm text-white">Vetted professionals</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-success" />
                <span className="font-semibold text-white">24h Response</span>
              </div>
              <p className="text-sm text-white">Average quote time</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span className="font-semibold text-white">Insured</span>
              </div>
              <p className="text-sm text-white">All work guaranteed</p>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <Button variant="accent" size="lg">
            Learn about Trade Pilot
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default TradePilot;