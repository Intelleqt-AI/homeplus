import type { DashEvent, RawEvent } from './dashboardTypes';

export const mapToDashEvents = (rows: RawEvent[] = []): DashEvent[] =>
  rows.map(r => ({
    id: r.id as string,
    title: r.title || 'Untitled',
    date: r.date ? new Date(r.date) : null,
    time: r.time || '',
    type: r.eventType || r.type || 'maintenance',
    priority: r.priority || 'medium',
    cost: typeof r.cost === 'number' ? r.cost : r.cost ? Number(r.cost) : 0,
    recurring: r.recurring || 'never',
    complianceType: r.complianceType || 'none',
    isRequireTrade: !!r.isRequireTrade,
    description: r.description || '',
  }));

export const computeStatus = (d: Date | null) => {
  if (!d) return 'unscheduled';
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'confirmed';
  if (d < now) return 'overdue';
  const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diff <= 7) return 'due-week';
  return 'future';
};

export const getDotColor = (status: string) => {
  switch (status) {
    case 'overdue':
      return 'bg-red-500';
    case 'scheduled':
    case 'confirmed':
      return 'bg-green-500';
    case 'due-week':
    case 'action_required':
      return 'bg-yellow-500';
    case 'future':
      return 'bg-gray-400';
    default:
      return '';
  }
};

/** Sample events for calendar display when no API data exists */
export const sampleCalendarEvents: DashEvent[] = [
  { id: 'sample-1', title: 'Car tax', date: new Date(2026, 1, 3), type: 'Vehicle' },
  { id: 'sample-2', title: 'Car MOT', date: new Date(2026, 1, 6), type: 'Vehicle' },
  { id: 'sample-3', title: 'Black bin day', date: new Date(2026, 1, 10), type: 'Household' },
  { id: 'sample-4', title: 'Boiler servicing', date: new Date(2026, 1, 19), type: 'Maintenance' },
  { id: 'sample-5', title: "Sarah's Birthday", date: new Date(2026, 1, 27), type: 'Personal' },
  { id: 'sample-6', title: 'Garden maintenance', date: new Date(2026, 2, 10), type: 'Maintenance' },
];

/** Sample tasks for upcoming sidebar when no API data exists */
export const sampleTasks = [
  { id: 'sample-1', title: 'Car tax', date: new Date(2026, 1, 3), eventType: 'Vehicle' },
  { id: 'sample-2', title: 'Car MOT', date: new Date(2026, 1, 6), eventType: 'Vehicle' },
  { id: 'sample-3', title: 'Black bin day', date: new Date(2026, 1, 10), eventType: 'Household' },
  { id: 'sample-4', title: 'Boiler servicing', date: new Date(2026, 1, 17), eventType: 'Maintenance' },
];
