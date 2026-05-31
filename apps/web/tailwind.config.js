/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          base: 'var(--surface-base)',
          elevated: 'var(--surface-elevated)',
          overlay: 'var(--surface-overlay)',
        },
        gold: {
          DEFAULT: 'var(--gold-primary)',
          primary: 'var(--gold-primary)',
          light: 'var(--gold-light)',
          muted: 'var(--gold-muted)',
          dark: 'var(--gold-dark)',
        },
        sky: {
          DEFAULT: 'var(--sky-primary)',
          primary: 'var(--sky-primary)',
          light: 'var(--sky-light)',
          muted: 'var(--sky-muted)',
          dark: 'var(--sky-dark)',
        },
        ink: {
          DEFAULT: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          inverse: 'var(--text-inverse)',
        },
        line: {
          DEFAULT: 'var(--border-default)',
          gold: 'var(--border-gold)',
          sky: 'var(--border-sky)',
        },
        status: {
          success: 'var(--status-success)',
          warning: 'var(--status-warning)',
          error: 'var(--status-error)',
          info: 'var(--status-info)',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        md: '12px',
        lg: '18px',
        pill: '9999px',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        gold: 'var(--shadow-gold)',
        sky: 'var(--shadow-sky)',
        bezel: 'inset 0 1px 1px rgba(255,255,255,0.6), 0 1px 2px rgba(180,150,80,0.08)',
      },
      backgroundImage: {
        'gradient-hero': 'var(--gradient-hero)',
        'gradient-card': 'var(--gradient-card)',
        'gradient-gold': 'var(--gradient-gold)',
        'gradient-sidebar': 'var(--gradient-sidebar)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
        float: 'float 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
