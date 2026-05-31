import { Link } from 'react-router-dom';
import { Compass, House } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button';

export function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-lg bg-surface-overlay text-gold shadow-bezel">
        <Compass size={38} />
      </div>
      <p className="font-display text-7xl font-bold text-ink">404</p>
      <h2 className="mt-1 font-display text-2xl text-ink">This ward doesn’t exist</h2>
      <p className="mt-1 max-w-sm text-sm text-ink-muted">
        The page you’re looking for may have been moved or discharged.
      </p>
      <Link to="/" className="mt-6">
        <Button icon={<House size={16} weight="fill" />}>Back to Dashboard</Button>
      </Link>
    </div>
  );
}
