"use client";

import {
  MapPin,
  Home,
  DoorOpen,
  Refrigerator,
  Zap,
} from "lucide-react";
import type { OnboardingData } from "@/app/(dashboard)/dashboard/onboarding/page";

export function SummaryStep({ data }: { data: OnboardingData }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Review &amp; complete</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Check everything looks right before we create your property profile.
        </p>
      </div>

      {/* Address */}
      <div className="rounded-lg border border-input p-4">
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-5 w-5 text-accent" />
          <div>
            <p className="text-sm font-medium">Address</p>
            <p className="text-sm text-muted-foreground">
              {data.addressLine1}
              {data.addressLine2 && `, ${data.addressLine2}`}
            </p>
            <p className="text-sm text-muted-foreground">
              {data.city}
              {data.county && `, ${data.county}`} {data.postcode}
            </p>
          </div>
        </div>
      </div>

      {/* Property details */}
      <div className="rounded-lg border border-input p-4">
        <div className="flex items-start gap-3">
          <Home className="mt-0.5 h-5 w-5 text-accent" />
          <div className="flex-1">
            <p className="text-sm font-medium">Property</p>
            <div className="mt-1 grid grid-cols-2 gap-y-1 text-sm text-muted-foreground">
              <span>Type</span>
              <span className="font-medium text-foreground">
                {data.propertyType.replace(/_/g, " ")}
              </span>
              <span>Ownership</span>
              <span className="font-medium text-foreground">
                {data.ownershipType.replace(/_/g, " ")}
              </span>
              <span>Bedrooms</span>
              <span className="font-medium text-foreground">
                {data.bedrooms}
              </span>
              <span>Bathrooms</span>
              <span className="font-medium text-foreground">
                {data.bathrooms}
              </span>
              {data.yearBuilt && (
                <>
                  <span>Year built</span>
                  <span className="font-medium text-foreground">
                    {data.yearBuilt}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* EPC */}
      {data.epcRating && (
        <div className="rounded-lg border border-input p-4">
          <div className="flex items-start gap-3">
            <Zap className="mt-0.5 h-5 w-5 text-accent" />
            <div>
              <p className="text-sm font-medium">EPC Rating</p>
              <div className="mt-1 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-success text-sm font-bold text-success-foreground">
                  {data.epcRating}
                </div>
                <span className="text-sm text-muted-foreground">
                  Imported from the EPC register
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rooms */}
      <div className="rounded-lg border border-input p-4">
        <div className="flex items-start gap-3">
          <DoorOpen className="mt-0.5 h-5 w-5 text-accent" />
          <div>
            <p className="text-sm font-medium">
              Rooms ({data.rooms.length})
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              {data.rooms.map((room, i) => (
                <span
                  key={i}
                  className="rounded-full bg-muted px-2 py-0.5 text-xs"
                >
                  {room.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Appliances */}
      <div className="rounded-lg border border-input p-4">
        <div className="flex items-start gap-3">
          <Refrigerator className="mt-0.5 h-5 w-5 text-accent" />
          <div>
            <p className="text-sm font-medium">
              Appliances ({data.appliances.length})
            </p>
            {data.appliances.length > 0 ? (
              <div className="mt-1 flex flex-wrap gap-1">
                {data.appliances.map((appliance, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-muted px-2 py-0.5 text-xs"
                  >
                    {appliance.name}
                    {appliance.brand && ` (${appliance.brand})`}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                None added — you can add these later
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-accent/10 p-4">
        <p className="text-sm font-medium text-accent-foreground">
          Once you complete setup, we&apos;ll automatically generate your
          maintenance calendar based on your property type and systems.
        </p>
      </div>
    </div>
  );
}
