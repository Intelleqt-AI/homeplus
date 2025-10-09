import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Home, ArrowRight, Check, Shield, Users, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";

const SignUp = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    propertyType: "",
    agreeToTerms: false
  });
  
  const { signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already logged in
  if (user) {
    navigate('/dashboard');
    return null;
  }

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleSignUp = async () => {
    if (!formData.agreeToTerms) {
      toast({
        title: "Terms required",
        description: "Please agree to the terms and conditions to continue.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    const { error } = await signUp(
      formData.email, 
      formData.password,
      {
        full_name: `${formData.firstName} ${formData.lastName}`,
        property_type: formData.propertyType
      }
    );

    if (error) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    } else {
      toast({
        title: "Account created!",
        description: "Please check your email to confirm your account.",
      });
      navigate('/dashboard');
    }
  };

  const benefits = [
    { icon: Shield, text: "Free forever - no hidden costs" },
    { icon: Users, text: "Connect with top-rated local trades" },
    { icon: Star, text: "Preventive maintenance reminders" },
    { icon: Check, text: "Complete home history tracking" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-hero">
              <Home className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Home+</span>
          </Link>
          <div className="text-sm text-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Left Side - Benefits */}
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge variant="secondary" className="w-fit">
                Step {step} of 3
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight">
                Join thousands of homeowners managing their homes{" "}
                <span className="bg-gradient-hero bg-clip-text text-transparent">
                  smarter
                </span>
              </h1>
              <p className="text-xl text-foreground leading-relaxed">
                Get started with your digital home MOT logbook and never miss important maintenance again.
              </p>
            </div>

            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <benefit.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-foreground">{benefit.text}</span>
                </div>
              ))}
            </div>

            <div className="bg-muted/50 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 border-2 border-background"></div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500 border-2 border-background"></div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-red-500 border-2 border-background"></div>
                </div>
                <span className="font-medium">Join 10,000+ homeowners</span>
              </div>
              <p className="text-sm text-foreground">
                "Home+ saved me £2,000 by catching a roof issue early. The maintenance reminders are a lifesaver!"
              </p>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="ml-2 text-sm font-medium">4.9/5 rating</span>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="flex items-center justify-center">
            <Card className="w-full max-w-md shadow-strong">
              <CardHeader className="text-center space-y-2">
                <CardTitle className="text-2xl">
                  {step === 1 && "Create your account"}
                  {step === 2 && "Tell us about yourself"}
                  {step === 3 && "Almost there!"}
                </CardTitle>
                <CardDescription>
                  {step === 1 && "Start your home management journey"}
                  {step === 2 && "Help us personalize your experience"}
                  {step === 3 && "Confirm your details and get started"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {step === 1 && (
                  <>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Create a strong password"
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                        />
                        <p className="text-xs text-foreground">
                          Must be at least 8 characters with a mix of letters and numbers
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First name</Label>
                        <Input
                          id="firstName"
                          placeholder="John"
                          value={formData.firstName}
                          onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last name</Label>
                        <Input
                          id="lastName"
                          placeholder="Smith"
                          value={formData.lastName}
                          onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Property type</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {["House", "Flat", "Bungalow", "Other"].map((type) => (
                          <Button
                            key={type}
                            variant={formData.propertyType === type ? "default" : "outline"}
                            className="h-12"
                            onClick={() => setFormData({...formData, propertyType: type})}
                          >
                            {type}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6">
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      <h3 className="font-medium">Your details:</h3>
                      <div className="text-sm space-y-1">
                        <p><span className="font-medium">Name:</span> {formData.firstName} {formData.lastName}</p>
                        <p><span className="font-medium">Email:</span> {formData.email}</p>
                        <p><span className="font-medium">Property:</span> {formData.propertyType}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="terms"
                        checked={formData.agreeToTerms}
                        onCheckedChange={(checked) => 
                          setFormData({...formData, agreeToTerms: checked as boolean})
                        }
                      />
                      <label htmlFor="terms" className="text-sm text-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        I agree to the{" "}
                        <Link to="/terms" className="text-primary hover:underline">
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link to="/privacy" className="text-primary hover:underline">
                          Privacy Policy
                        </Link>
                      </label>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={step === 3 ? handleSignUp : handleNext}
                  className="w-full h-12 text-lg"
                  disabled={(step === 3 && !formData.agreeToTerms) || loading}
                >
                  {loading ? "Creating account..." : step === 3 ? "Complete Registration" : "Continue"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>

                {step > 1 && (
                  <Button 
                    variant="ghost" 
                    onClick={() => setStep(step - 1)}
                    className="w-full"
                  >
                    Back
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;