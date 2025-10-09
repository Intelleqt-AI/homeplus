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
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [message, setMessage] = useState("");

  const queryClient = useQueryClient();
  const { user } = useAuth();
  console.log(user);

  // Fetch current user info on mount
  // useEffect(() => {
  //   const fetchUser = async () => {
  //     const { data, error } = await supabase.auth.getUser();
  //     if (error) {
  //       setMessage(error.message);
  //       return;
  //     }
  //     if (data?.user) {
  //       setForm({
  //         firstName: data.user.user_metadata?.first_name || "",
  //         lastName: data.user.user_metadata?.last_name || "",
  //         email: data.user.email || "",
  //         phone: data.user.user_metadata?.phone || "",
  //       });
  //     }
  //   };
  //   fetchUser();
  // }, []);

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
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleSave = () => {
    setMessage("");
    const data = {
      user_metadata: { display_name: `${form.firstName} ${form.lastName}` },
      // phone: `+880${form.phone.slice(1)}`, // optional
    };
    console.log(data);
    mutation.mutate({ userData: data });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={form.firstName}
              onChange={handleChange}
            />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={form.lastName}
              onChange={handleChange}
            />
          </div>
        </div>
        {/* <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={handleChange}
          />
        </div> */}
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
