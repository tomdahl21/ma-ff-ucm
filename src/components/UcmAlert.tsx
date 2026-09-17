import { Box, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { feedback, radius, risk, space } from '@/theme/tokens'
import { Glyph } from './atoms'

export type AlertSeverity = 'info' | 'warning' | 'error' | 'success'

const STYLES: Record<AlertSeverity, { bg: string; border: string; color: string; icon: string }> = {
  info: { bg: '#E3F2FD', border: feedback.info, color: '#0D3B7A', icon: 'ℹ️' },
  warning: { bg: risk.medium.bg, border: risk.medium.dot, color: risk.medium.text, icon: '⚠️' },
  error: { bg: risk.high.bg, border: feedback.error, color: '#7F1D1D', icon: '🔴' },
  success: { bg: risk.low.bg, border: feedback.success, color: '#14532D', icon: '✓' },
}

interface UcmAlertProps {
  severity: AlertSeverity
  title?: ReactNode
  children?: ReactNode
  /** Overrides the default glyph for this severity. */
  icon?: ReactNode
  /** Right-aligned slot, typically a button. */
  action?: ReactNode
}

/**
 * The legacy `.alert`: a 4px coloured left rule, tinted background, glyph,
 * title and body. Not MUI's Alert, whose anatomy and colour model differ
 * enough that overriding it costs more than rebuilding it.
 */
export function UcmAlert({ severity, title, children, icon, action }: UcmAlertProps) {
  const s = STYLES[severity]
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: `${space[4]}px`,
        padding: `${space[4]}px ${space[5]}px`,
        borderRadius: `${radius.md}px`,
        borderLeft: `4px solid ${s.border}`,
        backgroundColor: s.bg,
        color: s.color,
        fontSize: 14,
        marginBottom: `${space[5]}px`,
      }}
    >
      <Box sx={{ flexShrink: 0, marginTop: '1px' }}>
        {icon ?? <Glyph size={18}>{s.icon}</Glyph>}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {title !== undefined ? (
          <Typography component="div" sx={{ fontWeight: 700, marginBottom: '2px' }}>
            {title}
          </Typography>
        ) : null}
        {children !== undefined ? (
          <Typography component="div" sx={{ fontSize: 13, opacity: 0.9 }}>
            {children}
          </Typography>
        ) : null}
      </Box>
      {action !== undefined ? <Box sx={{ marginLeft: 'auto', flexShrink: 0 }}>{action}</Box> : null}
    </Box>
  )
}
