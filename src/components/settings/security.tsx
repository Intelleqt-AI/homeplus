import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
  Info,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  MonitorSmartphone,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { usePost } from "@/hooks/usePost";
import useDelete from "@/hooks/useDelete";
import { useAuth } from "@/hooks/useAuth";
import { DeleteAccountDialog, type DeleteAccountPayload } from "./DeleteAccountDialog";
import { RecentSignInsCard, SESSIONS_URL, SignedInDevicesCard, useSessions } from "./SignedInDevices";

type Fields = { current: string; newPass: string; confirm: string };
type Errors = Partial<Record<keyof Fields, string>>;

const RULES = [
  { label: "8+ characters", test: (p: string) => p.length >= 8 },
  { label: "A letter", test: (p: string) => /[a-zA-Z]/.test(p) },
  { label: "A number", test: (p: string) => /\d/.test(p) },
];

function validate(f: Fields): Errors {
  const e: Errors = {};
  if (!f.current.trim()) e.current = "Current password is required.";
  if (!f.newPass) e.newPass = "New password is required.";
  else if (f.newPass.length < 8) e.newPass = "Must be at least 8 characters.";
  else if (!/[a-zA-Z]/.test(f.newPass)) e.newPass = "Must include a letter.";
  else if (!/\d/.test(f.newPass)) e.newPass = "Must include a number.";
  if (!f.confirm) e.confirm = "Please confirm your new password.";
  else if (f.confirm !== f.newPass) e.confirm = "Passwords do not match.";
  return e;
}

/** 1–4: length and variety, capped for the obvious ones. */
const STRENGTH = [
  { label: "Weak", bar: "bg-destructive", text: "text-destructive" },
  { label: "Fair", bar: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" },
  { label: "Good", bar: "bg-lime-500", text: "text-lime-700 dark:text-lime-400" },
  { label: "Strong", bar: "bg-green-500", text: "text-green-700 dark:text-green-400" },
];
function strength(p: string): number {
  let s = 0;
  if (p.length >= 8) s++;
  if (p.length >= 12) s++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
  if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) s++;
  if (/^(password|qwerty|123456|letmein|welcome)/i.test(p)) s = Math.min(s, 1);
  return Math.max(1, s);
}

const StrengthMeter = ({ value }: { value: string }) => {
  const score = strength(value);
  const level = STRENGTH[score - 1];
  return (
    <div className="space-y-2" data-strength={level.label}>
      <div className="flex items-center gap-3">
        <div className="grid flex-1 grid-cols-4 gap-1.5" aria-hidden>
          {STRENGTH.map((_, i) => (
            <span key={i} className={cn("h-1.5 rounded-full transition-colors", i < score ? level.bar : "bg-muted")} />
          ))}
        </div>
        <span className={cn("text-xs font-medium w-12 text-right", level.text)}>{level.label}</span>
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1">
        {RULES.map(r => {
          const ok = r.test(value);
          return (
            <li key={r.label} className={cn("flex items-center gap-1.5 text-xs", ok ? "text-green-700 dark:text-green-400" : "text-muted-foreground")}>
              {ok ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <Circle className="w-3.5 h-3.5 shrink-0" />}
              {r.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const OverviewTile = ({
  icon: Icon,
  label,
  value,
  good,
}: {
  icon: typeof Mail;
  label: string;
  value: React.ReactNode;
  good?: boolean;
}) => (
  <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3 min-w-0">
    <div className={cn(
      "h-9 w-9 shrink-0 rounded-full flex items-center justify-center",
      good ? "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300" : "bg-muted text-muted-foreground",
    )}>
      <Icon className="h-4 w-4" />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium truncate">{value}</p>
    </div>
  </div>
);

const PROVIDER_LABEL: Record<string, string> = { google: "Google", apple: "Apple" };

const Security = () => {
  const [fields, setFields] = useState<Fields>({ current: "", newPass: "", confirm: "" });
  const [show, setShow] = useState({ current: false, newPass: false, confirm: false });
  const [errors, setErrors] = useState<Errors>({});
  const [deleteOpen, setDeleteOpen] = useState(false);

  const qc = useQueryClient();
  const changePassword = usePost();
  const deleteAccount = useDelete();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const sessions = useSessions();
  // Google/Apple-only accounts have no password (older API responses lack the field → assume one).
  const hasPassword = user?._raw?.has_password !== false;
  const providers = (user?._raw?.auth_providers as string[] | undefined) ?? [];
  const providerName = providers.includes("apple") && !providers.includes("google") ? "Apple" : "Google";
  const emailVerified = user?._raw?.email_verified !== false;
  const signInWith = [...(hasPassword ? ["Password"] : []), ...providers.map(p => PROVIDER_LABEL[p] ?? p)];
  const activeCount = sessions.data?.data?.active?.length;

  const handleDeleteAccount = async (payload: DeleteAccountPayload) => {
    await deleteAccount.mutateAsync({
      url: "/api/v1/auth/delete-account/",
      data: payload,
    });
    await signOut();
    toast.success("Your account has been deleted.");
    navigate("/login", { replace: true });
  };

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
      const res = (await changePassword.mutateAsync({
        url: "/api/v1/auth/change-password/",
        data: {
          old_password: fields.current,
          new_password: fields.newPass,
          new_password_confirm: fields.confirm,
        },
      })) as { data?: { signed_out_devices?: number } } | undefined;
      const n = res?.data?.signed_out_devices ?? 0;
      toast.success(n > 0
        ? `Password updated. Signed out of ${n} other device${n === 1 ? "" : "s"}.`
        : "Password updated.");
      setFields({ current: "", newPass: "", confirm: "" });
      setErrors({});
      qc.invalidateQueries({ queryKey: [SESSIONS_URL] });
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } })?.response?.data;
      const apiErrors = data?.errors ?? {};
      const mapped: Errors = {};
      if (apiErrors.old_password) mapped.current = apiErrors.old_password[0];
      if (apiErrors.new_password) mapped.newPass = apiErrors.new_password[0];
      if (apiErrors.new_password_confirm) mapped.confirm = apiErrors.new_password_confirm[0];
      if (Object.keys(mapped).length) {
        setErrors(mapped);
      } else {
        toast.error(data?.message || "Failed to update password.");
      }
    }
  };

  const passwordInput = (key: keyof Fields, label: string) => (
    <div key={key} className="space-y-1.5">
      <Label htmlFor={key}>{label}</Label>
      <div className="relative">
        <Input
          id={key}
          type={show[key] ? "text" : "password"}
          value={fields[key]}
          onChange={set(key)}
          className={cn("pr-10", errors[key] && "border-destructive focus-visible:ring-0")}
          autoComplete={key === "current" ? "current-password" : "new-password"}
          aria-invalid={!!errors[key]}
        />
        <button
          type="button"
          onClick={() => toggleShow(key)}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
          aria-label={show[key] ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        >
          {show[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {errors[key] && <p className="text-xs text-destructive">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card data-section="overview">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <ShieldCheck className="w-5 h-5 shrink-0 text-accent" /> Account security
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Your sign-in details and the devices that can reach your account.
          </p>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <OverviewTile
            icon={emailVerified ? BadgeCheck : Mail}
            label="Email"
            value={emailVerified ? "Verified" : "Not verified"}
            good={emailVerified}
          />
          <OverviewTile icon={KeyRound} label="Sign in with" value={signInWith.join(" · ") || "Password"} good />
          <OverviewTile
            icon={MonitorSmartphone}
            label="Signed-in devices"
            value={activeCount == null ? "…" : `${activeCount} device${activeCount === 1 ? "" : "s"}`}
            good={activeCount === 1}
          />
        </CardContent>
      </Card>

      {/* Password */}
      <Card data-section="password">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <KeyRound className="w-5 h-5 shrink-0 text-accent" /> Password
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {hasPassword ? "Use a password you don't use anywhere else." : `You sign in with ${providerName}.`}
          </p>
        </CardHeader>
        <CardContent>
          {!hasPassword ? (
            <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-4">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Your account has no password, so there's nothing to change here. To also sign in with your email and a
                password, sign out and use{" "}
                <Link to="/forgot-password" className="font-medium text-foreground underline underline-offset-2">
                  Forgot password?
                </Link>{" "}
                to create one.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {passwordInput("current", "Current password")}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {passwordInput("newPass", "New password")}
                {passwordInput("confirm", "Confirm new password")}
              </div>
              {fields.newPass.length > 0 && <StrengthMeter value={fields.newPass} />}
              <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 border-t pt-4">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  Changing it signs you out on your other devices.
                </p>
                <Button type="submit" disabled={changePassword.isPending} className="min-w-[160px]">
                  {changePassword.isPending
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating…</>
                    : "Update password"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <SignedInDevicesCard />
      <RecentSignInsCard />

      {/* Delete account */}
      <Card className="border-destructive/30" data-section="danger">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-destructive">
            <AlertTriangle className="w-5 h-5 shrink-0" /> Delete account
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            This permanently removes your account and can't be undone.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <ul className="space-y-1 text-sm text-muted-foreground list-disc pl-5">
            <li>Your homes, documents, reminders and Home MOT</li>
            <li>Jobs, quotes and messages with tradespeople</li>
            <li>Access to homes shared with you</li>
          </ul>
          <Button type="button" variant="destructive" className="shrink-0" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="w-4 h-4 mr-1.5" /> Delete account
          </Button>
        </CardContent>
      </Card>

      <DeleteAccountDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteAccount}
        hasPassword={hasPassword}
        providerName={providerName}
      />
    </div>
  );
};

export default Security;
