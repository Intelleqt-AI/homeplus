import { Button } from "@/components/ui/button";
import { Home, Menu, User, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <img 
              src="/lovable-uploads/12a6b0ca-4f79-40fc-a635-9290ed19a8b5.png" 
              alt="Home+ Logo" 
              className="h-12 w-auto"
            />
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6">
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="hidden md:inline-flex" asChild>
            <Link to="/login">
              <User className="h-4 w-4 mr-2" />
              Sign in
            </Link>
          </Button>
          <Button variant="cta" size="sm" className="hidden sm:inline-flex" asChild>
            <Link to="/signup">Sign up free</Link>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur">
          <div className="container py-4 space-y-3">
            <div className="pt-2 space-y-2">
              <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <User className="h-4 w-4 mr-2" />
                  Sign in
                </Link>
              </Button>
              <Button variant="cta" size="sm" className="w-full sm:hidden" asChild>
                <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}>Sign up free</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;