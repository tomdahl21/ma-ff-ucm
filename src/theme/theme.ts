import { createTheme, type Theme } from '@mui/material/styles'
import {
  brand,
  feedback,
  font,
  gray,
  layout,
  radius,
  risk,
  roleAccent,
  source,
  space,
  surface,
  type RoleKey,
} from './tokens'

/* ── Typed additions to the MUI theme ──────────────────────────────
   `risk` and `source` are first-class palette groups because they carry
   meaning in this app, not decoration. `layout` and `space` ride along so
   nothing has to hardcode the 92px app bar or the 4px scale. */
declare module '@mui/material/styles' {
  interface Palette {
    risk: typeof risk
    source: typeof source
    borderSubtle: string
  }
  interface PaletteOptions {
    risk?: typeof risk
    source?: typeof source
    borderSubtle?: string
  }
  interface Theme {
    layout: typeof layout
    space: typeof space
    role: RoleKey
    serif: string
  }
  interface ThemeOptions {
    layout?: typeof layout
    space?: typeof space
    role?: RoleKey
    serif?: string
  }
}

/**
 * One theme factory, three role accents.
 *
 * The legacy pages repainted themselves by re-declaring `.app-bar`,
 * `.btn--primary` etc. later in the cascade. Those override lists were
 * hand-picked because maroon has to survive wherever it means "this
 * orchestration layer did the work" — so only `palette.primary` swaps here,
 * and anything app-semantic reads `palette.source.app` instead.
 */
export function createUcmTheme(role: RoleKey = 'coordinator'): Theme {
  const accent = roleAccent[role]

  return createTheme({
    role,
    layout,
    space,
    serif: font.serif,

    palette: {
      mode: 'light',
      primary: { main: accent.main, dark: accent.dark, light: accent.tint, contrastText: gray.white },
      secondary: { main: gray[700] },
      error: { main: feedback.error },
      warning: { main: feedback.warning },
      info: { main: feedback.info },
      success: { main: feedback.success },
      background: { default: gray[100], paper: gray.white },
      text: { primary: gray[900], secondary: gray[500] },
      divider: surface.border,
      borderSubtle: gray[100],
      risk,
      source,
    },

    shape: { borderRadius: radius.md },

    typography: {
      fontFamily: font.sans,
      // The design is px-based throughout, with no rem anywhere.
      fontSize: 15,
      htmlFontSize: 16,
      h1: { fontSize: 26, fontWeight: 700, letterSpacing: '-0.4px', lineHeight: 1.2 },
      h2: { fontSize: 22, fontWeight: 600, lineHeight: 1.3 },
      h3: { fontSize: 17, fontWeight: 600, lineHeight: 1.3 },
      body1: { fontSize: 15, lineHeight: 1.6 },
      body2: { fontSize: 13, lineHeight: 1.55 },
      button: { fontSize: 14, fontWeight: 600, textTransform: 'none', lineHeight: 1 },
      caption: { fontSize: 12, lineHeight: 1.5 },
    },

    /* The legacy stack (prov-bar 90 … toast-host 999) sits entirely below
       MUI's, which would render toasts under any dialog. Re-based so the
       relative order survives inside MUI's ranges. */
    zIndex: {
      appBar: 1100,
      drawer: 1200,
      modal: 1300,
      snackbar: 1400,
      tooltip: 1500,
    },

    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: gray[100],
            color: gray[900],
            fontSize: 15,
            lineHeight: 1.6,
            WebkitFontSmoothing: 'antialiased',
          },
          // The legacy sheet zeroed padding on every element and pseudo-element,
          // which breaks MUI internals. Only the box-sizing half is wanted, and
          // CssBaseline already does that.
          'h1, h2, h3, h4, h5, h6, p': { margin: 0 },
          'ul, ol': { margin: 0, paddingLeft: 0, listStyle: 'none' },
        },
      },

      MuiButton: {
        defaultProps: { disableElevation: true, disableRipple: true },
        styleOverrides: {
          root: {
            borderRadius: radius.sm,
            // 2px on every variant so widths stay identical across variants.
            borderWidth: 2,
            borderStyle: 'solid',
            borderColor: 'transparent',
            padding: '9px 17px',
            gap: space[2],
            minWidth: 0,
            '&:focus-visible': {
              outline: `3px solid ${accent.main}`,
              outlineOffset: 2,
            },
          },
          sizeSmall: { padding: '6px 13px', fontSize: 12 },
        },
        variants: [
          {
            props: { variant: 'contained', color: 'primary' },
            style: {
              backgroundColor: accent.main,
              borderColor: accent.main,
              '&:hover': { backgroundColor: accent.dark, borderColor: accent.dark },
            },
          },
          {
            props: { variant: 'outlined' },
            style: {
              borderColor: surface.border,
              color: gray[900],
              backgroundColor: gray.white,
              '&:hover': { borderColor: gray[300], backgroundColor: gray[100] },
            },
          },
          {
            props: { variant: 'text' },
            style: {
              color: gray[500],
              '&:hover': { backgroundColor: gray[100], color: gray[900] },
            },
          },
        ],
      },

      // `.panel` carried a border AND a shadow at once, which is neither
      // Paper `outlined` (border only) nor `elevation={1}` (shadow only).
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            border: `1px solid ${surface.border}`,
            borderRadius: radius.lg,
            boxShadow: surface.shadowSm,
          },
        },
      },

      MuiTable: {
        // The risk stripe is a border-left on <tr>, which only paints under
        // `collapse`. A sticky header would need `separate` and would silently
        // drop the stripe, so TriageTable draws it as a cell ::before instead.
        styleOverrides: { root: { borderCollapse: 'collapse' } },
      },
      MuiTableCell: {
        styleOverrides: {
          root: { borderBottom: `1px solid ${surface.border}`, padding: `${space[3]}px ${space[4]}px` },
          head: {
            backgroundColor: gray[100],
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.8px',
            textTransform: 'uppercase',
            color: gray[500],
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&.Mui-selected': {
              backgroundColor: brand.maroonTint,
              '&:hover': { backgroundColor: brand.maroonTint },
            },
          },
        },
      },

      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: radius.sm,
            backgroundColor: gray.white,
            fontSize: 14,
            '& .MuiOutlinedInput-notchedOutline': { borderWidth: 1.5, borderColor: surface.border },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: gray[300] },
            '&.Mui-focused': { boxShadow: `0 0 0 3px ${accent.tint}` },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderWidth: 1.5,
              borderColor: accent.main,
            },
          },
          input: { padding: '9px 12px' },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: { fontSize: 12, fontWeight: 600, color: gray[700] },
        },
      },

      MuiTabs: {
        styleOverrides: {
          root: { minHeight: 0, borderBottom: `1px solid ${surface.border}` },
          indicator: { height: 2, backgroundColor: accent.main },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            minHeight: 0,
            minWidth: 0,
            padding: `${space[3]}px ${space[4]}px`,
            fontSize: 13,
            fontWeight: 600,
            textTransform: 'none',
            color: gray[500],
            '&.Mui-selected': { color: accent.main },
          },
        },
      },

      MuiChip: {
        styleOverrides: {
          root: { borderRadius: radius.pill, fontWeight: 600 },
        },
      },

      MuiDivider: { styleOverrides: { root: { borderColor: gray[100] } } },

      MuiLink: {
        defaultProps: { underline: 'hover' },
        styleOverrides: { root: { color: accent.main, fontWeight: 600 } },
      },

      MuiTooltip: {
        styleOverrides: {
          tooltip: { backgroundColor: gray[900], fontSize: 12, padding: `${space[2]}px ${space[3]}px` },
        },
      },
    },
  })
}

export const coordinatorTheme = createUcmTheme('coordinator')
