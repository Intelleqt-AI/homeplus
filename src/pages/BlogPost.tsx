import { useParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, ArrowLeft, ArrowRight, Share2, Bookmark, CheckCircle, Star, User } from "lucide-react";

const BlogPost = () => {
  const { slug } = useParams();

  // Mock blog post data - in a real app, this would come from an API or CMS
  const blogPost = {
    id: slug || "ultimate-home-maintenance-guide-2025",
    title: "The Ultimate Home Maintenance Guide for 2025",
    excerpt: "Discover the essential maintenance tasks every homeowner should know to keep their property in perfect condition year-round.",
    content: `
      <p class="text-lg text-muted-foreground mb-8">Proper home maintenance isn't just about keeping your property looking good—it's about protecting your investment, ensuring safety, and avoiding costly emergency repairs. This comprehensive guide covers everything you need to know about maintaining your home throughout 2025.</p>

      <h2 class="text-2xl font-semibold text-foreground mb-4 mt-8">Why Regular Maintenance Matters</h2>
      <p class="mb-6">Regular home maintenance can save homeowners thousands of pounds annually by preventing major issues before they occur. According to recent studies, proactive maintenance can reduce repair costs by up to 70% compared to reactive repairs.</p>

      <div class="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-8">
        <h3 class="text-lg font-semibold text-foreground mb-3 flex items-center">
          <CheckCircle class="h-5 w-5 text-primary mr-2" />
          Quick Stats: Home Maintenance Benefits
        </h3>
        <ul class="space-y-2 text-muted-foreground">
          <li>• 70% reduction in emergency repair costs</li>
          <li>• 15-20% increase in property value</li>
          <li>• 30% improvement in energy efficiency</li>
          <li>• 85% fewer insurance claims</li>
        </ul>
      </div>

      <h2 class="text-2xl font-semibold text-foreground mb-4 mt-8">Seasonal Maintenance Calendar</h2>
      
      <h3 class="text-xl font-semibold text-foreground mb-3">Spring (March - May)</h3>
      <p class="mb-4">Spring is the perfect time to assess any winter damage and prepare your home for the warmer months ahead.</p>
      <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
        <li>Inspect roof for loose or damaged tiles</li>
        <li>Clean gutters and downspouts</li>
        <li>Service air conditioning systems</li>
        <li>Check exterior paintwork</li>
        <li>Test garden sprinkler systems</li>
      </ul>

      <h3 class="text-xl font-semibold text-foreground mb-3">Summer (June - August)</h3>
      <p class="mb-4">Summer maintenance focuses on keeping your home cool and preparing for potential weather extremes.</p>
      <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
        <li>Deep clean outdoor spaces and patios</li>
        <li>Inspect and clean outdoor lighting</li>
        <li>Check fence integrity and gates</li>
        <li>Maintain lawn and garden irrigation</li>
        <li>Service outdoor equipment</li>
      </ul>

      <h3 class="text-xl font-semibold text-foreground mb-3">Autumn (September - November)</h3>
      <p class="mb-4">Autumn preparation is crucial for winter readiness and energy efficiency.</p>
      <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
        <li>Clean and inspect heating systems</li>
        <li>Seal gaps around windows and doors</li>
        <li>Clear leaves from gutters</li>
        <li>Insulate exposed pipes</li>
        <li>Store outdoor furniture properly</li>
      </ul>

      <h3 class="text-xl font-semibold text-foreground mb-3">Winter (December - February)</h3>
      <p class="mb-4">Winter maintenance focuses on protection from cold weather and monitoring indoor systems.</p>
      <ul class="list-disc list-inside space-y-2 text-muted-foreground mb-6">
        <li>Monitor heating system performance</li>
        <li>Check for ice dam formation</li>
        <li>Maintain proper humidity levels</li>
        <li>Test smoke and carbon monoxide detectors</li>
        <li>Plan for spring maintenance projects</li>
      </ul>

      <h2 class="text-2xl font-semibold text-foreground mb-4 mt-8">Essential Tools Every Homeowner Needs</h2>
      <p class="mb-6">Having the right tools makes maintenance tasks easier and more effective. Here's our recommended toolkit for 2025:</p>
      
      <div class="grid md:grid-cols-2 gap-6 mb-8">
        <div class="bg-card border border-border rounded-lg p-4">
          <h4 class="font-semibold text-foreground mb-2">Basic Hand Tools</h4>
          <ul class="text-sm text-muted-foreground space-y-1">
            <li>• Adjustable wrench set</li>
            <li>• Screwdriver set (Phillips and flathead)</li>
            <li>• Hammer and nail set</li>
            <li>• Measuring tape</li>
            <li>• Level</li>
          </ul>
        </div>
        <div class="bg-card border border-border rounded-lg p-4">
          <h4 class="font-semibold text-foreground mb-2">Power Tools</h4>
          <ul class="text-sm text-muted-foreground space-y-1">
            <li>• Cordless drill/driver</li>
            <li>• Circular saw</li>
            <li>• Multi-tool</li>
            <li>• Pressure washer</li>
            <li>• Shop vacuum</li>
          </ul>
        </div>
      </div>

      <h2 class="text-2xl font-semibold text-foreground mb-4 mt-8">When to Call a Professional</h2>
      <p class="mb-6">While many maintenance tasks can be DIY projects, some require professional expertise for safety and compliance reasons:</p>
      
      <div class="bg-warning/5 border border-warning/20 rounded-lg p-6 mb-8">
        <h3 class="text-lg font-semibold text-foreground mb-3 flex items-center">
          <Star class="h-5 w-5 text-warning mr-2" />
          Always Hire Professionals For:
        </h3>
        <ul class="space-y-2 text-muted-foreground">
          <li>• Electrical work beyond basic fixture replacement</li>
          <li>• Gas appliance servicing and repairs</li>
          <li>• Major plumbing modifications</li>
          <li>• Structural modifications or repairs</li>
          <li>• Roof work above single-story height</li>
        </ul>
      </div>

      <h2 class="text-2xl font-semibold text-foreground mb-4 mt-8">Creating Your Maintenance Schedule</h2>
      <p class="mb-6">The key to successful home maintenance is consistency. Create a schedule that works for your lifestyle and stick to it. We recommend using Home+ to track your maintenance tasks and get reminded when they're due.</p>
      
      <p class="mb-6">Remember, regular maintenance is an investment in your home's future. The time and money you spend on preventive care today will save you significantly more in the long run while keeping your home safe, comfortable, and valuable.</p>
    `,
    category: "Home Maintenance",
    readTime: "8 min read",
    publishDate: "Jan 10, 2025",
    author: {
      name: "Sarah Chen",
      title: "Home Maintenance Expert",
      image: "/lovable-uploads/efb07637-d7f5-40ed-af83-770cfdb35caa.png"
    },
    image: "/lovable-uploads/f3867400-da62-456f-a6fb-5f11d7552fd6.png",
    tags: ["home maintenance", "property care", "diy", "homeowner tips"]
  };

  const relatedPosts = [
    {
      id: "smart-home-energy-savings",
      title: "10 Smart Home Upgrades That Actually Save Money",
      image: "/lovable-uploads/8e1ead36-d749-4904-ac6a-69e7230bc9b6.png",
      readTime: "6 min read"
    },
    {
      id: "finding-reliable-tradespeople",
      title: "How to Find Reliable Tradespeople in Your Area",
      image: "/lovable-uploads/acf44c09-60bb-42e0-92c9-266e66dffe45.png",
      readTime: "5 min read"
    },
    {
      id: "winter-home-preparation-checklist",
      title: "Winter Home Preparation: Complete Checklist",
      image: "/lovable-uploads/72453d6f-9ee3-42fa-80ef-8bb70632daeb.png",
      readTime: "4 min read"
    }
  ];

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Back to Blog */}
      <div className="bg-secondary/30 py-4">
        <div className="container">
          <Link
            to="/blog"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Link>
        </div>
      </div>

      {/* Article Header */}
      <article className="py-16">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            {/* Meta Info */}
            <div className="flex items-center gap-4 mb-6">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                {blogPost.category}
              </Badge>
              <div className="flex items-center text-sm text-muted-foreground gap-4">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {blogPost.publishDate}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {blogPost.readTime}
                </div>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight text-foreground mb-6">
              {blogPost.title}
            </h1>

            {/* Excerpt */}
            <p className="text-xl text-muted-foreground leading-relaxed mb-8">
              {blogPost.excerpt}
            </p>

            {/* Author & Actions */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 overflow-hidden">
                  <img
                    src={blogPost.author.image}
                    alt={blogPost.author.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="font-semibold text-foreground">{blogPost.author.name}</div>
                  <div className="text-sm text-muted-foreground">{blogPost.author.title}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline" size="sm">
                  <Bookmark className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator className="mb-8" />

            {/* Featured Image */}
            <div className="aspect-[16/9] rounded-xl overflow-hidden mb-12 bg-gradient-to-br from-primary/10 to-primary/5">
              <img
                src={blogPost.image}
                alt={blogPost.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Article Content */}
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: blogPost.content }}
            />

            {/* Tags */}
            <div className="mt-12 pt-8 border-t border-border">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-medium text-foreground">Tags:</span>
                <div className="flex flex-wrap gap-2">
                  {blogPost.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Share Section */}
            <div className="mt-8 p-6 bg-secondary/30 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Found this helpful?</h3>
                  <p className="text-sm text-muted-foreground">Share this article with others who might benefit</p>
                </div>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Article
                </Button>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Related Articles */}
      <section className="py-16 bg-secondary/30">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold text-foreground mb-8">Related Articles</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map((post) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.id}`}
                  className="group cursor-pointer"
                >
                  <article className="bg-card rounded-xl overflow-hidden shadow-soft hover:shadow-medium transition-all duration-300 border border-border/50">
                    <div className="aspect-[16/10] bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    
                    <div className="p-4 space-y-3">
                      <h3 className="font-semibold leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-xs text-muted-foreground gap-1">
                          <Clock className="h-3 w-3" />
                          {post.readTime}
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>

            <div className="text-center mt-8">
              <Button variant="outline" asChild>
                <Link to="/blog">
                  View All Articles
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 bg-black">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <h2 className="text-2xl font-bold text-white">
              Get More Expert Tips
            </h2>
            <p className="text-white/80">
              Subscribe to our newsletter for weekly home maintenance tips and property insights.
            </p>
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
              Subscribe Now
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BlogPost;