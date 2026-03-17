"use client";

import { Plus, Trash2, Refrigerator } from "lucide-react";
import type { OnboardingData } from "@/app/(dashboard)/dashboard/onboarding/page";

const COMMON_APPLIANCES = [
  "Boiler",
  "Washing Machine",
  "Dishwasher",
  "Fridge Freezer",
  "Oven",
  "Hob",
  "Extractor Fan",
  "Tumble Dryer",
  "Microwave",
  "Smoke Alarm",
  "Carbon Monoxide Alarm",
  "Thermostat",
];

export function AppliancesStep({
  data,
  onUpdate,
}: {
  data: OnboardingData;
  onUpdate: (updates: Partial<OnboardingData>) => void;
}) {
  const addAppliance = (name: string, roomIndex: number) => {
    onUpdate({
      appliances: [
        ...data.appliances,
        { roomIndex, name, brand: "", model: "" },
      ],
    });
  };

  const removeAppliance = (index: number) => {
    onUpdate({
      appliances: data.appliances.filter((_, i) => i !== index),
    });
  };

  const updateAppliance = (
    index: number,
    field: "brand" | "model",
    value: string
  ) => {
    const updated = [...data.appliances];
    updated[index] = { ...updated[index], [field]: value };
    onUpdate({ appliances: updated });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Appliances</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Register key appliances so we can track warranties and schedule
          servicing. You can skip this and add them later.
        </p>
      </div>

      {/* Quick add common appliances */}
      <div>
        <label className="block text-sm font-medium">Quick add</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {COMMON_APPLIANCES.filter(
            (name) => !data.appliances.some((a) => a.name === name)
          ).map((name) => (
            <button
              key={name}
              onClick={() => addAppliance(name, 0)}
              className="flex items-center gap-1 rounded-full border border-input px-3 py-1 text-xs font-medium hover:bg-muted"
            >
              <Plus className="h-3 w-3" />
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Listed appliances */}
      {data.appliances.length > 0 && (
        <div className="space-y-3">
          <label className="block text-sm font-medium">
            Your appliances ({data.appliances.length})
          </label>
          {data.appliances.map((appliance, index) => (
            <div
              key={index}
              className="rounded-lg border border-input p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Refrigerator className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{appliance.name}</span>
                </div>
                <button
                  onClick={() => removeAppliance(index)}
                  className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={appliance.roomIndex}
                  onChange={(e) => {
                    const updated = [...data.appliances];
                    updated[index] = {
                      ...updated[index],
                      roomIndex: parseInt(e.target.value, 10),
                    };
                    onUpdate({ appliances: updated });
                  }}
                  className="rounded-md border border-input bg-background px-2 py-1.5 text-xs"
                >
                  {data.rooms.map((room, ri) => (
                    <option key={ri} value={ri}>
                      {room.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Brand"
                  value={appliance.brand}
                  onChange={(e) =>
                    updateAppliance(index, "brand", e.target.value)
                  }
                  className="rounded-md border border-input bg-background px-2 py-1.5 text-xs outline-none"
                />
                <input
                  type="text"
                  placeholder="Model"
                  value={appliance.model}
                  onChange={(e) =>
                    updateAppliance(index, "model", e.target.value)
                  }
                  className="rounded-md border border-input bg-background px-2 py-1.5 text-xs outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {data.appliances.length === 0 && (
        <div className="rounded-lg border border-dashed border-input p-8 text-center">
          <Refrigerator className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            No appliances added yet. Use quick add above or add them later from
            your dashboard.
          </p>
        </div>
      )}
    </div>
  );
}
