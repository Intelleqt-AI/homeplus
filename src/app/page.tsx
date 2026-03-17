import Link from "next/link";
import { Home, Shield, FileText, Wrench, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Home className="h-6 w-6 text-accent" />
            <span className="text-xl font-bold">Home+</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-24 text-center">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Your home, sorted.
          <span className="block text-accent">For good.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          The digital home MOT logbook for UK homeowners. Track maintenance,
          store documents, manage warranties, and find trusted trades — all in
          one place.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:opacity-90"
          >
            Start free
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-card py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-bold">
            Everything your home needs
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<FileText className="h-8 w-8 text-accent" />}
              title="Document vault"
              description="Store and organise every certificate, warranty, and receipt in one secure place."
            />
            <FeatureCard
              icon={<Wrench className="h-8 w-8 text-accent" />}
              title="Maintenance calendar"
              description="Never miss a boiler service, gutter clean, or safety check again."
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8 text-accent" />}
              title="Compliance tracker"
              description="Stay on top of gas safety, EPC, EICR and every legal requirement."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Homeplus Ltd. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-6">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
