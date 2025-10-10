import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUserInfo } from "@/lib/Api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const Profile = () => {
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
  });
  const [message, setMessage] = useState("");

  const queryClient = useQueryClient();
  const { user } = useAuth();
  // console.log(user);

  const mutation = useMutation({
    mutationFn: updateUserInfo, // your API function
    onSuccess: () => {
      toast.success("User updated successfully!");
      // queryClient.invalidateQueries(["getUser"]); // update user data cache
    },
    onError: (error) => {
      toast.error(error.message || "Error! Could not update user.");
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    // console.log(name, value);
    setForm((prev) => {
      return { ...prev, [name]: value };
    });
  };

  const handleSave = () => {
    setMessage("");

    // ✅ Supabase client expects metadata under the "data" key
    const payload = {
      data: { full_name: form.full_name },
    };

    // console.log("Update payload:", payload);
    mutation.mutate({ userData: payload });
  };

  useEffect(() => {
    if (!user) return;

    const { full_name, phone, email } = user.user_metadata || {};
    setForm({
      full_name: full_name || "",
      phone: phone || "",
      email: email || "",
    });
  }, [user]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
            />
          </div>
          {/* <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={form.lastName}
              onChange={handleChange}
            />
          </div> */}
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            readOnly
            className="bg-gray-100 text-gray-600 cursor-not-allowed border border-gray-300"
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
          />
        </div>
        <Button onClick={handleSave}>Save Changes</Button>
        {message && <p className="mt-2 text-sm">{message}</p>}
      </CardContent>
    </Card>
  );
};

export default Profile;
