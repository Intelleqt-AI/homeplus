import { useTraderProfile } from '@/hooks/useTraderProfile';
import { cn } from '@/lib/utils';

interface Props {
  name: string;
  /** Trader's user id; without it (e.g. a manually entered quote) the name is plain text. */
  traderId?: string | null;
  className?: string;
}

/** A trader's name that opens their full profile popup. Rendered as a span so it
 *  can sit inside clickable cards; it stops the click reaching the card. */
const TraderName = ({ name, traderId, className }: Props) => {
  const { openTraderProfile } = useTraderProfile();
  if (!traderId) return <span className={className}>{name}</span>;

  const open = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    e.preventDefault();
    openTraderProfile(traderId);
  };

  return (
    <span
      role="button"
      tabIndex={0}
      title="View tradesperson profile"
      onClick={open}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') open(e);
      }}
      className={cn('cursor-pointer underline-offset-2 hover:underline focus:underline focus:outline-none', className)}
    >
      {name}
    </span>
  );
};

export default TraderName;
