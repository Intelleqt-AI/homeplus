"use client";

import { Plus, Trash2 } from "lucide-react";
import type { OnboardingData } from "@/app/(dashboard)/dashboard/onboarding/page";

const SUGGESTED_ROOMS = [
  "Living Room",
  "Kitchen",
  "Dining Room",
  "Bedroom 1",
  "Bedroom 2",
  "Bedroom 3",
  "Bathroom",
  "En-suite",
  "Utility Room",
  "Hallway",
  "Garage",
  "Garden",
  "Loft",
  "Study",
];

export function RoomsStep({
  data,
  onUpdate,
}: {
  data: OnboardingData;
  onUpdate: (updates: Partial<OnboardingData>) => void;
}) {
  const addRoom = (name: string) => {
    if (data.rooms.some((r) => r.name === name)) return;
    onUpdate({
      rooms: [...data.rooms, { name, floor: 0 }],
    });
  };

  const removeRoom = (index: number) => {
    const updated = data.rooms.filter((_, i) => i !== index);
    // Also remove appliances referencing this room
    const updatedAppliances = data.appliances
      .filter((a) => a.roomIndex !== index)
      .map((a) => ({
        ...a,
        roomIndex: a.roomIndex > index ? a.roomIndex - 1 : a.roomIndex,
      }));
    onUpdate({ rooms: updated, appliances: updatedAppliances });
  };

  const updateRoomFloor = (index: number, floor: number) => {
    const updated = [...data.rooms];
    updated[index] = { ...updated[index], floor };
    onUpdate({ rooms: updated });
  };

  const suggestedRooms = SUGGESTED_ROOMS.filter(
    (name) => !data.rooms.some((r) => r.name === name)
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Rooms</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add the rooms in your property. This helps organise appliances and
          maintenance tasks.
        </p>
      </div>

      {/* Current rooms */}
      {data.rooms.length > 0 && (
        <div className="space-y-2">
          {data.rooms.map((room, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-lg border border-input p-3"
            >
              <span className="flex-1 text-sm font-medium">{room.name}</span>
              <select
                value={room.floor}
                onChange={(e) =>
                  updateRoomFloor(index, parseInt(e.target.value, 10))
                }
                className="rounded-md border border-input bg-background px-2 py-1 text-xs"
              >
                <option value={-1}>Basement</option>
                <option value={0}>Ground floor</option>
                <option value={1}>First floor</option>
                <option value={2}>Second floor</option>
                <option value={3}>Third floor</option>
              </select>
              <button
                onClick={() => removeRoom(index)}
                className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Suggested rooms */}
      {suggestedRooms.length > 0 && (
        <div>
          <label className="block text-sm font-medium">Quick add</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestedRooms.map((name) => (
              <button
                key={name}
                onClick={() => addRoom(name)}
                className="flex items-center gap-1 rounded-full border border-input px-3 py-1 text-xs font-medium hover:bg-muted"
              >
                <Plus className="h-3 w-3" />
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom room */}
      <div>
        <label className="block text-sm font-medium">Add custom room</label>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const name = formData.get("roomName") as string;
            if (name.trim()) {
              addRoom(name.trim());
              e.currentTarget.reset();
            }
          }}
          className="mt-1 flex gap-2"
        >
          <input
            name="roomName"
            type="text"
            placeholder="Room name"
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            className="flex items-center gap-1 rounded-lg border border-input px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </form>
      </div>
    </div>
  );
}
