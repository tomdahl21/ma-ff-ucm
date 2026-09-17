import { Box, Typography } from '@mui/material'
import { Link } from 'react-router'
import type { ReactNode } from 'react'
import { gray, layout, radius, space, surface } from '@/theme/tokens'

export interface AppBarUser {
  name: string
  role: string
  initials: string
}

/**
 * The 92px branded bar. Height is load-bearing — the provenance bar, toast
 * host and coordinator detail rail all offset from it, so it comes from
 * `layout.appBarH` rather than a literal.
 */
export function UcmAppBar({
  user,
  right,
  title = 'Care Coordination',
}: {
  user: AppBarUser
  right?: ReactNode
  title?: string
}) {
  return (
    <Box
      component="header"
      sx={{
        backgroundColor: 'primary.main',
        color: gray.white,
        padding: `0 ${space[6]}px`,
        height: layout.appBarH,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: surface.shadowMd,
        position: 'sticky',
        top: 0,
        zIndex: 'appBar',
      }}
    >
      <Box
        component={Link}
        to="/"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: `${space[4]}px`,
          fontSize: 16,
          fontWeight: 600,
          textDecoration: 'none',
          color: gray.white,
        }}
      >
        <Box
          component="img"
          src="/img/uchicago-medicine-logo-vector.svg"
          alt="UChicago Medicine"
          sx={{ height: 68, width: 'auto', filter: 'brightness(0) invert(1)' }}
        />
        <Box component="span" sx={{ opacity: 0.45, fontWeight: 300 }}>
          |
        </Box>
        {title}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: `${space[5]}px` }}>
        <Box
          component={Link}
          to="/"
          sx={{
            fontSize: 12,
            color: 'rgba(255,255,255,0.85)',
            textDecoration: 'none',
            padding: '6px 14px',
            border: '1px solid rgba(255,255,255,0.35)',
            borderRadius: `${radius.sm}px`,
            transition: 'all 0.15s',
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.15)', color: gray.white },
          }}
        >
          Switch Role
        </Box>

        {right}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: `${space[3]}px`, fontSize: 13 }}>
          <Box sx={{ textAlign: 'right', lineHeight: 1.3 }}>
            <Typography component="div" sx={{ fontWeight: 600, fontSize: 13 }}>
              {user.name}
            </Typography>
            <Typography component="div" sx={{ fontSize: 11, opacity: 0.7 }}>
              {user.role}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {user.initials}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
