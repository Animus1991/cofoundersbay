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
      // theme can soften or sharpen the whole product by changing a single value.
      // Concentric nesting: card 20 > control 16 > row/item 12 > chip 10,
      // so chrome reads as one family and inner corners never bulge past the card.
      borderRadius: {
        sm: 'calc(var(--radius) - 6px)',       //  6px  heat-map cells, hairline wells
        DEFAULT: 'calc(var(--radius) - 4px)',  //  8px  tiny inline marks
        md: 'calc(var(--radius) - 2px)',       // 10px  chips, checkbox
        lg: 'var(--radius)',                   // 12px  menu items, tab triggers, tiles
        xl: 'calc(var(--radius) + 4px)',       // 16px  buttons, fields, selects, menus
        '2xl': 'calc(var(--radius) + 8px)',    // 20px  cards, dialogs, sheets
        '3xl': 'calc(var(--radius) + 14px)',   // 26px  marketing blocks
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
      // The elevation ladder, rebuilt to sit next to the softened corners.
      //
      // Tailwind's defaults are pure black at a tight blur -- `shadow-sm` is
      // `0 1px 2px rgb(0 0 0 / 0.05)`, which on the 641 cards that carry
      // `border + bg-card + shadow-sm` draws a second hard line a pixel below
      // the border, at exactly the place the corner turns. Two hairlines
      // tracing the same corner is what made those cards read as busy; it is
      // also the one thing that would have survived the radius change and
      // kept the corners looking stamped.
      //
      // Each step here is a contact shadow plus an ambient one, tinted with
      // `--shadow-color` (the ground's own hue -- a neutral black over a
      // tinted surface reads as grey haze) and scaled by `--shadow-strength`,
      // which is where the dark themes get elevation that is visible at all
      // without restating the ladder five times.
      boxShadow: {
        sm: '0 1px 2px -1px hsl(var(--shadow-color) / calc(var(--shadow-strength) * 6%)), 0 2px 6px -2px hsl(var(--shadow-color) / calc(var(--shadow-strength) * 5%))',
        DEFAULT:
          '0 1px 3px -1px hsl(var(--shadow-color) / calc(var(--shadow-strength) * 7%)), 0 4px 10px -3px hsl(var(--shadow-color) / calc(var(--shadow-strength) * 6%))',
        md: '0 2px 6px -2px hsl(var(--shadow-color) / calc(var(--shadow-strength) * 8%)), 0 8px 18px -6px hsl(var(--shadow-color) / calc(var(--shadow-strength) * 8%))',
        lg: '0 4px 10px -4px hsl(var(--shadow-color) / calc(var(--shadow-strength) * 9%)), 0 14px 30px -10px hsl(var(--shadow-color) / calc(var(--shadow-strength) * 10%))',
        xl: '0 8px 18px -8px hsl(var(--shadow-color) / calc(var(--shadow-strength) * 10%)), 0 24px 48px -16px hsl(var(--shadow-color) / calc(var(--shadow-strength) * 13%))',
        '2xl':
          '0 16px 32px -12px hsl(var(--shadow-color) / calc(var(--shadow-strength) * 12%)), 0 40px 72px -24px hsl(var(--shadow-color) / calc(var(--shadow-strength) * 18%))',
        inner: 'inset 0 1px 2px 0 hsl(var(--shadow-color) / calc(var(--shadow-strength) * 6%))',
        none: 'none',
        'glow-sm': '0 0 0 1px rgba(99,102,241,0.25), 0 8px 32px rgba(0,0,0,0.35)',
        'glow-md': '0 0 0 1px rgba(99,102,241,0.35), 0 16px 48px rgba(0,0,0,0.45)',
      },
      backgroundImage: {
        'hero-radial':
          'radial-gradient(ellipse 80% 50% at 50% -5%, hsl(var(--primary) / 0.10) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 85% 0%, hsl(var(--accent) / 0.08) 0%, transparent 55%)',
        'glass-sheen':
          'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))',
      },
      // Cursor.com steps at a 16px root. globals.css restates the same pixels
      // against the 82% desktop root so computed sizes match on every viewport.
      fontSize: {
        '2xs': ['0.765075rem', { lineHeight: '1rem' }], // 12.24px — captions, badges
        xs: ['0.82883125rem', { lineHeight: '1.25rem' }], // 13.26px
        sm: ['0.8925875rem', { lineHeight: '1.3125rem' }], // 14.28px
        base: ['1.0201rem', { lineHeight: '1.5rem' }], // 16.32px
        lg: ['1.125rem', { lineHeight: '1.625rem' }], // 18px
        xl: ['1.25rem', { lineHeight: '1.75rem' }], // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }], // 24px
        '3xl': ['1.625rem', { lineHeight: '2.03125rem' }], // 26px
        '4xl': ['2.25rem', { lineHeight: '2.7rem' }], // 36px
        '5xl': ['3rem', { lineHeight: '1' }], // 48px
        '6xl': ['3.75rem', { lineHeight: '1' }], // 60px
        '7xl': ['4.5rem', { lineHeight: '1' }], // 72px
      },
      fontFamily: {
        // Outer var = per-tenant override written by TenantContext.applyBrandingFonts;
        // inner var = self-hosted brand font injected by next/font in app/layout.tsx.
        // The tenant vars were previously written but never read, so custom
        // tenant fonts silently had no effect.
        sans: ['var(--font-sans, var(--font-inter))', 'system-ui', 'sans-serif'],
        display: ['var(--font-heading, var(--font-display-brand))', 'var(--font-inter)', 'system-ui', 'sans-serif'],
        co: ['var(--font-co-mark)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
        // Self-hosted by next/font in app/layout.tsx. The fallbacks matter: a
        // missing --font-mono used to land on the device's generic monospace,
        // which differs on every platform.
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      screens: {
        // Tall-and-narrow breakpoint used by the split-pane layouts.
        xs: '480px',
      },
    },
  },
  plugins: [animate],
};

export default config;
