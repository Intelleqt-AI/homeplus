import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMotTemplates,
  getMotTasks,
  enableMotTemplate,
  disableMotTemplate,
} from "@/lib/Api2";
import {
  User,
  Bell,
  Shield,
  CreditCard,
  Building,
  Calendar,
  CheckCircle,
  Settings as SettingsIcon,
  Clock,
  Plus,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import SetupWizard from "@/components/SetupWizard";
import Profile from "@/components/settings/profile";
import Security from "@/components/settings/security";
import Notifications from "@/components/settings/Notifications";
import Properties from "@/components/settings/Properties";

const CATEGORY_CONFIG: Record<string, {
  label: string;
  icon: React.ElementType;
  headerColor: string;
  cardBg: string;
  cardBorder: string;
  badge: string;
  badgeVariant: 'destructive' | 'secondary' | 'outline';
  desc: string;
}> = {
  Safety: {
    label: 'UK Compliance (Required)',
    icon: Shield,
    headerColor: 'text-red-600',
    cardBg: 'bg-red-50',
    cardBorder: 'border-red-200',
    badge: 'Mandatory',
    badgeVariant: 'destructive',
    desc: "These are pre-loaded and can't be deleted, only customised",
  },
  Maintenance: {
    label: 'Recommended Maintenance',
    icon: SettingsIcon,
    headerColor: 'text-orange-600',
    cardBg: 'bg-orange-50',
    cardBorder: 'border-orange-200',
    badge: 'Customisable',
    badgeVariant: 'secondary',
    desc: 'Pre-populated but fully customisable templates',
  },
  Financial: {
    label: 'Financial Reminders',
    icon: CreditCard,
    headerColor: 'text-blue-600',
    cardBg: 'bg-blue-50',
    cardBorder: 'border-blue-200',
    badge: 'Optional',
    badgeVariant: 'outline',
    desc: 'Track key financial dates and renewal deadlines',
  },
  Household: {
    label: 'Household Management',
    icon: Building,
    headerColor: 'text-green-600',
    cardBg: 'bg-green-50',
    cardBorder: 'border-green-200',
    badge: 'Optional',
    badgeVariant: 'outline',
    desc: 'Day-to-day household task reminders',
  },
};

const CATEGORY_ORDER = ['Safety', 'Maintenance', 'Financial', 'Household'];

const freqLabel = (months: number | null) => {
  if (!months) return 'One-off';
  if (months === 1) return 'Monthly';
  if (months === 3) return 'Quarterly';
  if (months === 12) return 'Annual';
  if (months === 120) return 'Every 10 years';
  return `Every ${months} months`;
};

const Settings = () => {
  const tabs = [
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
    { id: "security" as const, label: "Security", icon: Shield },
    { id: "properties" as const, label: "Properties", icon: Building },
    { id: "tasks" as const, label: "Task Templates", icon: Calendar },
  ];

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as typeof tabs[number]['id']) || 'profile';
  const setActiveTab = (id: typeof tabs[number]['id']) => setSearchParams({ tab: id }, { replace: true });
  const [isSetupWizardOpen, setIsSetupWizardOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['motTemplates'],
    queryFn: getMotTemplates,
    enabled: activeTab === 'tasks',
  });

  const { data: activeTasks = [] } = useQuery({
    queryKey: ['motTasks'],
    queryFn: getMotTasks,
    enabled: activeTab === 'tasks',
  });

  const activeTaskSlugs = new Set(
    (activeTasks as any[]).map((t: any) => t.templateId ?? t.template_id ?? t.id)
  );

  const enableMut = useMutation({
    mutationFn: (slug: string) =>
      enableMotTemplate(slug, new Date().toISOString().split('T')[0]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['motTasks'] });
      queryClient.invalidateQueries({ queryKey: ['event'] });
    },
  });

  const disableMut = useMutation({
    mutationFn: (slug: string) => disableMotTemplate(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['motTasks'] });
      queryClient.invalidateQueries({ queryKey: ['event'] });
    },
  });

  const handleSetupComplete = () => {
    setIsSetupWizardOpen(false);
  };

  const renderTaskTemplates = () => {
    if (templatesLoading) {
      return (
        <div className="py-12 text-center text-[#6B6B6B]">
          <Clock className="w-6 h-6 mx-auto mb-2 animate-spin" />
          <p className="text-sm">Loading templates…</p>
        </div>
      );
    }

    const grouped: Record<string, any[]> = {};
    for (const t of (templates as any[])) {
      const cat = (t.category as string) ?? 'Household';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(t);
    }

    return (
      <div className="space-y-6">
        {CATEGORY_ORDER.filter(cat => (grouped[cat] ?? []).length > 0).map(cat => {
          const cfg = CATEGORY_CONFIG[cat];
          const IconComp = cfg.icon;
          const isSafety = cat === 'Safety';
          return (
            <Card key={cat}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <IconComp className={`w-5 h-5 ${cfg.headerColor}`} />
                    {cfg.label}
                  </CardTitle>
                  <Badge variant={cfg.badgeVariant}>{cfg.badge}</Badge>
                </div>
                <p className="text-sm text-gray-600">{cfg.desc}</p>
              </CardHeader>
              <CardContent className="space-y-2">
                {(grouped[cat] ?? []).map((tmpl: any) => {
                  const slug = tmpl.id ?? tmpl.slug;
                  const isEnabled = activeTaskSlugs.has(slug);
                  return (
                    <div
                      key={slug}
                      className={`flex items-center justify-between p-3 rounded-lg border ${cfg.cardBg} ${cfg.cardBorder}`}
                    >
                      <div className="flex items-center gap-3">
                        {isSafety ? (
                          <CheckCircle className={`w-4 h-4 ${cfg.headerColor}`} />
                        ) : (
                          <Switch
                            checked={isEnabled}
                            disabled={enableMut.isPending || disableMut.isPending}
                            onCheckedChange={() => {
                              if (isEnabled) disableMut.mutate(slug);
                              else enableMut.mutate(slug);
                            }}
                          />
                        )}
                        <div>
                          <p className="font-medium text-sm">{tmpl.label}</p>
                          <p className="text-xs text-gray-600">
                            {freqLabel(tmpl.frequencyMonths)}
                            {tmpl.hint ? ` · ${tmpl.hint}` : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}

        <Separator />

        <div className="flex justify-end">
          <Button
            onClick={() => setIsSetupWizardOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Run Setup Wizard
          </Button>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-[20px] p-4 md:p-6 border border-[#E8E8E3]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-[#F5F5F0] rounded-full flex items-center justify-center">
                <SettingsIcon className="w-5 h-5 text-[#1A1A1A]" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[#6B6B6B] text-sm mb-0.5">Manage your account</p>
                <h1 className="text-[#1A1A1A] text-2xl font-semibold">Settings</h1>
              </div>
            </div>
          </div>

          {/* Tab strip */}
          <div className="grid grid-cols-5 gap-4">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-[16px] px-5 py-4 text-left transition-all ${
                    isActive ? 'bg-[#1A1A1A]' : 'bg-[#F5F5F0] hover:bg-[#E8E8E3]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm ${isActive ? 'text-white' : 'text-[#6B6B6B]'}`}>{tab.label}</span>
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      isActive ? 'bg-white/10' : 'bg-[#FEF9E7]'
                    }`}>
                      <IconComponent className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#FBBF24]'}`} strokeWidth={1.5} />
                    </div>
                  </div>
                  <p className={`text-xs ${isActive ? 'text-white/70' : 'text-[#8B8B8B]'}`}>
                    {tab.id === 'profile' && 'Your details'}
                    {tab.id === 'notifications' && 'Alerts & emails'}
                    {tab.id === 'security' && 'Password & 2FA'}
                    {tab.id === 'properties' && 'Your homes'}
                    {tab.id === 'tasks' && 'Task settings'}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            {activeTab === "profile" && <Profile />}
            {activeTab === "notifications" && <Notifications />}
            {activeTab === "security" && <Security />}
            {activeTab === "properties" && <Properties />}
            {activeTab === "tasks" && renderTaskTemplates()}
          </div>

          {/* Right sidebar nav */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-[16px] p-5 border border-[#E0E0DB]">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 bg-[#FEF9E7] rounded-full flex items-center justify-center">
                  <SettingsIcon className="w-4 h-4 text-[#FBBF24]" />
                </div>
                <h3 className="text-[#1A1A1A] text-base font-semibold">Settings Menu</h3>
              </div>
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? "bg-[#1A1A1A] text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <IconComponent className="w-4 h-4 mr-3" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </div>

      <SetupWizard
        isOpen={isSetupWizardOpen}
        onClose={() => setIsSetupWizardOpen(false)}
        onComplete={handleSetupComplete}
      />
    </DashboardLayout>
  );
};

export default Settings;
