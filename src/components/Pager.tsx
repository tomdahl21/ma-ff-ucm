import { Box, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { gray, radius, space, surface } from '@/theme/tokens'

export function Pager({
  info,
  onPrev,
  onNext,
  canPrev,
  canNext,
}: {
  info: ReactNode
  onPrev: () => void
  onNext: () => void
  canPrev: boolean
  canNext: boolean
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: `${space[3]}px`,
        padding: `${space[3]}px ${space[5]}px`,
        borderTop: `1px solid ${surface.border}`,
        backgroundColor: gray[100],
      }}
    >
      <Typography component="div" sx={{ fontSize: 12, color: gray[500] }}>
        {info}
      </Typography>
      <Box sx={{ display: 'flex', gap: `${space[2]}px` }}>
        <PagerButton onClick={onPrev} disabled={!canPrev}>
          ← Prev
        </PagerButton>
        <PagerButton onClick={onNext} disabled={!canNext}>
          Next →
        </PagerButton>
      </Box>
    </Box>
  )
}

function PagerButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode
  onClick: () => void
  disabled: boolean
}) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      disabled={disabled}
      sx={{
        border: `1px solid ${surface.border}`,
        backgroundColor: gray.white,
        borderRadius: `${radius.sm}px`,
        padding: '5px 11px',
        fontSize: 12,
        fontWeight: 600,
        fontFamily: 'inherit',
        cursor: disabled ? 'default' : 'pointer',
        color: gray[700],
        opacity: disabled ? 0.4 : 1,
        '&:hover:not(:disabled)': { borderColor: gray[300], color: gray[900] },
      }}
    >
      {children}
    </Box>
  )
}
