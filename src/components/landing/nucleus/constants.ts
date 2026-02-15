// ═══ TUNING CONSTANTS ═══

// Particle counts
export const HALO_COUNT = 2000;
export const AMBIENT_COUNT = 800;
export const HALO_COUNT_MOBILE = 600;
export const AMBIENT_COUNT_MOBILE = 250;

// Bloom
export const BLOOM_INTENSITY = 1.4;
export const BLOOM_THRESHOLD = 0.25;
export const BLOOM_RADIUS = 0.85;

// Fresnel / Sphere
export const FRESNEL_POWER = 2.8;
export const FRESNEL_INTENSITY = 2.0;
export const NUCLEUS_SCALE = 0.7;
export const NUCLEUS_SEGMENTS = 128;

// Colors — warm coral/amber on deep navy
export const NUCLEUS_COLOR_CORE = "#b5714a";    // deep amber core
export const NUCLEUS_COLOR_EDGE = "#d4916a";    // warm amber edge
export const NUCLEUS_COLOR_GLOW = "#e8a878";    // amber glow
export const HALO_COLOR = "#ffd8a8";            // warm gold
export const AMBIENT_COLOR = "#d4916a";         // soft amber

// Scroll position map (Three.js world units)
export const SCROLL_POSITIONS = [
  { scroll: 0.00, x: 0.00, y: -1.6, scale: 1.2 },
  { scroll: 0.20, x: 1.8,  y: -0.5, scale: 1.0 },
  { scroll: 0.40, x: 2.8,  y: 0.0,  scale: 0.85 },
  { scroll: 0.60, x: -1.8, y: -0.2, scale: 0.9 },
  { scroll: 0.80, x: -2.5, y: 0.3,  scale: 0.8 },
  { scroll: 1.00, x: 0.0,  y: -1.0, scale: 1.05 },
] as const;
