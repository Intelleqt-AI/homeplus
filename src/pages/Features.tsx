import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Calendar, FileText, Users, Home, CheckCircle, Clock, Shield, Star } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FinalCTA from "@/components/FinalCTA";

const Features = () => {
  const features = [
    {
      icon: Calendar,
      title: "Maintenance calendar",
      description: "Keep services on schedule with smart reminders for boiler, EICR, gas safety, alarms, gutter clean and more. Use UK-ready presets or set your own timings, then snooze or complete in a tap.",
      highlights: [
        "Automatic reminders for boiler service, EICR, gas safety, gutter clean, alarms, appliances",
        "UK-specific presets and suggested intervals (editable)",
        "One-tap snooze or mark as done",
        "Upcoming view (month) and history view",
        "Quick add from template (e.g., winter checklist)"
      ]
    },
    {
      icon: FileText,
      title: "Documents vault",
      description: "Store EPCs, warranties, certificates and receipts securely. Upload photos or PDFs, let Home+ auto-tag and set expiry dates, and share a document when you need to prove it.",
      highlights: [
        "Store EPC, warranties, certificates, building control, receipts, manuals (PDF/JPG)",
        "Drag-and-drop, auto-tag by document type (OCR light)",
        "Expiry date detection and reminder hooks",
        "Share or export a single document when needed (email/download)",
        "Private by default; you control sharing"
      ]
    },
    {
      icon: Users,
      title: "Trusted trades",
      description: "When a reminder is due, jump straight to quality local trades. We verify reviews against real invoices and we don't touch your payments.",
      highlights: [
        "Postcode-aware suggestions",
        "Quick filters (distance, rating)",
        "Invoice-verified reviews (no fake stars)",
        "Direct connection to Trade Pilot network"
      ]
    },
    {
      icon: Home,
      title: "Multi-property & sharing",
      description: "Manage one home or many. Share access with a co-owner or agent and export a simple compliance pack when needed.",
      highlights: [
        "Manage one home or many from a single dashboard",
        "Assign a co-owner or agent with view/edit permissions",
        "Export a landlord compliance pack (EICR, gas safety, EPC, service history)"
      ]
    }
  ];

  const comingSoonFeatures = [
    {
      icon: CheckCircle,
      title: "Projects & planning",
      description: "Simple kanban (ideas → quotes → in progress → done). Attach tasks and documents to rooms/projects."
    },
    {
      icon: Star,
      title: "Valuations & floor plans",
      description: "Quick links to Rightmove/Zoopla valuations. Upload floor plans and generate a simple home pack for buyers or insurers."
    }
  ];

  const faqItems = [
    {
      question: "Do you take payments or hold money?",
      answer: "No. You pay trades directly; we focus on matching and organisation."
    },
    {
      question: "How are reviews verified?",
      answer: "Reviews are tied to a dated invoice or job reference; fake reviews are rejected."
    },
    {
      question: "Is my data private?",
      answer: "Yes. Documents are private by default; sharing is opt-in and revocable."
    },
    {
      question: "Can I manage multiple homes?",
      answer: "Yes. Add properties and switch between them; sharing for co-owners/agents is included."
    },
    {
      question: "What reminders are included?",
      answer: "Boiler, EICR, gas safety, alarms, gutter, appliances, plus custom reminders."
    },
    {
      question: "What does Plus add?",
      answer: "More storage, multi-property tools, export packs, and project planning."
    }
  ];

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="container grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight text-foreground">
                Everything your home needs, in one place
              </h1>
              <p className="text-xl text-foreground leading-relaxed">
                Set a maintenance calendar, keep EPCs and certificates safe, and book trusted local trades when jobs are due all for free.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" size="lg" className="text-lg" asChild>
                <Link to="/signup">Join free</Link>
              </Button>
              <Button variant="outline" size="lg" className="text-lg">
                See how it works
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 pt-4">
              <Badge variant="secondary">calendar</Badge>
              <Badge variant="secondary">documents</Badge>
              <Badge variant="secondary">trusted trades</Badge>
              <Badge variant="secondary">multi-property</Badge>
            </div>
          </div>

          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-strong bg-gradient-to-br from-background via-background/90 to-primary/5 p-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Home+ Dashboard</h3>
                  <Badge variant="secondary">Preview</Badge>
                </div>
                <div className="space-y-4">
                  <div className="bg-card rounded-lg p-4 border">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Boiler Service Due</p>
                        <p className="text-xs text-muted-foreground">in 2 weeks</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-card rounded-lg p-4 border">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium">EPC Certificate</p>
                        <p className="text-xs text-muted-foreground">Valid until 2034</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-card rounded-lg p-4 border">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium">3 Local Trades</p>
                        <p className="text-xs text-muted-foreground">Available for boiler service</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Home+ Section */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              Why Home+
            </h2>
            <p className="text-xl text-foreground max-w-3xl mx-auto leading-relaxed">
              Missed boiler services, lost paperwork, and last-minute scrambles. Home+ keeps maintenance on track, stores your proofs, and gives you a direct line to reliable local trades when something needs doing.
            </p>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="py-20">
        <div className="container space-y-32">
          {features.map((feature, index) => (
            <div key={index} className={`grid lg:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''}`}>
              <div className={`space-y-6 ${index % 2 === 1 ? 'lg:col-start-2' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">{feature.title}</h2>
                </div>
                
                <p className="text-xl text-foreground leading-relaxed">
                  {feature.description}
                </p>
                
                <ul className="space-y-3">
                  {feature.highlights.map((highlight, i) => (
                    <li key={i} className="flex items-start gap-3 text-base text-foreground">
                      <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      {highlight}
                    </li>
                  ))}
                </ul>
                
                <div className="pt-4">
                  {feature.title === "Trusted trades" && (
                    <Button size="lg">Find a tradesperson</Button>
                  )}
                  {feature.title === "Multi-property & sharing" && (
                    <Button size="lg">Add a property</Button>
                  )}
                  {feature.title === "Maintenance calendar" && (
                    <Button size="lg" asChild>
                      <Link to="/signup">Start free</Link>
                    </Button>
                  )}
                  {feature.title === "Documents vault" && (
                    <Button size="lg" asChild>
                      <Link to="/signup">Upload documents</Link>
                    </Button>
                  )}
                </div>
              </div>
              
              <div className={`${index % 2 === 1 ? 'lg:col-start-1' : ''}`}>
                <div className="relative rounded-2xl overflow-hidden shadow-strong bg-gradient-to-br from-background via-background/90 to-primary/5 p-8">
                  <div className="bg-card rounded-lg border p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold capitalize">{feature.title.toLowerCase()}</h3>
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-3">
                      {feature.title === "Maintenance calendar" && (
                        <>
                          <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <div>
                              <p className="text-sm font-medium">Boiler Service</p>
                              <p className="text-xs text-muted-foreground">Due in 2 weeks</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <div>
                              <p className="text-sm font-medium">Gas Safety Check</p>
                              <p className="text-xs text-muted-foreground">Completed</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <div>
                              <p className="text-sm font-medium">EICR Inspection</p>
                              <p className="text-xs text-muted-foreground">Next month</p>
                            </div>
                          </div>
                        </>
                      )}
                      {feature.title === "Documents vault" && (
                        <>
                          <div className="flex items-center gap-3 p-3 border rounded-lg">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">EPC Certificate</p>
                              <p className="text-xs text-muted-foreground">Valid until 2034</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 border rounded-lg">
                            <FileText className="h-4 w-4 text-green-600" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">Gas Safety Certificate</p>
                              <p className="text-xs text-muted-foreground">Expires Dec 2024</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 border rounded-lg">
                            <FileText className="h-4 w-4 text-purple-600" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">Boiler Warranty</p>
                              <p className="text-xs text-muted-foreground">5 years remaining</p>
                            </div>
                          </div>
                        </>
                      )}
                      {feature.title === "Trusted trades" && (
                        <>
                          <div className="flex items-center gap-3 p-3 border rounded-lg">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold">JS</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">John's Heating Services</p>
                              <p className="text-xs text-muted-foreground">⭐ 4.9 • 2.1 miles away</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 border rounded-lg">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold">AB</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">A&B Plumbing</p>
                              <p className="text-xs text-muted-foreground">⭐ 4.8 • 1.8 miles away</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 border rounded-lg">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold">RH</span>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">Reliable Heat Ltd</p>
                              <p className="text-xs text-muted-foreground">⭐ 4.7 • 3.2 miles away</p>
                            </div>
                          </div>
                        </>
                      )}
                      {feature.title === "Multi-property & sharing" && (
                        <>
                          <div className="flex items-center gap-3 p-3 bg-primary/5 border rounded-lg">
                            <Home className="h-4 w-4 text-primary" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">Main Residence</p>
                              <p className="text-xs text-muted-foreground">123 Oak Street, London</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 border rounded-lg">
                            <Home className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">Rental Property</p>
                              <p className="text-xs text-muted-foreground">45 Elm Avenue, Manchester</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 border rounded-lg">
                            <Home className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">Holiday Home</p>
                              <p className="text-xs text-muted-foreground">12 Beach Road, Brighton</p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust & Privacy */}
      <section className="py-20 bg-black">
        <div className="container">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
              Trust & privacy
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center mx-auto">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">Invoice-verified reviews</h3>
              <p className="text-sm text-white/80">Reviews on Trade Pilot are tied to real jobs</p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center mx-auto">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">No escrow, no platform payments</h3>
              <p className="text-sm text-white/80">You pay trades directly; we focus on matching</p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center mx-auto">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white">Your documents are private</h3>
              <p className="text-sm text-white/80">Private by default; you control sharing</p>
            </div>
          </div>
        </div>
      </section>


      {/* FAQ */}
      <section className="py-20">
        <div className="container">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              Frequently asked questions
            </h2>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent>
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      <FinalCTA />
      <Footer />
    </div>
  );
};

export default Features;