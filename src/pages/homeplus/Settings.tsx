import { useState } from "react";
import {
  User,
  Bell,
  Shield,
  CreditCard,
  Key,
  Building,
  Calendar,
  CheckCircle,
  Settings as SettingsIcon,
  Zap,
  Clock,
  Plus,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import SetupWizard from "@/components/SetupWizard";
import Profile from "@/components/settings/profile";
import Security from "@/components/settings/security";

const Settings = () => {
  const [activeTab, setActiveTab] = useState<
    "profile" | "notifications" | "security" | "properties" | "tasks"
  >("profile");
  const [isSetupWizardOpen, setIsSetupWizardOpen] = useState(false);

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
    { id: "security" as const, label: "Security", icon: Shield },
    { id: "properties" as const, label: "Properties", icon: Building },
    { id: "tasks" as const, label: "Task Templates", icon: Calendar },
  ];

  const handleSetupComplete = (data: any) => {
    console.log("Setup completed with data:", data);
    // Here you would typically save the setup data and generate tasks
  };

  const renderTaskTemplates = () => (
    <div className="space-y-6">
      {/* UK Compliance Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-600" />
              UK Compliance (Required)
            </CardTitle>
            <Badge variant="destructive">Mandatory</Badge>
          </div>
          <p className="text-sm text-gray-600">
            These are pre-loaded and can't be deleted, only customised
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800 border-b pb-2">
              Safety & Legal Compliance
            </h4>

            {[
              {
                name: "Gas Safety Certificate",
                frequency: "Annual",
                applies: "Landlords",
                enabled: true,
              },
              {
                name: "EICR Certificate",
                frequency: "Every 5 years",
                applies: "Landlords / 10 years Homeowners",
                enabled: true,
              },
              {
                name: "EPC Rating",
                frequency: "Every 10 years",
                applies: "All properties",
                enabled: true,
              },
              {
                name: "Smoke Alarms",
                frequency: "Test monthly, battery annually",
                applies: "All properties",
                enabled: true,
              },
              {
                name: "Carbon Monoxide",
                frequency: "Test monthly, battery annually",
                applies: "All properties",
                enabled: true,
              },
              {
                name: "Boiler Service",
                frequency: "Annual",
                applies: "Warranty requirement",
                enabled: true,
              },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-red-600" />
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-gray-600">
                      {item.frequency} ({item.applies})
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Select defaultValue="90">
                    <SelectTrigger className="w-20 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30d</SelectItem>
                      <SelectItem value="60">60d</SelectItem>
                      <SelectItem value="90">90d</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs px-3 py-1.5 h-auto">
                    Customise
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommended Maintenance */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-orange-600" />
              Recommended Maintenance
            </CardTitle>
            <Badge variant="secondary">Customisable</Badge>
          </div>
          <p className="text-sm text-gray-600">
            Pre-populated but fully customisable templates
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Seasonal Maintenance */}
          <div>
            <h4 className="font-medium text-gray-800 border-b pb-2 mb-3">
              Seasonal Maintenance
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  season: "Spring",
                  tasks: [
                    "Gutter cleaning (after leaves)",
                    "Roof inspection",
                    "External painting check",
                  ],
                },
                {
                  season: "Summer",
                  tasks: [
                    "Garden maintenance",
                    "Window cleaning",
                    "Pest control check",
                  ],
                },
                {
                  season: "Autumn",
                  tasks: [
                    "Heating system check",
                    "Gutter cleaning (before winter)",
                    "Draught proofing",
                  ],
                },
                {
                  season: "Winter",
                  tasks: [
                    "Pipe insulation check",
                    "Boiler pressure check",
                    "Salt/grit supplies",
                  ],
                },
              ].map((seasonGroup, index) => (
                <div
                  key={index}
                  className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <h5 className="font-medium text-orange-800 mb-2">
                    {seasonGroup.season}
                  </h5>
                  <div className="space-y-1">
                    {seasonGroup.tasks.map((task, taskIndex) => (
                      <div key={taskIndex} className="flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 text-orange-600" />
                        <span className="text-xs text-gray-700">{task}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Regular Maintenance */}
          <div>
            <h4 className="font-medium text-gray-800 border-b pb-2 mb-3">
              Regular Maintenance
            </h4>
            <div className="space-y-2">
              {[
                {
                  name: "Chimney sweep",
                  frequency: "Annual",
                  condition: "if applicable",
                },
                {
                  name: "Septic tank empty",
                  frequency: "Every 2-3 years",
                  condition: "if applicable",
                },
                {
                  name: "Water softener service",
                  frequency: "Annual",
                  condition: "if applicable",
                },
                {
                  name: "Air conditioning service",
                  frequency: "Annual",
                  condition: "if applicable",
                },
                {
                  name: "Driveway sealing",
                  frequency: "Every 3 years",
                  condition: "if applicable",
                },
                {
                  name: "External woodwork treatment",
                  frequency: "Every 2 years",
                  condition: "if applicable",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3">
                    <Switch defaultChecked />
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-gray-600">
                        {item.frequency} ({item.condition})
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs px-3 py-1.5 h-auto">
                    Configure
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Household Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              Household Management
            </CardTitle>
            <Badge variant="outline">Optional</Badge>
          </div>
          <p className="text-sm text-gray-600">
            Templates users can activate for complete home management
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Council & Utilities */}
          <div>
            <h4 className="font-medium text-gray-800 border-b pb-2 mb-3">
              Council & Utilities
            </h4>
            <div className="space-y-2">
              {[
                {
                  name: "Bin day reminders",
                  description: "link to council",
                  enabled: false,
                },
                {
                  name: "Council tax payment",
                  description: "monthly reminder",
                  enabled: false,
                },
                {
                  name: "Water meter readings",
                  description: "quarterly",
                  enabled: false,
                },
                {
                  name: "Energy meter readings",
                  description: "monthly",
                  enabled: false,
                },
                {
                  name: "TV licence renewal",
                  description: "annual",
                  enabled: false,
                },
                {
                  name: "MOT reminder",
                  description: "for car",
                  enabled: false,
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <Switch defaultChecked={item.enabled} />
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-gray-600">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs px-3 py-1.5 h-auto">
                    Setup
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Financial */}
          <div>
            <h4 className="font-medium text-gray-800 border-b pb-2 mb-3">
              Financial
            </h4>
            <div className="space-y-2">
              {[
                { name: "Mortgage payment", description: "monthly tracking" },
                { name: "Rent payment", description: "tenants" },
                { name: "Insurance renewals", description: "annual reminders" },
                { name: "Service subscriptions", description: "various" },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <Switch />
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-gray-600">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs px-3 py-1.5 h-auto">
                    Configure
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Family & Lifestyle */}
          <div>
            <h4 className="font-medium text-gray-800 border-b pb-2 mb-3">
              Family & Lifestyle
            </h4>
            <div className="space-y-2">
              {[
                { name: "School term dates", description: "academic calendar" },
                { name: "Pet vaccinations", description: "annual reminders" },
                {
                  name: "Dentist appointments",
                  description: "6-monthly check-ups",
                },
                {
                  name: "Prescription renewals",
                  description: "medication tracking",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-3">
                    <Switch />
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-gray-600">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs px-3 py-1.5 h-auto">
                    Setup
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Automation Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            Automation Rules
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800 border-b pb-2">
              Smart Scheduling
            </h4>
            {[
              {
                rule: "Auto-schedule annual services in same month as last year",
                enabled: true,
              },
              {
                rule: "Group similar trades (all electrical same day)",
                enabled: true,
              },
              { rule: "Avoid bank holidays", enabled: true },
              {
                rule: "Weather-based scheduling (gutters when dry)",
                enabled: false,
              },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm">{item.rule}</span>
                <Switch defaultChecked={item.enabled} />
              </div>
            ))}

            <Separator className="my-4" />

            <h4 className="font-medium text-gray-800 border-b pb-2">
              Notifications
            </h4>
            {[
              { rule: "90 days before certificates expire", enabled: true },
              { rule: "30 days before annual services", enabled: true },
              { rule: "7 days before appointments", enabled: true },
              { rule: "Day before bin collection", enabled: false },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm">{item.rule}</span>
                <Switch defaultChecked={item.enabled} />
              </div>
            ))}

            <Separator className="my-4" />

            <h4 className="font-medium text-gray-800 border-b pb-2">
              Integration
            </h4>
            {[
              { rule: "Import council bin calendar", enabled: false },
              { rule: "Sync with phone calendar", enabled: true },
              {
                rule: "Auto-detect warranty expiries from documents",
                enabled: false,
              },
              { rule: "Track service history from invoices", enabled: true },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm">{item.rule}</span>
                <Switch defaultChecked={item.enabled} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={() => setIsSetupWizardOpen(true)}
          className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Run Setup Wizard
        </Button>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-black">Settings</h1>
          <p className="text-gray-600">
            Manage your account preferences and property settings
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:w-64">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? "bg-primary text-primary-foreground"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}>
                    <IconComponent className="w-4 h-4 mr-3" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === "profile" && <Profile />}

            {activeTab === "notifications" && (
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      label: "Email Notifications",
                      description: "Receive updates via email",
                      enabled: true,
                    },
                    {
                      label: "SMS Notifications",
                      description: "Receive urgent alerts via SMS",
                      enabled: false,
                    },
                    {
                      label: "Calendar Reminders",
                      description: "Add events to your calendar",
                      enabled: true,
                    },
                    {
                      label: "Marketing Emails",
                      description: "Receive tips and offers",
                      enabled: false,
                    },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-3 border-b">
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-gray-600">
                          {item.description}
                        </p>
                      </div>
                      <Switch defaultChecked={item.enabled} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {activeTab === "security" && <Security />}

            {activeTab === "properties" && (
              <Card>
                <CardHeader>
                  <CardTitle>Property Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Manage your properties and their settings
                  </p>
                  <Button onClick={() => setIsSetupWizardOpen(true)}>
                    Add New Property
                  </Button>
                </CardContent>
              </Card>
            )}

            {activeTab === "tasks" && renderTaskTemplates()}
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
