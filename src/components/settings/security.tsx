import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { usePost } from "@/hooks/usePost";

type Fields = { current: string; newPass: string; confirm: string };
type Errors = Partial<Record<keyof Fields, string>>;

const RULES = [
  { label: "At least 8 characters",          test: (p: string) => p.length >= 8 },
  { label: "At least one letter",             test: (p: string) => /[a-zA-Z]/.test(p) },
  { label: "At least one number",             test: (p: string) => /\d/.test(p) },
];

function validate(f: Fields): Errors {
  const e: Errors = {};
  if (!f.current.trim())     e.current = "Current password is required.";
  if (!f.newPass)             e.newPass = "New password is required.";
  else if (f.newPass.length < 8) e.newPass = "Must be at least 8 characters.";
  else if (!/[a-zA-Z]/.test(f.newPass)) e.newPass = "Must include a letter.";
  else if (!/\d/.test(f.newPass))       e.newPass = "Must include a number.";
  if (!f.confirm)             e.confirm = "Please confirm your new password.";
  else if (f.confirm !== f.newPass) e.confirm = "Passwords do not match.";
  return e;
}

const Security = () => {
  const [fields, setFields] = useState<Fields>({ current: "", newPass: "", confirm: "" });
  const [show, setShow]     = useState({ current: false, newPass: false, confirm: false });
  const [errors, setErrors] = useState<Errors>({});

  const changePassword = usePost();

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFields(prev => ({ ...prev, [k]: e.target.value }));
    setErrors(prev => { const next = { ...prev }; delete next[k]; return next; });
  };

  const toggleShow = (k: keyof typeof show) =>
    setShow(prev => ({ ...prev, [k]: !prev[k] }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(fields);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    try {
      await changePassword.mutateAsync({
        url: "/api/v1/auth/change-password/",
        data: {
          old_password:         fields.current,
          new_password:         fields.newPass,
          new_password_confirm: fields.confirm,
        },
      });
      toast.success("Password updated.");
      setFields({ current: "", newPass: "", confirm: "" });
      setErrors({});
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } })?.response?.data;
      const apiErrors = data?.errors ?? {};
      const mapped: Errors = {};
      if (apiErrors.old_password)          mapped.current = apiErrors.old_password[0];
      if (apiErrors.new_password)          mapped.newPass = apiErrors.new_password[0];
      if (apiErrors.new_password_confirm)  mapped.confirm = apiErrors.new_password_confirm[0];
      if (Object.keys(mapped).length) {
        setErrors(mapped);
      } else {
        toast.error(data?.message || "Failed to update password.");
      }
    }
  };

  const inputFields = [
    { key: "current" as const, label: "Current password" },
    { key: "newPass" as const, label: "New password" },
    { key: "confirm" as const, label: "Confirm new password" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {inputFields.map(({ key, label }) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={key}>{label}</Label>
                <div className="relative">
                  <Input
                    id={key}
                    type={show[key] ? "text" : "password"}
                    value={fields[key]}
                    onChange={set(key)}
                    className={`pr-10 ${errors[key] ? "border-destructive focus-visible:ring-0" : ""}`}
                    autoComplete={key === "current" ? "current-password" : "new-password"}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => toggleShow(key)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={show[key] ? "Hide" : "Show"}
                  >
                    {show[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors[key] && (
                  <p className="text-xs text-destructive">{errors[key]}</p>
                )}
              </div>
            ))}

            {/* Password strength hints — shown when new password field has content */}
            {fields.newPass.length > 0 && (
              <ul className="space-y-1 rounded-lg bg-muted/50 px-4 py-3">
                {RULES.map(r => {
                  const ok = r.test(fields.newPass);
                  return (
                    <li key={r.label} className={`flex items-center gap-2 text-xs ${ok ? "text-green-600" : "text-muted-foreground"}`}>
                      {ok
                        ? <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                        : <XCircle className="w-3.5 h-3.5 shrink-0" />}
                      {r.label}
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={changePassword.isPending} className="min-w-[160px]">
                {changePassword.isPending
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating…</>
                  : "Update password"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Security;
