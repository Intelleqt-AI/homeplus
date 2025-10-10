import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
// import { SupabaseAuthClient } from '@supabase/supabase-js/dist/module/lib/SupabaseAuthClient';
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const Security = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const validatePassword = (password: string) => {
    const minLength = /.{6,}/;
    const hasUppercase = /[A-Z]/;
    const hasNumber = /\d/;
    return (
      minLength.test(password) &&
      hasUppercase.test(password) &&
      hasNumber.test(password)
    );
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(e.currentTarget);
    const current = formData.get("current") as string;
    const newPass = formData.get("new") as string;
    const confirm = formData.get("confirm") as string;

    if (!current || !newPass || !confirm) {
      toast.error("All fields are required.");
      return;
    }

    if (newPass !== confirm) {
      toast.error("New passwords do not match.");
      return;
    }

    if (!validatePassword(newPass)) {
      toast.error(
        "Password must be at least 6 characters, include one uppercase letter and one number."
      );
      return;
    }

    try {
      setLoading(true);

      // Reauthenticate current password
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: user?.email ?? "",
          password: current,
        });

      if (signInError) {
        toast.error("Current password is incorrect.");
        return;
      }

      // Update password if reauthentication succeeded
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPass,
      });

      if (updateError) throw updateError;

      toast.success("Password updated successfully!");
      form.reset();
    } catch (err: any) {
      toast.error(
        err.message || "Something went wrong while updating password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password & Security</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handlePasswordChange} className="space-y-4">
          {[
            { id: "current", label: "Current Password" },
            { id: "new", label: "New Password" },
            { id: "confirm", label: "Confirm New Password" },
          ].map((field) => (
            <div key={field.id} className="relative">
              <Label htmlFor={field.id}>{field.label}</Label>
              <Input
                id={field.id}
                name={field.id}
                type={
                  showPassword[field.id as keyof typeof showPassword]
                    ? "text"
                    : "password"
                }
                className="pr-10"
              />
              <button
                type="button"
                onClick={() =>
                  togglePasswordVisibility(
                    field.id as "current" | "new" | "confirm"
                  )
                }
                className="absolute right-3 top-9 text-gray-500 hover:text-gray-700">
                {showPassword[field.id as keyof typeof showPassword] ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          ))}
          <Button
            type="submit"
            disabled={loading}
            className="diasbled:opacity-50 disabled:cursor-not-allowed">
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default Security;
