/**
 * UpCoach Design System - Spacing Tokens
 * Unified spacing system for consistent layouts
 */
// Base spacing unit (4px)
const SPACING_UNIT = 4;
export const spacing = {
  // Numeric scale (0-24)
  0: '0',
  0.5: `${SPACING_UNIT * 0.5}px`,
  1: `${SPACING_UNIT * 1}px`,
  1.5: `${SPACING_UNIT * 1.5}px`,
  2: `${SPACING_UNIT * 2}px`,
  2.5: `${SPACING_UNIT * 2.5}px`,
  3: `${SPACING_UNIT * 3}px`,
  3.5: `${SPACING_UNIT * 3.5}px`,
  4: `${SPACING_UNIT * 4}px`,
  5: `${SPACING_UNIT * 5}px`,
  6: `${SPACING_UNIT * 6}px`,
  7: `${SPACING_UNIT * 7}px`,
  8: `${SPACING_UNIT * 8}px`,
  9: `${SPACING_UNIT * 9}px`,
  10: `${SPACING_UNIT * 10}px`,
  11: `${SPACING_UNIT * 11}px`,
  12: `${SPACING_UNIT * 12}px`,
  14: `${SPACING_UNIT * 14}px`,
  16: `${SPACING_UNIT * 16}px`,
  20: `${SPACING_UNIT * 20}px`,
  24: `${SPACING_UNIT * 24}px`,
  28: `${SPACING_UNIT * 28}px`,
  32: `${SPACING_UNIT * 32}px`,
  36: `${SPACING_UNIT * 36}px`,
  40: `${SPACING_UNIT * 40}px`,
  44: `${SPACING_UNIT * 44}px`,
  48: `${SPACING_UNIT * 48}px`,
  52: `${SPACING_UNIT * 52}px`,
  56: `${SPACING_UNIT * 56}px`,
  60: `${SPACING_UNIT * 60}px`,
  64: `${SPACING_UNIT * 64}px`,
  72: `${SPACING_UNIT * 72}px`,
  80: `${SPACING_UNIT * 80}px`,
  96: `${SPACING_UNIT * 96}px`,
  // Semantic spacing
  none: '0',
  xs: `${SPACING_UNIT * 1}px`,
  sm: `${SPACING_UNIT * 2}px`,
  md: `${SPACING_UNIT * 4}px`,
  lg: `${SPACING_UNIT * 6}px`,
  xl: `${SPACING_UNIT * 8}px`,
  '2xl': `${SPACING_UNIT * 12}px`,
  '3xl': `${SPACING_UNIT * 16}px`,
  '4xl': `${SPACING_UNIT * 20}px`,
  '5xl': `${SPACING_UNIT * 24}px`, // 96px - 5X large
};
// Component-specific spacing
export const componentSpacing = {
  // Button padding
  button: {
    xs: { x: spacing[2], y: spacing[1] },
    sm: { x: spacing[3], y: spacing[1.5] },
    md: { x: spacing[4], y: spacing[2] },
    lg: { x: spacing[6], y: spacing[3] },
    xl: { x: spacing[8], y: spacing[4] },
  },
  // Card padding
  card: {
    sm: spacing[3],
    md: spacing[4],
    lg: spacing[6],
    xl: spacing[8],
  },
  // Input padding
  input: {
    sm: { x: spacing[3], y: spacing[1.5] },
    md: { x: spacing[3], y: spacing[2] },
    lg: { x: spacing[4], y: spacing[3] },
  },
  // Modal padding
  modal: {
    header: spacing[6],
    body: spacing[6],
    footer: spacing[4],
  },
  // Section spacing
  section: {
    sm: spacing[8],
    md: spacing[12],
    lg: spacing[16],
    xl: spacing[20],
  },
  // Grid gaps
  grid: {
    xs: spacing[2],
    sm: spacing[3],
    md: spacing[4],
    lg: spacing[6],
    xl: spacing[8],
  },
  // Stack spacing (vertical spacing between elements)
  stack: {
    xs: spacing[1],
    sm: spacing[2],
    md: spacing[4],
    lg: spacing[6],
    xl: spacing[8],
  },
  // Inline spacing (horizontal spacing between elements)
  inline: {
    xs: spacing[1],
    sm: spacing[2],
    md: spacing[3],
    lg: spacing[4],
    xl: spacing[6],
  },
};
// Layout containers
export const layout = {
  // Maximum content widths
  maxWidth: {
    xs: '320px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
    full: '100%',
    prose: '65ch', // Optimal reading width
  },
  // Container padding
  containerPadding: {
    mobile: spacing[4],
    tablet: spacing[6],
    desktop: spacing[8],
  },
  // Page margins
  pageMargin: {
    mobile: spacing[4],
    tablet: spacing[8],
    desktop: spacing[12],
  },
  // Sidebar widths
  sidebar: {
    collapsed: '64px',
    narrow: '200px',
    default: '240px',
    wide: '280px',
  },
  // Header heights
  header: {
    mobile: '56px',
    desktop: '64px',
  },
  // Footer heights
  footer: {
    default: '240px',
    minimal: '120px',
  },
};
// Helper function to get spacing value
export const getSpacing = value => spacing[value];
// Helper function to create margin/padding shorthand
export const createSpacing = (top, right, bottom, left) => {
  if (right === undefined) {
    return spacing[top];
  }
  if (bottom === undefined) {
    return `${spacing[top]} ${spacing[right]}`;
  }
  if (left === undefined) {
    return `${spacing[top]} ${spacing[right]} ${spacing[bottom]}`;
  }
  return `${spacing[top]} ${spacing[right]} ${spacing[bottom]} ${spacing[left]}`;
};
export default spacing;
