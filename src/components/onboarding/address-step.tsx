"use client";

import { useState } from "react";
import { Search, Loader2, MapPin } from "lucide-react";
import type { OnboardingData } from "@/app/(dashboard)/dashboard/onboarding/page";

interface AddressResult {
  line_1: string;
  line_2: string;
  post_town: string;
  county: string;
  postcode: string;
}

export function AddressStep({
  data,
  onUpdate,
}: {
  data: OnboardingData;
  onUpdate: (updates: Partial<OnboardingData>) => void;
}) {
  const [postcodeInput, setPostcodeInput] = useState(data.postcode);
  const [searching, setSearching] = useState(false);
  const [addresses, setAddresses] = useState<AddressResult[]>([]);
  const [manualMode, setManualMode] = useState(false);
  const [epcLoading, setEpcLoading] = useState(false);

  const handlePostcodeLookup = async () => {
    if (!postcodeInput.trim()) return;
    setSearching(true);
    setAddresses([]);

    try {
      const response = await fetch(
        `/api/address-lookup?postcode=${encodeURIComponent(postcodeInput.trim())}`
      );
      if (response.ok) {
        const results = await response.json();
        setAddresses(results.addresses ?? []);
        if (results.addresses?.length === 0) {
          setManualMode(true);
        }
      } else {
        setManualMode(true);
      }
    } catch {
      setManualMode(true);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectAddress = async (address: AddressResult) => {
    onUpdate({
      postcode: address.postcode || postcodeInput,
      addressLine1: address.line_1,
      addressLine2: address.line_2,
      city: address.post_town,
      county: address.county,
    });
    setAddresses([]);

    // Try to fetch EPC data
    await fetchEpcData(address.postcode || postcodeInput);
  };

  const fetchEpcData = async (postcode: string) => {
    setEpcLoading(true);
    try {
      const response = await fetch(
        `/api/epc-lookup?postcode=${encodeURIComponent(postcode)}`
      );
      if (response.ok) {
        const epcResult = await response.json();
        if (epcResult.rating) {
          onUpdate({
            epcRating: epcResult.rating,
            epcData: epcResult,
          });
        }
      }
    } catch {
      // EPC lookup is optional
    } finally {
      setEpcLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Find your address</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your postcode and we&apos;ll look up your address and EPC data
          automatically.
        </p>
      </div>

      {/* Postcode lookup */}
      <div>
        <label className="block text-sm font-medium">Postcode</label>
        <div className="mt-1 flex gap-2">
          <input
            type="text"
            value={postcodeInput}
            onChange={(e) => setPostcodeInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handlePostcodeLookup()}
            placeholder="e.g. SW1A 1AA"
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={handlePostcodeLookup}
            disabled={searching || !postcodeInput.trim()}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {searching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Find
          </button>
        </div>
      </div>

      {/* Address results */}
      {addresses.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Select your address
          </label>
          <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-input p-2">
            {addresses.map((addr, index) => (
              <button
                key={index}
                onClick={() => handleSelectAddress(addr)}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
              >
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                {[addr.line_1, addr.line_2, addr.post_town]
                  .filter(Boolean)
                  .join(", ")}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setManualMode(true);
              setAddresses([]);
            }}
            className="text-sm text-muted-foreground underline"
          >
            Enter address manually
          </button>
        </div>
      )}

      {/* Manual entry or selected address */}
      {(manualMode || data.addressLine1) && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Address line 1</label>
            <input
              type="text"
              value={data.addressLine1}
              onChange={(e) => onUpdate({ addressLine1: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="Street address"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Address line 2</label>
            <input
              type="text"
              value={data.addressLine2}
              onChange={(e) => onUpdate({ addressLine2: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="Optional"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Town / City</label>
              <input
                type="text"
                value={data.city}
                onChange={(e) => onUpdate({ city: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">County</label>
              <input
                type="text"
                value={data.county}
                onChange={(e) => onUpdate({ county: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* EPC badge */}
          {epcLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Looking up EPC data...
            </div>
          )}
          {data.epcRating && (
            <div className="flex items-center gap-3 rounded-lg bg-success/10 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success text-lg font-bold text-success-foreground">
                {data.epcRating}
              </div>
              <div>
                <p className="text-sm font-medium">EPC Rating found</p>
                <p className="text-xs text-muted-foreground">
                  Imported automatically from the register
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {!manualMode && !data.addressLine1 && addresses.length === 0 && (
        <button
          onClick={() => setManualMode(true)}
          className="text-sm text-muted-foreground underline"
        >
          Can&apos;t find your address? Enter manually
        </button>
      )}
    </div>
  );
}
