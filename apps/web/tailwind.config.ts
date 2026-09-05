import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/lib/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: {
        '2xl': '1280px',
      },
    },
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          accessible: 'hsl(var(--primary-accessible))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
          accessible: 'hsl(var(--destructive-accessible))',
        },
        status: {
          success: {
            DEFAULT: 'hsl(var(--status-success-fg) / <alpha-value>)',
            bg: 'hsl(var(--status-success-bg) / <alpha-value>)',
            border: 'hsl(var(--status-success-border) / <alpha-value>)',
          },
          warning: {
            DEFAULT: 'hsl(var(--status-warning-fg) / <alpha-value>)',
            bg: 'hsl(var(--status-warning-bg) / <alpha-value>)',
            border: 'hsl(var(--status-warning-border) / <alpha-value>)',
          },
          danger: {
            DEFAULT: 'hsl(var(--status-danger-fg) / <alpha-value>)',
            bg: 'hsl(var(--status-danger-bg) / <alpha-value>)',
            border: 'hsl(var(--status-danger-border) / <alpha-value>)',
          },
          info: {
            DEFAULT: 'hsl(var(--status-info-fg) / <alpha-value>)',
            bg: 'hsl(var(--status-info-bg) / <alpha-value>)',
            border: 'hsl(var(--status-info-border) / <alpha-value>)',
          },
          accent: {
            DEFAULT: 'hsl(var(--status-accent-fg) / <alpha-value>)',
            bg: 'hsl(var(--status-accent-bg) / <alpha-value>)',
            border: 'hsl(var(--status-accent-border) / <alpha-value>)',
          },
          neutral: {
            DEFAULT: 'hsl(var(--status-neutral-fg) / <alpha-value>)',
            bg: 'hsl(var(--status-neutral-bg) / <alpha-value>)',
            border: 'hsl(var(--status-neutral-border) / <alpha-value>)',
          },
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      // One token, one scale. Every step derives from --radius (globals.css) so a
      // theme can soften or sharpen the whole product by changing a single value,
      // and nested surfaces stay concentric: card 14 > row 10 > control 8 > item 4,
      // i.e. each inner radius ≈ outer radius minus the padding between them.
      // Previously xl/2xl were Tailwind's fixed defaults and ignored the token.
      borderRadius: {
        sm: 'calc(var(--radius) - 6px)',       //  4px  menu items, tiny chips
        DEFAULT: 'calc(var(--radius) - 4px)',  //  6px  small inline elements
        md: 'calc(var(--radius) - 2px)',       //  8px  buttons, inputs, selects
        lg: 'var(--radius)',                   // 10px  tab lists, list rows, tiles
        xl: 'calc(var(--radius) + 4px)',       // 14px  cards, dialogs, toasts
        '2xl': 'calc(var(--radius) + 8px)',    // 18px  sheets, hero surfaces
        '3xl': 'calc(var(--radius) + 14px)',   // 24px  marketing blocks
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-down': {
          '0%': { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'fade-in-right': {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'slide-out-right': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'slide-in-bottom': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.05)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        'wiggle': {
          '0%, 100%': { transform: 'rotate(-1deg)' },
          '50%': { transform: 'rotate(1deg)' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.18s ease-out',
        'fade-in-up': 'fade-in-up 0.22s ease-out',
        'fade-in-down': 'fade-in-down 0.2s ease-out',
        'fade-in-left': 'fade-in-left 0.2s ease-out',
        'fade-in-right': 'fade-in-right 0.2s ease-out',
        'scale-in': 'scale-in 0.15s ease-out',
        'slide-in-right': 'slide-in-right 0.2s ease-out',
        'slide-out-right': 'slide-out-right 0.2s ease-out',
        'slide-in-bottom': 'slide-in-bottom 0.2s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite',
        'wiggle': 'wiggle 0.3s ease-in-out',
        'spin-slow': 'spin-slow 8s linear infinite',
      },
      boxShadow: {
        'glow-sm': '0 0 0 1px rgba(99,102,241,0.25), 0 8px 32px rgba(0,0,0,0.35)',
        'glow-md': '0 0 0 1px rgba(99,102,241,0.35), 0 16px 48px rgba(0,0,0,0.45)',
      },
      backgroundImage: {
        'hero-radial':
          'radial-gradient(circle at 10% 20%, rgba(99,102,241,0.28), transparent 55%), radial-gradient(circle at 80% 0%, rgba(236,72,153,0.22), transparent 40%)',
        'glass-sheen':
          'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))',
      },
      // Hard legibility floor. Nothing in the product is set below 11px; this is the
      // same floor .bilingual-secondary uses. Replaces ~550 arbitrary text-[Npx]
      // values (8px–13px) that were scattered through the codebase.
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }], // 11px — counters, badges, micro-labels
      },
      fontFamily: {
        // Outer var = per-tenant override written by TenantContext.applyBrandingFonts;
        // inner var = self-hosted brand font injected by next/font in app/layout.tsx.
        // The tenant vars were previously written but never read, so custom
        // tenant fonts silently had no effect.
        sans: ['var(--font-sans, var(--font-inter))', 'system-ui', 'sans-serif'],
        display: ['var(--font-heading, var(--font-display-brand))', 'var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [animate],
};

export default config;
