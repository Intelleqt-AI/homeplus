import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { isDemoMode, DEMO_CREDENTIALS } from "@/lib/mockData";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if demo mode is enabled
  const demoMode = isDemoMode();

  // Function to fill demo credentials
  const fillDemoCredentials = () => {
    setEmail(DEMO_CREDENTIALS.email);
    setPassword(DEMO_CREDENTIALS.password);
  };

  // Redirect if already logged in
  if (user) {
    navigate('/dashboard');
    return null;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-hero">
              <Home className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">Home+</span>
          </Link>
        </div>

        <Card className="shadow-strong">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>
              Sign in to your Home+ account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Demo Mode Banner */}
            {/* {demoMode && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="h-5 w-5 rounded-full bg-amber-400 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800">Demo Mode Active</p>
                    <p className="text-xs text-amber-700 mt-1">
                      Use demo credentials or any email/password to explore the app.
                    </p>
                    <button
                      type="button"
                      onClick={fillDemoCredentials}
                      className="mt-2 text-xs font-medium text-amber-900 bg-amber-200 hover:bg-amber-300 px-3 py-1.5 rounded-md transition-colors"
                    >
                      Fill Demo Credentials
                    </button>
                  </div>
                </div>
              </div>
            )} */}

            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={"you@example.com"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder={"Enter your password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-lg"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <div className="text-center text-sm text-foreground">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary hover:underline font-medium">
                Sign up for free
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;