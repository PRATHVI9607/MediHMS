import { NavLink } from 'react-router-dom';
import { SquaresFour, Buildings, Stethoscope, Users, CalendarCheck, Terminal } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/', label: 'Home', icon: SquaresFour, end: true },
  { to: '/departments', label: 'Depts', icon: Buildings },
  { to: '/doctors', label: 'Doctors', icon: Stethoscope },
  { to: '/patients', label: 'Patients', icon: Users },
  { to: '/appointments', label: 'Appts', icon: CalendarCheck },
  { to: '/query', label: 'SQL', icon: Terminal },
];

export function MobileNav() {
  return (
    <nav className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-pill border border-line/70 bg-surface-elevated/90 px-2 py-2 shadow-md backdrop-blur-xl md:hidden">
      {NAV.map((n) => (
        <NavLink
          key={n.to}
          to={n.to}
          end={n.end}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-0.5 rounded-pill px-3 py-1.5 text-[10px] font-semibold transition-colors',
              isActive ? 'bg-gradient-gold text-ink' : 'text-ink-muted'
            )
          }
        >
          <n.icon size={20} weight="fill" />
          {n.label}
        </NavLink>
      ))}
    </nav>
  );
}
