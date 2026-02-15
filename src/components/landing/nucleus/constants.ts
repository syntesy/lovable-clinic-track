// ═══ TUNING CONSTANTS ═══
// Adjust these to calibrate the nucleus visual

// Particle counts
export const HALO_COUNT = 1800;
export const AMBIENT_COUNT = 600;
export const HALO_COUNT_MOBILE = 600;
export const AMBIENT_COUNT_MOBILE = 200;

// Bloom
export const BLOOM_INTENSITY = 1.2;
export const BLOOM_THRESHOLD = 0.3;
export const BLOOM_RADIUS = 0.8;

// Fresnel / Sphere
export const FRESNEL_POWER = 2.5;
export const FRESNEL_INTENSITY = 1.8;
export const NUCLEUS_SCALE = 0.65;
export const NUCLEUS_SEGMENTS = 128;

// Colors (HSL-ish but as hex for Three.js)
export const NUCLEUS_COLOR_CORE = "#c97b5e";    // warm peach/coral center
export const NUCLEUS_COLOR_EDGE = "#e8a090";    // lighter rosé edge
export const NUCLEUS_COLOR_GLOW = "#f0c0a8";    // glow color
export const HALO_COLOR = "#ffe8c0";            // warm white/gold
export const AMBIENT_COLOR = "#f0b090";         // soft coral

// Scroll position map: [scrollProgress, x, y, scale]
export const SCROLL_POSITIONS = [
  { scroll: 0.00, x: 0.00, y: -1.8, scale: 1.15 },
  { scroll: 0.25, x: 2.2, y: -0.8, scale: 1.0 },
  { scroll: 0.50, x: 3.0, y: -0.3, scale: 0.9 },
  { scroll: 0.75, x: -2.0, y: -0.3, scale: 0.9 },
  { scroll: 1.00, x: -0.5, y: -1.0, scale: 1.0 },
] as const;
