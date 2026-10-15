import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { History, Loader2, LogOut, Monitor, MonitorSmartphone, Smartphone, Tablet } from 'lucide-react';
import useFetch from '@/hooks/useFetch';
import { usePost } from '@/hooks/usePost';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';

// GET /api/v1/auth/sessions/ — devices signed in now and the recent sign-ins.
export type DeviceSession = {
  id: string;
  label: string;
  browser: string;
  os: string;
  kind: 'computer' | 'phone' | 'tablet' | 'app';
  ip: string | null;
  method: string;
  method_label: string;
  created_at: string;
  last_seen_at: string;
  ended_at: string | null;
  status: 'active' | 'signed_out' | 'expired';
  is_current: boolean;
};
export type SessionsPayload = { current_id: string | null; active: DeviceSession[]; history: DeviceSession[] };

export const SESSIONS_URL = '/api/v1/auth/sessions/';

export const useSessions = () => useFetch<{ data?: SessionsPayload }>(SESSIONS_URL);

const KIND_ICON = { computer: Monitor, phone: Smartphone, tablet: Tablet, app: Smartphone } as const;

/** Used in the last 10 minutes counts as "now" (the server notes use every ~10 min). */
const isActiveNow = (iso: string) => Date.now() - new Date(iso).getTime() < 10 * 60 * 1000;
const ago = (iso: string) => formatDistanceToNowStrict(new Date(iso), { addSuffix: true });
const day = (iso: string) => format(new Date(iso), 'd MMM yyyy');
const dayTime = (iso: string) => format(new Date(iso), "d MMM yyyy, HH:mm");

const DeviceIcon = ({ kind, current }: { kind: DeviceSession['kind']; current?: boolean }) => {
  const Icon = KIND_ICON[kind] ?? Monitor;
  return (
    <div
      className={cn(
        'h-10 w-10 shrink-0 rounded-full flex items-center justify-center',
        current ? 'bg-accent/15 text-foreground' : 'bg-muted text-muted-foreground',
      )}
    >
      <Icon className="h-[18px] w-[18px]" />
    </div>
  );
};

const STATUS_CHIP: Record<DeviceSession['status'], { label: string; className: string }> = {
  active: { label: 'Active', className: 'border-green-300 text-green-700 bg-green-50 dark:bg-green-500/10 dark:text-green-300 dark:border-green-500/30' },
  signed_out: { label: 'Signed out', className: 'border-border text-muted-foreground bg-muted/60' },
  expired: { label: 'Expired', className: 'border-border text-muted-foreground bg-muted/60' },
};

const apiMessage = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

// ─── Where you're signed in ───────────────────────────────────────────────────

export function SignedInDevicesCard() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useSessions();
  const payload = data?.data;
  const active = payload?.active ?? [];
  const others = active.filter(s => !s.is_current);
  const revoke = usePost();
  const revokeOthers = usePost();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);

  const refresh = () => qc.invalidateQueries({ queryKey: [SESSIONS_URL] });

  const signOutOne = async (s: DeviceSession) => {
    setBusyId(s.id);
    try {
      await revoke.mutateAsync({ url: `${SESSIONS_URL}${s.id}/revoke/` });
      toast.success(`Signed out of ${s.label}.`);
      refresh();
    } catch (err) {
      toast.error(apiMessage(err, 'Could not sign out that device.'));
    } finally {
      setBusyId(null);
    }
  };

  const signOutOthers = async () => {
    try {
      const res = (await revokeOthers.mutateAsync({ url: `${SESSIONS_URL}revoke-others/` })) as
        | { data?: { signed_out_devices?: number } }
        | undefined;
      const n = res?.data?.signed_out_devices ?? others.length;
      toast.success(n === 1 ? 'Signed out of 1 other device.' : `Signed out of ${n} other devices.`);
      setConfirmAll(false);
      refresh();
    } catch (err) {
      toast.error(apiMessage(err, 'Could not sign out your other devices.'));
    }
  };

  return (
    <Card data-section="devices">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <MonitorSmartphone className="w-5 h-5 shrink-0 text-accent" /> Where you're signed in
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Devices signed in to your account right now. Sign out any you don't recognise, then change your password.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : isError || !payload ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
            <p className="text-sm text-destructive">Couldn't load your devices.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
          </div>
        ) : (
          <>
            <ul className="divide-y">
              {active.map(s => (
                <li key={s.id} data-device={s.label} className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <DeviceIcon kind={s.kind} current={s.is_current} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium truncate max-w-full">{s.label}</p>
                        {s.is_current && (
                          <span className="rounded-full border border-green-300 bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700 dark:bg-green-500/10 dark:text-green-300 dark:border-green-500/30">
                            This device
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-1.5">
                        {s.is_current || isActiveNow(s.last_seen_at) ? (
                          <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Active now
                          </span>
                        ) : (
                          <span>Last active {ago(s.last_seen_at)}</span>
                        )}
                        <span aria-hidden>·</span>
                        <span>Signed in {day(s.created_at)}</span>
                        {s.ip && (
                          <>
                            <span aria-hidden>·</span>
                            <span className="font-mono">{s.ip}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  {!s.is_current && (
                    <div className="pl-[52px] sm:pl-0 sm:shrink-0">
                      <Button variant="outline" size="sm" onClick={() => signOutOne(s)} disabled={busyId === s.id}>
                        {busyId === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <LogOut className="w-3.5 h-3.5 mr-1.5" />}
                        Sign out
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {others.length === 0
                  ? "You're only signed in on this device."
                  : `${others.length} other device${others.length === 1 ? '' : 's'} signed in.`}
              </p>
              {others.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
                  onClick={() => setConfirmAll(true)}
                >
                  <LogOut className="w-3.5 h-3.5 mr-1.5" /> Sign out of all other devices
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>

      <AlertDialog open={confirmAll} onOpenChange={open => !open && setConfirmAll(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out of all other devices?</AlertDialogTitle>
            <AlertDialogDescription>
              {others.length === 1 ? '1 other device' : `${others.length} other devices`} will need to sign in again.
              You'll stay signed in here.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-black hover:bg-gray-200" disabled={revokeOthers.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={e => {
                e.preventDefault();
                signOutOthers();
              }}
              disabled={revokeOthers.isPending}
              className="bg-destructive border-none text-destructive-foreground hover:bg-destructive/90"
            >
              {revokeOthers.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
              Sign out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

// ─── Recent sign-ins ──────────────────────────────────────────────────────────

const SHOWN = 5;

export function RecentSignInsCard() {
  const { data, isLoading } = useSessions();
  const history = data?.data?.history ?? [];
  const [all, setAll] = useState(false);
  if (isLoading || history.length === 0) return null;
  const rows = all ? history : history.slice(0, SHOWN);

  return (
    <Card data-section="history">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <History className="w-5 h-5 shrink-0 text-accent" /> Recent sign-ins
        </CardTitle>
        <p className="text-sm text-muted-foreground">Every time your account was signed in to, newest first.</p>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {rows.map(s => {
            const chip = STATUS_CHIP[s.status] ?? STATUS_CHIP.expired;
            return (
              <li key={s.id} className="py-3 first:pt-0 last:pb-0 flex items-center gap-3 min-w-0">
                <DeviceIcon kind={s.kind} current={s.is_current} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {s.label}
                    {s.is_current && <span className="font-normal text-muted-foreground"> (this device)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {dayTime(s.created_at)} · {s.method_label}
                    {s.ip ? <> · <span className="font-mono">{s.ip}</span></> : null}
                  </p>
                </div>
                <span className={cn('shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium', chip.className)}>{chip.label}</span>
              </li>
            );
          })}
        </ul>
        {history.length > SHOWN && (
          <div className="mt-3 flex justify-center">
            <Button variant="ghost" size="sm" onClick={() => setAll(v => !v)}>
              {all ? 'Show less' : `Show all (${history.length})`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
