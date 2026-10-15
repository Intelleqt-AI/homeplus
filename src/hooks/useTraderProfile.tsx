import { createContext, useCallback, useContext, useState } from 'react';
import TraderProfileDialog from '@/components/trader/TraderProfileDialog';

interface TraderProfileContextType {
  openTraderProfile: (traderId: string) => void;
}

const TraderProfileContext = createContext<TraderProfileContextType | undefined>(undefined);

/** One trader-profile popup for the whole app; any trader name can open it. */
export const TraderProfileProvider = ({ children }: { children: React.ReactNode }) => {
  const [traderId, setTraderId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const openTraderProfile = useCallback((id: string) => {
    setTraderId(id);
    setOpen(true);
  }, []);

  return (
    <TraderProfileContext.Provider value={{ openTraderProfile }}>
      {children}
      <TraderProfileDialog traderId={traderId} open={open} onOpenChange={setOpen} />
    </TraderProfileContext.Provider>
  );
};

export const useTraderProfile = () => {
  const context = useContext(TraderProfileContext);
  if (context === undefined) throw new Error('useTraderProfile must be used within a TraderProfileProvider');
  return context;
};
