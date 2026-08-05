"use client";

import React, { useState } from "react";
import { Trash2, AlertTriangle } from "lucide-react";
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

const CONFIRMATION_TEXT = "DELETE";

export const DeleteAccountDialog = ({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
}) => {
  const [password, setPassword] = useState("");
  const [confirmationInput, setConfirmationInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isValid = password.length > 0 && confirmationInput.trim() === CONFIRMATION_TEXT;

  const reset = () => {
    setPassword("");
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
      await onConfirm(password);
      reset();
      onClose();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { errors?: { password?: string[] }; message?: string } } })
          ?.response?.data?.errors?.password?.[0] ??
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to delete account.";
      setError(message);
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
