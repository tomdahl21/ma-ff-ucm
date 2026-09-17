import { Box, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import type { SourceKey } from '@/data/types'
import { gray, radius, space, surface } from '@/theme/tokens'
import { SrcTag } from './atoms'

/** A labelled fact with its source system attached. */
export function KeyValue({
  label,
  value,
  src,
}: {
  label: ReactNode
  value: ReactNode
  src: SourceKey
}) {
  return (
    <Box
      sx={{
        border: `1px solid ${surface.border}`,
        borderRadius: `${radius.sm}px`,
        padding: `${space[3]}px`,
      }}
    >
      <Typography
        component="div"
        sx={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          color: gray[500],
        }}
      >
        {label}
      </Typography>
      <Typography component="div" sx={{ fontSize: 13, fontWeight: 600, margin: '3px 0 4px' }}>
        {value}
      </Typography>
      <SrcTag system={src} />
    </Box>
  )
}

export function KeyValueGrid({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: `${space[3]}px`,
      }}
    >
      {children}
    </Box>
  )
}
