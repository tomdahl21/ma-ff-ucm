import { Box, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { gray, space } from '@/theme/tokens'
import { Glyph } from './atoms'

export function EmptyState({
  icon,
  title,
  children,
  titleColor,
}: {
  icon: string
  title: ReactNode
  children?: ReactNode
  titleColor?: string
}) {
  return (
    <Box sx={{ padding: `${space[10]}px ${space[5]}px`, textAlign: 'center' }}>
      <Box sx={{ marginBottom: `${space[3]}px` }}>
        <Glyph size={32}>{icon}</Glyph>
      </Box>
      <Typography
        component="div"
        sx={{ fontSize: 15, fontWeight: 700, marginBottom: `${space[2]}px`, color: titleColor }}
      >
        {title}
      </Typography>
      {children !== undefined ? (
        <Typography
          component="div"
          sx={{ fontSize: 13, color: gray[500], maxWidth: 340, margin: '0 auto', lineHeight: 1.6 }}
        >
          {children}
        </Typography>
      ) : null}
    </Box>
  )
}
