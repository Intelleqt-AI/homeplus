import { Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-50 text-foreground py-16">
      <div className="container">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <img 
              src="/lovable-uploads/12a6b0ca-4f79-40fc-a635-9290ed19a8b5.png" 
              alt="Home+ Logo" 
              className="h-8 w-auto"
            />
            <p className="text-foreground leading-relaxed">
              Your digital home MOT logbook connected to the best local trades through Trade Pilot.
            </p>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-foreground" />
              <span className="text-sm text-foreground">Serving the UK</span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Platform</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-foreground hover:text-primary transition-colors">Features</a></li>
              <li><a href="#" className="text-foreground hover:text-primary transition-colors">How it works</a></li>
              <li><a href="#" className="text-foreground hover:text-primary transition-colors">Pricing</a></li>
              <li><a href="#" className="text-foreground hover:text-primary transition-colors">Mobile app</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Trade Pilot</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-foreground hover:text-primary transition-colors">For homeowners</a></li>
              <li><a href="#" className="text-foreground hover:text-primary transition-colors">For trades</a></li>
              <li><a href="#" className="text-foreground hover:text-primary transition-colors">Quality guarantee</a></li>
              <li><a href="/blog" className="text-foreground hover:text-primary transition-colors">Blog</a></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Support</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-foreground hover:text-primary transition-colors">Help center</a></li>
              <li><a href="#" className="text-foreground hover:text-primary transition-colors">Contact us</a></li>
              <li><a href="#" className="text-foreground hover:text-primary transition-colors">Privacy policy</a></li>
              <li><a href="#" className="text-foreground hover:text-primary transition-colors">Terms of service</a></li>
            </ul>
            <div className="space-y-2 pt-4">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-foreground" />
                <span className="text-sm text-foreground">hello@myhomeplus.io</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-foreground text-sm">
            © 2025 Home+. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-foreground hover:text-primary transition-colors text-sm">Privacy</a>
            <a href="#" className="text-foreground hover:text-primary transition-colors text-sm">Terms</a>
            <a href="#" className="text-foreground hover:text-primary transition-colors text-sm">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;