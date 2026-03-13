export type DashEvent = {
  id: string;
  title: string;
  date: Date | null;
  time?: string;
  type?: string;
  priority?: string;
  cost?: number | string;
  recurring?: string;
  complianceType?: string;
  isRequireTrade?: boolean;
  description?: string;
};

export type RawEvent = {
  id?: string;
  title?: string;
  date?: string | null;
  time?: string;
  eventType?: string;
  type?: string;
  priority?: string;
  cost?: number | string;
  recurring?: string;
  complianceType?: string;
  isRequireTrade?: boolean;
  description?: string;
};
