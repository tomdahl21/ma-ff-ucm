/**
 * Design tokens, lifted verbatim from the `:root` block of the original
 * css/app.css (now public/legacy/css/app.css). That file is the source of
 * truth for the values here; the design-system doc drifted from it.
 */

export const brand = {
  maroon: '#820B25',
  maroonDark: '#5C0819',
  maroonMid: '#A50E2D',
  maroonTint: '#F5E8EB',
} as const

export const gray = {
  900: '#1A1A1A',
  700: '#3D3D3D',
  500: '#717171',
  300: '#C4C4C4',
  100: '#F2F2F2',
  white: '#FFFFFF',
} as const

export const risk = {
  high: { bg: '#FDECEA', text: '#B71C1C', dot: '#D32F2F' },
  medium: { bg: '#FFF8E1', text: '#7B5100', dot: '#F59E0B' },
  low: { bg: '#E8F5E9', text: '#1B5E20', dot: '#388E3C' },
} as const

export const feedback = {
  info: '#1565C0',
  success: '#2E7D32',
  warning: '#E65100',
  error: '#C62828',
} as const

/**
 * The source-system language. These colours are semantic, not decorative:
 * they mean "this datum came from Epic / Salesforce / Agentforce / Marketing
 * Cloud", and `app` (maroon) means "this orchestration layer did the work".
 *
 * They must NOT shift with the per-role accent — see createUcmTheme().
 */
export const source = {
  epic: { main: '#1B7F79', bg: '#E4F2F1', border: '#B9DEDA', label: 'Epic' },
  sfdc: { main: '#0176D3', bg: '#E3F0FB', border: '#B8D9F3', label: 'Salesforce' },
  agent: { main: '#7526E3', bg: '#F0E8FD', border: '#D9C4F7', label: 'Agentforce' },
  mc: { main: '#E35205', bg: '#FDEDE4', border: '#F7CBB1', label: 'Marketing Cloud' },
  app: { main: '#820B25', bg: '#F5E8EB', border: '#E3C3CB', label: 'This Layer' },
} as const

export const surface = {
  border: '#E0E0E0',
  shadowSm: '0 1px 3px rgba(0,0,0,0.10)',
  shadowMd: '0 4px 12px rgba(0,0,0,0.12)',
  shadowLg: '0 8px 24px rgba(0,0,0,0.15)',
} as const

/**
 * The 4px design scale. Deliberately kept separate from MUI's `theme.spacing`,
 * which stays at its 8px default — every MUI component's internal padding
 * assumes 8, and re-basing it to 4 renders them at half size.
 */
export const space = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const

export const radius = { sm: 4, md: 8, lg: 12, pill: 100 } as const

export const font = {
  sans: "'Inter Variable', 'Gotham', 'Inter', system-ui, -apple-system, sans-serif",
  serif: "'Adobe Garamond Pro', 'Garamond', Georgia, serif",
} as const

/**
 * Layout constants. The 92px app bar is load-bearing: the provenance bar,
 * inbox, toast host, shell min-height and the coordinator detail rail all
 * derive their sticky offsets from it. MUI's `theme.mixins.toolbar` reports
 * 56/64px, so it cannot be used here.
 */
export const layout = {
  appBarH: 92,
  provBarH: 38,
  sideNavW: 230,
  detailRailW: 400,
  /** Below this the coordinator work area stacks. Matches the original 1340px. */
  workAreaStack: 1340,
} as const

/** Per-role accent. Maroon is the coordinator's and the app's own colour. */
export const roleAccent = {
  coordinator: { main: brand.maroon, dark: brand.maroonDark, tint: brand.maroonTint },
  manager: { main: '#2F5580', dark: '#24425F', tint: '#DDEAF8' },
  executive: { main: gray[900], dark: '#000000', tint: gray[100] },
} as const

export type RoleKey = keyof typeof roleAccent
export type SourceKey = keyof typeof source
export type RiskTier = keyof typeof risk
