import { Box, Paper, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { gray, space, surface } from '@/theme/tokens'

interface PanelProps {
  title?: ReactNode
  sub?: ReactNode
  /** Right-hand slot in the header — a select, a button, a chip row. */
  actions?: ReactNode
  /** Drop body padding, for panels whose body is a table. */
  flush?: boolean
  children?: ReactNode
  sx?: object
  id?: string
  'aria-labelledby'?: string
}

export function Panel({
  title,
  sub,
  actions,
  flush,
  children,
  sx,
  id,
  'aria-labelledby': labelledBy,
}: PanelProps) {
  const hasHead = title !== undefined || sub !== undefined || actions !== undefined
  return (
    <Paper
      id={id}
      aria-labelledby={labelledBy}
      sx={{ overflow: 'hidden', marginBottom: `${space[6]}px`, ...sx }}
    >
      {hasHead ? (
        <Box
          sx={{
            padding: `${space[4]}px ${space[5]}px`,
            borderBottom: `1px solid ${surface.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: `${space[4]}px`,
            flexWrap: 'wrap',
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            {title !== undefined ? (
              <Typography component="div" sx={{ fontSize: 15, fontWeight: 700 }}>
                {title}
              </Typography>
            ) : null}
            {sub !== undefined ? (
              <Typography component="div" sx={{ fontSize: 12, color: gray[500], marginTop: '1px' }}>
                {sub}
              </Typography>
            ) : null}
          </Box>
          {actions !== undefined ? <Box sx={{ flexShrink: 0 }}>{actions}</Box> : null}
        </Box>
      ) : null}
      <Box sx={{ padding: flush ? 0 : `${space[5]}px` }}>{children}</Box>
    </Paper>
  )
}
