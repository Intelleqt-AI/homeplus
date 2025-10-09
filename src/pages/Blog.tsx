import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Calendar, Clock, ArrowRight, Wrench, Home, Lightbulb, TrendingUp } from "lucide-react";

const Blog = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const categories = [
    { name: "All", count: 24, active: true },
    { name: "Home Maintenance", count: 8, icon: Wrench },
    { name: "Property Tips", count: 6, icon: Home },
    { name: "Energy Efficiency", count: 5, icon: Lightbulb },
    { name: "Market Insights", count: 5, icon: TrendingUp }
  ];

  const featuredPost = {
    id: "ultimate-home-maintenance-guide-2025",
    title: "The Ultimate Home Maintenance Guide for 2025",
    excerpt: "Discover the essential maintenance tasks every homeowner should know to keep their property in perfect condition year-round.",
    category: "Home Maintenance",
    readTime: "8 min read",
    publishDate: "Jan 10, 2025",
    image: "/lovable-uploads/f3867400-da62-456f-a6fb-5f11d7552fd6.png",
    featured: true
  };

  const blogPosts = [
    {
      id: "smart-home-energy-savings",
      title: "10 Smart Home Upgrades That Actually Save Money",
      excerpt: "Learn about intelligent home improvements that pay for themselves through energy savings and increased property value.",
      category: "Energy Efficiency",
      readTime: "6 min read",
      publishDate: "Jan 8, 2025",
      image: "/lovable-uploads/8e1ead36-d749-4904-ac6a-69e7230bc9b6.png"
    },
    {
      id: "finding-reliable-tradespeople",
      title: "How to Find Reliable Tradespeople in Your Area",
      excerpt: "A comprehensive guide to vetting, hiring, and working with trusted professionals for your home projects.",
      category: "Property Tips",
      readTime: "5 min read",
      publishDate: "Jan 5, 2025",
      image: "/lovable-uploads/acf44c09-60bb-42e0-92c9-266e66dffe45.png"
    },
    {
      id: "uk-property-market-trends-2025",
      title: "UK Property Market Trends to Watch in 2025",
      excerpt: "Expert insights into the property market outlook and what homeowners should know for the year ahead.",
      category: "Market Insights",
      readTime: "7 min read",
      publishDate: "Jan 3, 2025",
      image: "/lovable-uploads/84362d05-12d1-4db0-ac61-9e14844bc7b7.png"
    },
    {
      id: "winter-home-preparation-checklist",
      title: "Winter Home Preparation: Complete Checklist",
      excerpt: "Protect your home from winter weather with this comprehensive preparation guide and maintenance checklist.",
      category: "Home Maintenance",
      readTime: "4 min read",
      publishDate: "Dec 28, 2024",
      image: "/lovable-uploads/72453d6f-9ee3-42fa-80ef-8bb70632daeb.png"
    },
    {
      id: "diy-vs-professional-repairs",
      title: "DIY vs Professional: When to Call the Experts",
      excerpt: "Make informed decisions about which home repairs you can tackle yourself and when to hire professionals.",
      category: "Property Tips",
      readTime: "6 min read",
      publishDate: "Dec 25, 2024",
      image: "/lovable-uploads/a51e965d-7e33-4f70-9513-bd80182c9801.png"
    },
    {
      id: "increase-property-value-2025",
      title: "5 Proven Ways to Increase Your Property Value",
      excerpt: "Strategic improvements that deliver the highest return on investment for UK homeowners.",
      category: "Market Insights",
      readTime: "5 min read",
      publishDate: "Dec 22, 2024",
      image: "/lovable-uploads/93964642-fca7-4857-9526-0604452c8672.png"
    }
  ];

  const filteredPosts = blogPosts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden bg-gradient-to-br from-background to-secondary/50">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight text-foreground">
                Home+ Blog
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                Expert insights, practical tips, and the latest trends in home maintenance, property management, and smart living.
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 bg-background/80 backdrop-blur-sm border-border/50"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <Badge
                    key={category.name}
                    variant={category.active ? "default" : "secondary"}
                    className={`px-4 py-2 cursor-pointer transition-all hover:scale-105 ${
                      category.active ? "bg-primary text-primary-foreground" : "hover:bg-primary/10"
                    }`}
                  >
                    {IconComponent && <IconComponent className="h-3 w-3 mr-2" />}
                    {category.name} ({category.count})
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Article */}
      <section className="py-16 bg-background">
        <div className="container">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-semibold mb-8 text-foreground">Featured Article</h2>
            
            <Link to={`/blog/${featuredPost.id}`} className="group cursor-pointer">
              <div className="grid lg:grid-cols-2 gap-8 items-center bg-card rounded-2xl p-8 shadow-soft hover:shadow-medium transition-all duration-300 border border-border/50">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                      {featuredPost.category}
                    </Badge>
                    <div className="flex items-center text-sm text-muted-foreground gap-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {featuredPost.publishDate}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {featuredPost.readTime}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-3xl font-bold leading-tight text-foreground group-hover:text-primary transition-colors">
                      {featuredPost.title}
                    </h3>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      {featuredPost.excerpt}
                    </p>
                  </div>

                  <Button variant="outline" className="group">
                    Read Article
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>

                <div className="relative">
                  <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
                    <img
                      src={featuredPost.image}
                      alt={featuredPost.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="py-16 bg-secondary/30">
        <div className="container">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-semibold mb-8 text-foreground">Latest Articles</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.id}`}
                  className="group cursor-pointer"
                >
                  <article className="bg-card rounded-xl overflow-hidden shadow-soft hover:shadow-medium transition-all duration-300 border border-border/50 h-full">
                    <div className="aspect-[16/10] bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    
                    <div className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                          {post.category}
                        </Badge>
                        <div className="flex items-center text-xs text-muted-foreground gap-2">
                          <Clock className="h-3 w-3" />
                          {post.readTime}
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-semibold leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      
                      <p className="text-muted-foreground leading-relaxed line-clamp-3">
                        {post.excerpt}
                      </p>
                      
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center text-sm text-muted-foreground gap-1">
                          <Calendar className="h-3 w-3" />
                          {post.publishDate}
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>

            {/* Load More */}
            <div className="text-center mt-12">
              <Button variant="outline" size="lg">
                Load More Articles
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 bg-black">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-white">
                Stay Updated with Home+ Insights
              </h2>
              <p className="text-xl text-white/80">
                Get the latest home maintenance tips, property insights, and expert advice delivered straight to your inbox.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60 flex-1"
              />
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
                Subscribe
              </Button>
            </div>
            
            <p className="text-sm text-white/60">
              No spam, unsubscribe at any time. Read our privacy policy.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Blog;