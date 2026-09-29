"use client";

import React, { useState } from "react";
import { Trash2, AlertTriangle, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SocialSignInButtons, { type ProviderCredential } from "@/components/auth/SocialSignInButtons";

const CONFIRMATION_TEXT = "DELETE";

export type DeleteAccountPayload = { password: string } | { provider: ProviderCredential["provider"]; credential: string };

const hasSocialButtons = !!(import.meta.env.VITE_GOOGLE_CLIENT_ID || import.meta.env.VITE_APPLE_CLIENT_ID);

export const DeleteAccountDialog = ({
  isOpen,
  onClose,
  onConfirm,
  hasPassword,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: DeleteAccountPayload) => Promise<void>;
  /** False for users who only sign in with Google/Apple — they re-confirm with the provider instead. */
  hasPassword: boolean;
}) => {
  const [password, setPassword] = useState("");
  const [providerCredential, setProviderCredential] = useState<ProviderCredential | null>(null);
  const [confirmationInput, setConfirmationInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const identityConfirmed = hasPassword ? password.length > 0 : !!providerCredential;
  const isValid = identityConfirmed && confirmationInput.trim() === CONFIRMATION_TEXT;
  const providerName = providerCredential?.provider === "apple" ? "Apple" : "Google";

  const reset = () => {
    setPassword("");
    setProviderCredential(null);
    setConfirmationInput("");
    setError(null);
  };

  const handleClose = () => {
    if (isDeleting) return;
    reset();
    onClose();
  };

  const handleConfirm = async () => {
    if (!isValid) return;
    setIsDeleting(true);
    setError(null);
    try {
      await onConfirm(
        hasPassword
          ? { password }
          : { provider: providerCredential!.provider, credential: providerCredential!.token },
      );
      reset();
      onClose();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { errors?: Record<string, string | string[]>; message?: string } } })
        ?.response?.data;
      const pick = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);
      const credentialError = pick(data?.errors?.credential);
      if (credentialError) setProviderCredential(null);
      setError(pick(data?.errors?.password) ?? credentialError ?? data?.message ?? "Failed to delete account.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg z-[99]">
        <DialogHeader className="flex flex-row items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <DialogTitle>Delete Account</DialogTitle>
        </DialogHeader>

        <DialogDescription className="text-sm text-muted-foreground">
          This permanently deletes your account and all associated data — properties, documents,
          job history, and messages. This action cannot be undone.
        </DialogDescription>

        <div className="mt-2 space-y-4">
          {hasPassword ? (
            <div className="space-y-1.5">
              <Label htmlFor="delete-account-password">Confirm your password</Label>
              <Input
                id="delete-account-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={isDeleting}
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>Confirm it's you</Label>
              {providerCredential ? (
                <div className="flex items-center justify-between gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm">
                  <span className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-4 h-4" /> Confirmed with {providerName}
                  </span>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:underline"
                    onClick={() => setProviderCredential(null)}
                    disabled={isDeleting}
                  >
                    Use a different account
                  </button>
                </div>
              ) : hasSocialButtons ? (
                <SocialSignInButtons
                  variant="reauth"
                  onCredential={(c) => {
                    setError(null);
                    setProviderCredential(c);
                  }}
                  onError={setError}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Set a password first: sign out and use <strong>Forgot password?</strong> on the login page.
                </p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <p className="text-sm text-gray-700">
              To confirm deletion, please type{" "}
              <code className="bg-gray-100 px-1.5 py-0.5 rounded text-red-600 font-mono text-xs">
                {CONFIRMATION_TEXT}
              </code>{" "}
              below:
            </p>
            <Input
              type="text"
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              placeholder={`Type "${CONFIRMATION_TEXT}" to confirm`}
              disabled={isDeleting}
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter className="mt-3 flex gap-3 sm:justify-end">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting || !isValid}
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-1" />
                Delete Account
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
