import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heartbeat, ArrowRight, EnvelopeSimple, Lock } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { useLogin } from '@/hooks/useAuth';
import { toast } from '@/components/ui/Toaster';

const DEMO = [
  { role: 'Admin', email: 'admin@medivault.io' },
  { role: 'Doctor', email: 'doctor@medivault.io' },
  { role: 'Viewer', email: 'viewer@medivault.io' },
];

export function Login() {
  const [email, setEmail] = useState('admin@medivault.io');
  const [password, setPassword] = useState('medivault');
  const login = useLogin();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate(
      { email, password },
      { onError: (err: any) => toast.error(err.message || 'Login failed') }
    );
  };

  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-2">
      {/* Left — brand hero */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-hero p-12 lg:flex">
        <div className="pointer-events-none absolute -right-20 top-1/4 h-72 w-72 rounded-full bg-white/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-10 h-64 w-64 rounded-full bg-sky-light/40 blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative flex items-center gap-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-white/70 shadow-gold backdrop-blur">
            <Heartbeat size={24} weight="fill" className="text-gold-dark" />
          </div>
          <div>
            <p className="font-display text-2xl font-bold text-ink">MediVault</p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-secondary">
              Hospital Management
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="relative"
        >
          <span className="mb-4 inline-block rounded-pill border border-white/40 bg-white/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-secondary backdrop-blur">
            Precision Care · Zero Chaos
          </span>
          <h1 className="max-w-md font-display text-6xl font-bold leading-[1.02] text-ink text-balance">
            The calm command center for your hospital data.
          </h1>
          <p className="mt-5 max-w-sm text-base text-ink-secondary">
            Departments, doctors, patients, and appointments — unified in one luxuriously quiet
            dashboard with a power-user SQL console.
          </p>
        </motion.div>

        <p className="relative text-xs text-ink-muted">© 2026 MediVault HMS · RVCE CSE</p>
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-sm"
        >
          <div className="mb-8 lg:hidden">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-md bg-gradient-gold shadow-gold">
              <Heartbeat size={22} weight="fill" className="text-ink" />
            </div>
            <p className="font-display text-2xl font-bold text-ink">MediVault HMS</p>
          </div>

          <h2 className="font-display text-4xl font-bold text-ink">Welcome back</h2>
          <p className="mb-7 mt-1 text-sm text-ink-muted">Sign in to access your dashboard.</p>

          <form onSubmit={submit} className="space-y-4">
            <div className="relative">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@medivault.io"
                required
                className="pl-10"
              />
              <EnvelopeSimple size={18} className="absolute left-3 top-[2.35rem] text-ink-muted" />
            </div>
            <div className="relative">
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="pl-10"
              />
              <Lock size={18} className="absolute left-3 top-[2.35rem] text-ink-muted" />
            </div>

            <Button
              type="submit"
              size="lg"
              loading={login.isPending}
              className="w-full"
              trailingIcon={<ArrowRight size={16} weight="bold" />}
            >
              Sign in
            </Button>
          </form>

          <div className="mt-8 rounded-md border border-line bg-surface-overlay/50 p-4">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-muted">
              Demo accounts · password “medivault”
            </p>
            <div className="flex flex-wrap gap-2">
              {DEMO.map((d) => (
                <button
                  key={d.email}
                  type="button"
                  onClick={() => {
                    setEmail(d.email);
                    setPassword('medivault');
                  }}
                  className="rounded-pill border border-line bg-surface-elevated px-3 py-1 text-xs font-semibold text-ink-secondary transition-colors hover:border-gold hover:text-gold-dark"
                >
                  {d.role}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
