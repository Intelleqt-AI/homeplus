"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import { trpc } from "@/trpc/client";
import { AddressStep } from "@/components/onboarding/address-step";
import { PropertyDetailsStep } from "@/components/onboarding/property-details-step";
import { RoomsStep } from "@/components/onboarding/rooms-step";
import { AppliancesStep } from "@/components/onboarding/appliances-step";
import { SummaryStep } from "@/components/onboarding/summary-step";

export type OnboardingData = {
  // Address
  postcode: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  county: string;
  localAuthority: string;

  // EPC data
  epcRating: string;
  epcData: Record<string, unknown> | null;

  // Property details
  propertyType:
    | "house"
    | "flat"
    | "bungalow"
    | "maisonette"
    | "terraced"
    | "semi_detached"
    | "detached"
    | "other";
  ownershipType: "owner_occupier" | "tenant" | "landlord";
  bedrooms: number;
  bathrooms: number;
  yearBuilt: number | undefined;

  // Rooms
  rooms: Array<{ name: string; floor: number }>;

  // Appliances
  appliances: Array<{
    roomIndex: number;
    name: string;
    brand: string;
    model: string;
  }>;
};

const STEPS = [
  { id: "address", label: "Address" },
  { id: "details", label: "Property details" },
  { id: "rooms", label: "Rooms" },
  { id: "appliances", label: "Appliances" },
  { id: "summary", label: "Summary" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    postcode: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    county: "",
    localAuthority: "",
    epcRating: "",
    epcData: null,
    propertyType: "house",
    ownershipType: "owner_occupier",
    bedrooms: 3,
    bathrooms: 1,
    yearBuilt: undefined,
    rooms: [
      { name: "Living Room", floor: 0 },
      { name: "Kitchen", floor: 0 },
      { name: "Bedroom 1", floor: 1 },
      { name: "Bathroom", floor: 1 },
    ],
    appliances: [],
  });

  const createProperty = trpc.property.create.useMutation();
  const addRooms = trpc.property.addRooms.useMutation();
  const addAppliance = trpc.property.addAppliance.useMutation();

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const property = await createProperty.mutateAsync({
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 || undefined,
        city: data.city,
        county: data.county || undefined,
        postcode: data.postcode,
        propertyType: data.propertyType,
        ownershipType: data.ownershipType,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        yearBuilt: data.yearBuilt,
        localAuthority: data.localAuthority || undefined,
        epcRating: data.epcRating || undefined,
        epcData: data.epcData,
      });

      if (data.rooms.length > 0) {
        const createdRooms = await addRooms.mutateAsync({
          propertyId: property.id,
          rooms: data.rooms,
        });

        for (const appliance of data.appliances) {
          const room = createdRooms[appliance.roomIndex];
          await addAppliance.mutateAsync({
            propertyId: property.id,
            roomId: room?.id,
            name: appliance.name,
            brand: appliance.brand || undefined,
            model: appliance.model || undefined,
          });
        }
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Failed to save property:", error);
      setSaving(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return data.postcode && data.addressLine1 && data.city;
      case 1:
        return data.propertyType && data.ownershipType;
      case 2:
        return data.rooms.length > 0;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <AddressStep data={data} onUpdate={updateData} />;
      case 1:
        return <PropertyDetailsStep data={data} onUpdate={updateData} />;
      case 2:
        return <RoomsStep data={data} onUpdate={updateData} />;
      case 3:
        return <AppliancesStep data={data} onUpdate={updateData} />;
      case 4:
        return <SummaryStep data={data} />;
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Add your property</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Let&apos;s set up your home in just a few steps.
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${
                  index < currentStep
                    ? "bg-success text-success-foreground"
                    : index === currentStep
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {index < currentStep ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`mx-2 h-0.5 w-8 sm:w-12 ${
                    index < currentStep ? "bg-success" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between">
          {STEPS.map((step) => (
            <span
              key={step.id}
              className="text-xs text-muted-foreground hidden sm:block"
            >
              {step.label}
            </span>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="rounded-xl border border-border bg-card p-6">
        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex justify-between">
        {currentStep > 0 ? (
          <button
            onClick={() => setCurrentStep((s) => s - 1)}
            className="flex items-center gap-2 rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        ) : (
          <div />
        )}

        {currentStep < STEPS.length - 1 ? (
          <button
            onClick={() => setCurrentStep((s) => s + 1)}
            disabled={!canProceed()}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleComplete}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-success px-4 py-2 text-sm font-medium text-success-foreground hover:opacity-90 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            {saving ? "Saving..." : "Complete setup"}
          </button>
        )}
      </div>
    </div>
  );
}
