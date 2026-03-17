"use client";

import {
  Home,
  Building,
  Users,
  CheckCircle,
} from "lucide-react";
import type { OnboardingData } from "@/app/(dashboard)/dashboard/onboarding/page";

const propertyTypes = [
  { id: "house" as const, label: "House", icon: Home },
  { id: "flat" as const, label: "Flat / Apartment", icon: Building },
  { id: "bungalow" as const, label: "Bungalow", icon: Home },
  { id: "terraced" as const, label: "Terraced", icon: Building },
  { id: "semi_detached" as const, label: "Semi-detached", icon: Home },
  { id: "detached" as const, label: "Detached", icon: Home },
];

const ownershipTypes = [
  {
    id: "owner_occupier" as const,
    label: "Owner occupier",
    description: "I own and live in this property",
  },
  {
    id: "tenant" as const,
    label: "Tenant",
    description: "I rent this property",
  },
  {
    id: "landlord" as const,
    label: "Landlord",
    description: "I rent this property to others",
  },
];

export function PropertyDetailsStep({
  data,
  onUpdate,
}: {
  data: OnboardingData;
  onUpdate: (updates: Partial<OnboardingData>) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Property details</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell us about your property so we can set up the right maintenance
          schedule.
        </p>
      </div>

      {/* Property type */}
      <div>
        <label className="block text-sm font-medium">Property type</label>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {propertyTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = data.propertyType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => onUpdate({ propertyType: type.id })}
                className={`flex items-center gap-2 rounded-lg border p-3 text-left text-sm transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-input hover:bg-muted"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="font-medium">{type.label}</span>
                {isSelected && (
                  <CheckCircle className="ml-auto h-4 w-4 text-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Ownership type */}
      <div>
        <label className="block text-sm font-medium">Ownership</label>
        <div className="mt-2 space-y-2">
          {ownershipTypes.map((type) => {
            const isSelected = data.ownershipType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => onUpdate({ ownershipType: type.id })}
                className={`flex w-full items-start justify-between rounded-lg border p-3 text-left transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-input hover:bg-muted"
                }`}
              >
                <div>
                  <p className="text-sm font-medium">{type.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {type.description}
                  </p>
                </div>
                {isSelected && (
                  <CheckCircle className="h-4 w-4 shrink-0 text-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bedrooms and bathrooms */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Bedrooms</label>
          <select
            value={data.bedrooms}
            onChange={(e) =>
              onUpdate({ bedrooms: parseInt(e.target.value, 10) })
            }
            className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Bathrooms</label>
          <select
            value={data.bathrooms}
            onChange={(e) =>
              onUpdate({ bathrooms: parseInt(e.target.value, 10) })
            }
            className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Year built */}
      <div>
        <label className="block text-sm font-medium">
          Year built{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <input
          type="number"
          value={data.yearBuilt ?? ""}
          onChange={(e) =>
            onUpdate({
              yearBuilt: e.target.value
                ? parseInt(e.target.value, 10)
                : undefined,
            })
          }
          placeholder="e.g. 1990"
          min={1800}
          max={new Date().getFullYear()}
          className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
    </div>
  );
}
