/**
 * Layout configuration for wider, more spacious UI at 100% zoom
 * Inspired by modern platforms like LinkedIn, Alliance theme
 */

export const layoutConfig = {
  // Container widths (20% wider than standard)
  maxWidth: {
    sm: '720px',    // Mobile landscape
    md: '960px',    // Tablet
    lg: '1320px',   // Desktop (was 1100px)
    xl: '1560px',   // Large desktop (was 1300px)
    '2xl': '1800px', // Ultra-wide (was 1500px)
  },
  
  // Content area widths
  content: {
    narrow: '800px',   // For focused content (articles, forms)
    standard: '1320px', // Standard content width
    wide: '1560px',    // Wide layouts (dashboards, tables)
    full: '100%',      // Full width
  },
  
  // Sidebar widths
  sidebar: {
    collapsed: '80px',
    expanded: '280px',  // Wider sidebar (was 240px)
  },
  
  // Navigation heights
  nav: {
    top: '72px',       // Taller top nav (was 64px)
    mobile: '64px',
  },
  
  // Spacing scale (more generous)
  spacing: {
    xs: '0.5rem',    // 8px
    sm: '0.75rem',   // 12px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
    '4xl': '6rem',   // 96px
  },
  
  // Card dimensions
  card: {
    minHeight: '120px',
    padding: {
      sm: '1rem',
      md: '1.5rem',
      lg: '2rem',
    },
    gap: '1.5rem', // Gap between cards
  },
  
  // Grid configurations
  grid: {
    cols: {
      mobile: 1,
      tablet: 2,
      desktop: 3,
      wide: 4,
    },
    gap: {
      sm: '1rem',
      md: '1.5rem',
      lg: '2rem',
    },
  },
  
  // Font sizes (slightly larger for better readability)
  fontSize: {
    xs: '0.75rem',   // 12px
    sm: '0.875rem',  // 14px
    base: '1rem',    // 16px
    lg: '1.125rem',  // 18px
    xl: '1.25rem',   // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
  },
  
  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const;

export type LayoutConfig = typeof layoutConfig;
