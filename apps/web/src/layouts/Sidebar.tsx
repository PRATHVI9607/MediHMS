import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  SquaresFour,
  Buildings,
  Stethoscope,
  Users,
  CalendarCheck,
  Terminal,
  Heartbeat,
  CaretLeft,
} from '@phosphor-icons/react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/', label: 'Dashboard', icon: SquaresFour, end: true },
  { to: '/departments', label: 'Departments', icon: Buildings },
  { to: '/doctors', label: 'Doctors', icon: Stethoscope },
  { to: '/patients', label: 'Patients', icon: Users },
  { to: '/appointments', label: 'Appointments', icon: CalendarCheck },
];

const POWER = [{ to: '/query', label: 'SQL Console', icon: Terminal }];

export function Sidebar() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggle = useAppStore((s) => s.toggleSidebar);

  const item = (n: (typeof NAV)[number]) => (
    <NavLink
      key={n.to}
      to={n.to}
      end={n.end}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-300 ease-spring',
          isActive
            ? 'bg-surface-elevated text-ink shadow-bezel'
            : 'text-ink-secondary hover:bg-surface-elevated/60 hover:text-ink'
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="nav-active"
              className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-pill bg-gradient-gold"
            />
          )}
          <n.icon size={20} weight={isActive ? 'fill' : 'regular'} className={isActive ? 'text-gold-dark' : ''} />
          {!collapsed && <span className="truncate">{n.label}</span>}
        </>
      )}
    </NavLink>
  );

  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-[100dvh] shrink-0 flex-col border-r border-line/70 bg-gradient-sidebar px-3 py-5 transition-[width] duration-300 ease-spring md:flex',
        collapsed ? 'w-[76px]' : 'w-[248px]'
      )}
    >
      <div className="mb-7 flex items-center gap-2.5 px-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gradient-gold shadow-gold">
          <Heartbeat size={20} weight="fill" className="text-ink" />
        </div>
        {!collapsed && (
          <div className="leading-tight">
            <p className="font-display text-xl font-bold text-ink">MediVault</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted">HMS</p>
          </div>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map(item)}
        <div className="my-3 px-3">
          <div className="h-px bg-line/70" />
        </div>
        {!collapsed && (
          <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-muted">
            Power Tools
          </p>
        )}
        {POWER.map(item)}
      </nav>

      <button
        onClick={toggle}
        className="mt-3 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-semibold text-ink-muted transition-colors hover:bg-surface-elevated/70 hover:text-ink"
      >
        <CaretLeft size={16} className={cn('transition-transform duration-300', collapsed && 'rotate-180')} />
        {!collapsed && 'Collapse'}
      </button>
    </aside>
  );
}
