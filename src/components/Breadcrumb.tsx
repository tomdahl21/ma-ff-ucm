import { Box } from '@mui/material'
import { Link } from 'react-router'
import { gray, space } from '@/theme/tokens'

export interface Crumb {
  label: string
  to?: string
}

export function Breadcrumb({ trail }: { trail: Crumb[] }) {
  return (
    <Box
      component="nav"
      aria-label="Breadcrumb"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: `${space[2]}px`,
        fontSize: 11,
        color: gray[500],
        marginBottom: `${space[2]}px`,
        textTransform: 'uppercase',
        letterSpacing: '0.8px',
        fontWeight: 700,
      }}
    >
      {trail.map((crumb, i) => (
        <Box key={crumb.label} sx={{ display: 'flex', alignItems: 'center', gap: `${space[2]}px` }}>
          {crumb.to ? (
            <Box
              component={Link}
              to={crumb.to}
              sx={{ color: gray[500], textDecoration: 'none', '&:hover': { color: gray[900] } }}
            >
              {crumb.label}
            </Box>
          ) : (
            <span>{crumb.label}</span>
          )}
          {i < trail.length - 1 ? <Box component="span" aria-hidden="true">›</Box> : null}
        </Box>
      ))}
    </Box>
  )
}
