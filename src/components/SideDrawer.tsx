import { Box, Drawer, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { gray, space, surface } from '@/theme/tokens'

/**
 * Right-hand detail drawer. MUI's Drawer supplies the scrim, focus trap and
 * Escape handling that the legacy version wired by hand.
 */
export function SideDrawer({
  open,
  onClose,
  title,
  sub,
  footer,
  children,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  sub?: ReactNode
  footer?: ReactNode
  children?: ReactNode
}) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: 480,
            maxWidth: '92vw',
            display: 'flex',
            flexDirection: 'column',
            border: 0,
            borderRadius: 0,
            boxShadow: '-8px 0 32px rgba(0,0,0,0.18)',
          },
        },
      }}
    >
      <Box
        sx={{
          padding: `${space[5]}px`,
          borderBottom: `1px solid ${surface.border}`,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: `${space[4]}px`,
          flexShrink: 0,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            component="h2"
            sx={{ fontSize: 19, fontWeight: 700, lineHeight: 1.2, display: 'flex', alignItems: 'center', gap: `${space[2]}px`, flexWrap: 'wrap' }}
          >
            {title}
          </Typography>
          {sub !== undefined ? (
            <Typography component="div" sx={{ fontSize: 12, color: gray[500], marginTop: '3px' }}>
              {sub}
            </Typography>
          ) : null}
        </Box>
        <Box
          component="button"
          type="button"
          onClick={onClose}
          aria-label="Close"
          sx={{
            background: 'none',
            border: 0,
            fontSize: 24,
            lineHeight: 1,
            color: gray[500],
            cursor: 'pointer',
            padding: `0 ${space[2]}px`,
            '&:hover': { color: gray[900] },
          }}
        >
          ×
        </Box>
      </Box>

      <Box sx={{ padding: `${space[5]}px`, overflowY: 'auto', flex: 1 }}>{children}</Box>

      {footer !== undefined ? (
        <Box
          sx={{
            padding: `${space[4]}px ${space[5]}px`,
            borderTop: `1px solid ${surface.border}`,
            backgroundColor: gray[100],
            display: 'flex',
            gap: `${space[3]}px`,
            flexShrink: 0,
            flexWrap: 'wrap',
          }}
        >
          {footer}
        </Box>
      ) : null}
    </Drawer>
  )
}
