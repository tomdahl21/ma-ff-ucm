import { Box, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { gray, radius, risk, space } from '@/theme/tokens'
import { meterTone, type MeterTone } from './meterTone'

const TONE_COLOR: Record<MeterTone, string> = {
  ok: risk.low.dot,
  near: risk.medium.dot,
  over: risk.high.dot,
}

/** Capacity bar. `width` lets the table variant stay narrow. */
export function Meter({
  value,
  capacity,
  width,
  left,
  right,
}: {
  value: number
  capacity: number
  width?: number
  left?: ReactNode
  right?: ReactNode
}) {
  const tone = meterTone(value, capacity)
  const pct = capacity > 0 ? Math.min(100, (value / capacity) * 100) : 0
  return (
    <Box sx={{ width: width ?? '100%' }}>
      <Box
        sx={{
          height: 8,
          borderRadius: `${radius.pill}px`,
          backgroundColor: gray[100],
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            height: '100%',
            width: `${pct}%`,
            borderRadius: `${radius.pill}px`,
            backgroundColor: TONE_COLOR[tone],
            transition: 'width 0.3s',
          }}
        />
      </Box>
      {left !== undefined || right !== undefined ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 11,
            color: gray[500],
            marginTop: '5px',
          }}
        >
          <span>{left}</span>
          <span>{right}</span>
        </Box>
      ) : null}
    </Box>
  )
}

/** Labelled horizontal bar, used for the per-coordinator comparisons. */
export function HBar({
  label,
  pct,
  color,
  barText,
  value,
}: {
  label: ReactNode
  pct: number
  color: string
  barText?: ReactNode
  value: ReactNode
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: `${space[3]}px`, padding: `${space[2]}px 0` }}>
      <Box sx={{ width: 130, flexShrink: 0, fontSize: 12, fontWeight: 600 }}>{label}</Box>
      <Box
        sx={{
          flex: 1,
          height: 20,
          backgroundColor: gray[100],
          borderRadius: `${radius.sm}px`,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            height: '100%',
            width: `${Math.max(0, Math.min(100, pct))}%`,
            minWidth: 26,
            borderRadius: `${radius.sm}px`,
            backgroundColor: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: `${space[2]}px`,
            color: gray.white,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {barText}
        </Box>
      </Box>
      <Typography
        component="div"
        sx={{ width: 44, textAlign: 'right', flexShrink: 0, fontSize: 12, fontWeight: 700 }}
      >
        {value}
      </Typography>
    </Box>
  )
}
