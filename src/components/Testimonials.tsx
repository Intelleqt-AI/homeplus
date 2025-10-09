import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Sarah Mitchell",
      role: "London Homeowner",
      rating: 5,
      text: "Home+ reminded me about my boiler service just in time. The engineer found a small issue that could have been catastrophic. Worth every penny of the free subscription!"
    },
    {
      name: "James Thompson", 
      role: "Manchester Property Owner",
      rating: 5,
      text: "I found three brilliant contractors through Home+ for my kitchen renovation. The quality was exceptional and the process couldn't have been smoother. Saved me hours of research."
    },
    {
      name: "Emma Williams",
      role: "Birmingham Homeowner",
      rating: 5,
      text: "The predictive maintenance feature is a game-changer. It caught our roof tiles loosening before the winter storms. Saved us thousands in damage and stress."
    },
    {
      name: "David Clarke",
      role: "Leeds Property Manager",
      rating: 5,
      text: "Managing multiple properties was a nightmare until Home+. Now I never miss a safety check, and my tenants love how quickly issues get resolved with trusted tradespeople."
    },
    {
      name: "Lisa Parker",
      role: "Bristol Homeowner",
      rating: 5,
      text: "The document storage is brilliant. All our warranties, certificates, and maintenance records in one place. When we sold our house, everything was ready instantly."
    },
    {
      name: "Mark Johnson",
      role: "Edinburgh Property Owner",
      rating: 5,
      text: "Home+ takes the stress out of property maintenance. Smart reminders, vetted contractors, and everything tracked automatically. It's like having a property manager for free."
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Loved by homeowners across the UK
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-muted/50 p-6 rounded-lg">
              <div className="flex items-center space-x-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <blockquote className="text-foreground leading-relaxed mb-4">
                "{testimonial.text}"
              </blockquote>
              <div>
                <div className="font-semibold text-foreground">{testimonial.name}</div>
                <div className="text-sm text-muted-foreground">{testimonial.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;