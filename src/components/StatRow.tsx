import { Box, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { gray, radius, risk, space, surface } from '@/theme/tokens'

export type StatTone = 'default' | 'red' | 'amber' | 'green'

const TONE_COLOR: Record<StatTone, string | undefined> = {
  default: undefined,
  red: risk.high.text,
  amber: risk.medium.text,
  green: risk.low.text,
}

export interface StatTileProps {
  label: ReactNode
  value: ReactNode
  sub?: ReactNode
  tone?: StatTone
  /** Red-bordered emphasis, for a figure that needs action. */
  alert?: boolean
  delta?: { text: string; direction: 'up' | 'down' }
}

export function StatTile({ label, value, sub, tone = 'default', alert, delta }: StatTileProps) {
  return (
    <Box
      sx={{
        backgroundColor: alert ? '#fffbfb' : gray.white,
        border: `${alert ? 1.5 : 1}px solid ${alert ? risk.high.dot : surface.border}`,
        borderRadius: `${radius.lg}px`,
        padding: `${space[5]}px`,
        boxShadow: surface.shadowSm,
      }}
    >
      <Typography
        component="div"
        sx={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          color: gray[500],
        }}
      >
        {label}
      </Typography>
      <Typography
        component="div"
        sx={{
          fontSize: 34,
          fontWeight: 800,
          lineHeight: 1.1,
          margin: `${space[1]}px 0`,
          color: TONE_COLOR[tone],
        }}
      >
        {value}
      </Typography>
      {sub !== undefined ? (
        <Typography component="div" sx={{ fontSize: 12, color: gray[500] }}>
          {sub}
        </Typography>
      ) : null}
      {delta ? (
        <Typography
          component="div"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            fontSize: 12,
            fontWeight: 600,
            marginTop: `${space[2]}px`,
            color: delta.direction === 'up' ? risk.high.text : risk.low.text,
          }}
        >
          {delta.direction === 'up' ? '▲' : '▼'} {delta.text}
        </Typography>
      ) : null}
    </Box>
  )
}

export function StatRow({ columns, children }: { columns: 3 | 4 | 5; children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: `${space[4]}px`,
        marginBottom: `${space[6]}px`,
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        '@media (max-width: 1100px)': { gridTemplateColumns: 'repeat(2, 1fr)' },
      }}
    >
      {children}
    </Box>
  )
}
