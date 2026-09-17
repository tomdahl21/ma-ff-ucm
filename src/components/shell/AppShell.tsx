import { Box, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { gray, layout, space } from '@/theme/tokens'
import { ProvenanceBar, type ProvNode } from './ProvenanceBar'
import { SideNav, type NavGroup } from './SideNav'
import { UcmAppBar, type AppBarUser } from './UcmAppBar'

interface AppShellProps {
  user: AppBarUser
  nav: NavGroup[]
  provenance: ProvNode[]
  provenanceTrailing?: ReactNode
  /** Right-hand app bar slot — the notification bell on the coordinator view. */
  appBarRight?: ReactNode
  children: ReactNode
}

export function AppShell({
  user,
  nav,
  provenance,
  provenanceTrailing,
  appBarRight,
  children,
}: AppShellProps) {
  return (
    <>
      <UcmAppBar user={user} right={appBarRight} />
      <ProvenanceBar nodes={provenance} trailing={provenanceTrailing} />
      <Box
        sx={{
          display: 'flex',
          minHeight: `calc(100vh - ${layout.appBarH}px)`,
          alignItems: 'stretch',
        }}
      >
        <SideNav groups={nav} />
        <Box
          component="main"
          sx={{
            flex: 1,
            padding: `${space[6]}px ${space[8]}px`,
            // Both needed: the provenance bar and wide tables scroll
            // horizontally, and flex children won't shrink without min-width.
            minWidth: 0,
            overflowX: 'hidden',
          }}
        >
          {children}
        </Box>
      </Box>
    </>
  )
}

export function PageHead({
  title,
  sub,
  actions,
}: {
  title: ReactNode
  sub?: ReactNode
  actions?: ReactNode
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: `${space[6]}px`,
        gap: `${space[5]}px`,
        flexWrap: 'wrap',
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h1" component="h1">
          {title}
        </Typography>
        {sub !== undefined ? (
          <Typography component="div" sx={{ fontSize: 13, color: gray[500], marginTop: '3px' }}>
            {sub}
          </Typography>
        ) : null}
      </Box>
      {actions !== undefined ? (
        <Box sx={{ display: 'flex', gap: `${space[3]}px`, alignItems: 'center' }}>{actions}</Box>
      ) : null}
    </Box>
  )
}
