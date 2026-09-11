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
          // Text-on-surface variant. `bg-primary` and `text-primary` need
          // opposite adjustments to clear 4.5:1, so brand text uses this.
          emphasis: 'hsl(var(--primary-emphasis))',
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
          // Text-on-surface variant, for the same reason as primary.emphasis:
          // the step that carries white text is too dark to BE text.
          emphasis: 'hsl(var(--destructive-emphasis))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      // The full radius scale, not a three-key patch on top of Tailwind's
      // defaults. Overriding only lg/md/sm left `rounded`, `rounded-xl`,
      // `rounded-2xl` and `rounded-3xl` on Tailwind's rem values, which the
      // 82% desktop root shrank while the px-based lg/md/sm stayed put -- so
      // the same utility drew a different curve depending on which half of
      // the scale it came from. Every step now resolves from one ladder in
      // src/app/globals.css, so a class name means the same corner
      // everywhere, and moving the ladder moves the whole product at once.
      //
      // Each step names a component family rather than an abstract size:
      //   sm  -> checkbox, heat-map cell        (5px)
      //   DEF -> chip, tag, anything under 24px (7px)
      //   md  -> button, input, select, menu    (9px)
      //   lg  -> list row, small panel, tab     (12px)
      //   xl  -> card, dialog, popover, section (16px)
      //   2xl -> sheet, hero block              (22px)
      //   3xl -> marketing surface              (30px)
      borderRadius: {
        none: '0px',
        sm: 'var(--radius-xs)',
        DEFAULT: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        '3xl': 'var(--radius-3xl)',
        full: '9999px',
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
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-space-grotesk)', 'var(--font-sora)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // 11px step — the documented home for the 548 arbitrary `text-[10px]` /
        // `text-[11px]` values scattered through the app.
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],

        // The top of the scale, pulled in 2.5%. Tailwind's defaults run
        // 30/36/48/60/72px against a 14px body — 2.14x up to 5.14x — which
        // reads as a gap rather than a progression next to the 11-16px steps
        // that carry 96% of the product's text. Line heights move by the same
        // factor so the leading ratio is unchanged; 5xl and up already use a
        // unitless 1 and scale themselves. Nothing below 30px is touched.
        '3xl': ['1.828rem', { lineHeight: '2.194rem' }],  // 30   -> 29.25px
        '4xl': ['2.194rem', { lineHeight: '2.438rem' }],  // 36   -> 35.1px
        '5xl': ['2.925rem', { lineHeight: '1' }],         // 48   -> 46.8px
        '6xl': ['3.656rem', { lineHeight: '1' }],         // 60   -> 58.5px
        '7xl': ['4.388rem', { lineHeight: '1' }],         // 72   -> 70.2px
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
