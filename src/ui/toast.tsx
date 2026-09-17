import { Box, GlobalStyles, Typography } from '@mui/material'
import { SnackbarContent, SnackbarProvider, closeSnackbar, type CustomContentProps } from 'notistack'
import { forwardRef, type ReactNode } from 'react'
import { brand, feedback, gray, layout, radius, space, surface } from '@/theme/tokens'
import type { ToastKind } from './toastApi'

declare module 'notistack' {
  interface VariantOverrides {
    ucm: { body?: string; kind?: ToastKind }
  }
}

const BAR_COLOR: Record<ToastKind, string> = {
  info: feedback.info,
  // "assign" means this orchestration layer routed work — always maroon,
  // never the per-role accent.
  assign: brand.maroon,
  urgent: feedback.error,
  ok: feedback.success,
}

interface UcmToastProps extends CustomContentProps {
  body?: string
  kind?: ToastKind
}

const UcmToast = forwardRef<HTMLDivElement, UcmToastProps>(function UcmToast(props, ref) {
  const { id, message, body, kind = 'info' } = props
  return (
    <SnackbarContent ref={ref}>
      <Box
        role="status"
        aria-live="polite"
        sx={{
          display: 'flex',
          width: 360,
          maxWidth: 'calc(100vw - 32px)',
          backgroundColor: gray.white,
          borderRadius: `${radius.md}px`,
          boxShadow: surface.shadowLg,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ width: 4, flexShrink: 0, backgroundColor: BAR_COLOR[kind] }} />
        <Box sx={{ flex: 1, minWidth: 0, padding: `${space[3]}px ${space[4]}px` }}>
          <Typography component="div" sx={{ fontSize: 13, fontWeight: 700, color: gray[900] }}>
            {message}
          </Typography>
          {body ? (
            <Typography
              component="div"
              sx={{ fontSize: 12, color: gray[500], marginTop: '2px', lineHeight: 1.5 }}
            >
              {body}
            </Typography>
          ) : null}
        </Box>
        <Box
          component="button"
          type="button"
          aria-label="Dismiss"
          onClick={() => closeSnackbar(id)}
          sx={{
            alignSelf: 'flex-start',
            background: 'none',
            border: 0,
            cursor: 'pointer',
            fontSize: 18,
            lineHeight: 1,
            padding: `${space[2]}px ${space[3]}px`,
            color: gray[300],
            '&:hover': { color: gray[700] },
          }}
        >
          ×
        </Box>
      </Box>
    </SnackbarContent>
  )
})

export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Clear the sticky app bar + provenance bar, as the legacy
          `.toast-host { top: 104px }` did. */}
      <GlobalStyles
        styles={{
          '.notistack-SnackbarContainer': {
            top: `${layout.appBarH + 12}px !important`,
          },
        }}
      />
      <SnackbarProvider
        maxSnack={4}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        autoHideDuration={7000}
        Components={{ ucm: UcmToast }}
      >
        {children}
      </SnackbarProvider>
    </>
  )
}
