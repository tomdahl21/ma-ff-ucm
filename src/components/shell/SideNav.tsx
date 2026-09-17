import { Box } from '@mui/material'
import { NavLink } from 'react-router'
import { gray, layout, radius, risk, space, surface } from '@/theme/tokens'
import { Glyph } from '../atoms'

export interface NavItem {
  label: string
  icon: string
  /** Router path. Omit for the not-yet-built links the demo still shows. */
  to?: string
  badge?: { count: number; alert?: boolean }
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

function Badge({ count, alert }: { count: number; alert?: boolean }) {
  if (count <= 0) return null
  return (
    <Box
      component="span"
      sx={{
        marginLeft: 'auto',
        backgroundColor: alert ? risk.high.dot : 'primary.main',
        color: gray.white,
        fontSize: 10,
        fontWeight: 700,
        padding: '2px 7px',
        borderRadius: `${radius.pill}px`,
      }}
    >
      {count}
    </Box>
  )
}

const itemSx = {
  display: 'flex',
  alignItems: 'center',
  gap: `${space[3]}px`,
  padding: `10px ${space[5]}px`,
  fontSize: 14,
  color: gray[700],
  cursor: 'pointer',
  textDecoration: 'none',
  borderLeft: '3px solid transparent',
  transition: 'all 0.12s',
  background: 'none',
  border: 0,
  borderLeftWidth: 3,
  borderLeftStyle: 'solid',
  borderLeftColor: 'transparent',
  width: '100%',
  textAlign: 'left' as const,
  fontFamily: 'inherit',
  '&:hover': { backgroundColor: gray[100], color: gray[900] },
  '&.active': {
    backgroundColor: 'primary.light',
    color: 'primary.main',
    borderLeftColor: 'primary.main',
    fontWeight: 600,
  },
}

export function SideNav({ groups }: { groups: NavGroup[] }) {
  return (
    <Box
      component="nav"
      aria-label="Sections"
      sx={{
        width: layout.sideNavW,
        backgroundColor: gray.white,
        borderRight: `1px solid ${surface.border}`,
        padding: `${space[4]}px 0`,
        flexShrink: 0,
      }}
    >
      {groups.map((group) => (
        <Box key={group.label}>
          <Box
            sx={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '1.2px',
              textTransform: 'uppercase',
              color: gray[300],
              padding: `${space[4]}px ${space[5]}px ${space[2]}px`,
            }}
          >
            {group.label}
          </Box>
          {group.items.map((item) =>
            item.to ? (
              <Box key={item.label} component={NavLink} to={item.to} end sx={itemSx}>
                <Glyph>{item.icon}</Glyph>
                {item.label}
                {item.badge ? <Badge {...item.badge} /> : null}
              </Box>
            ) : (
              // Placeholder destinations the prototype shows but never built.
              <Box
                key={item.label}
                component="button"
                type="button"
                aria-disabled="true"
                sx={{ ...itemSx, cursor: 'default', opacity: 0.75 }}
              >
                <Glyph>{item.icon}</Glyph>
                {item.label}
                {item.badge ? <Badge {...item.badge} /> : null}
              </Box>
            ),
          )}
        </Box>
      ))}
    </Box>
  )
}
