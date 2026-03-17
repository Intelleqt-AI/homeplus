import { createClient } from "@/lib/supabase/server";
import {
  Home,
  FileText,
  CalendarDays,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const firstName =
    user?.user_metadata?.full_name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Hello, {firstName}</h1>
        <p className="mt-1 text-muted-foreground">
          Here&apos;s an overview of your home.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Home className="h-5 w-5 text-accent" />}
          label="Properties"
          value="0"
        />
        <StatCard
          icon={<FileText className="h-5 w-5 text-blue-500" />}
          label="Documents"
          value="0"
        />
        <StatCard
          icon={<CalendarDays className="h-5 w-5 text-green-500" />}
          label="Upcoming tasks"
          value="0"
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5 text-orange-500" />}
          label="Overdue"
          value="0"
        />
      </div>

      {/* CTA to onboarding */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Get started</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add your first property to unlock maintenance reminders, document
          storage, and compliance tracking.
        </p>
        <Link
          href="/dashboard/onboarding"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Add property
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}
