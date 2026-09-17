import { Box, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { brand, feedback, gray, layout, risk, space, surface } from '@/theme/tokens'

export type ProvStatus = 'live' | 'lag' | 'down'

export interface ProvNode {
  name: string
  meta: string
  status: ProvStatus
  /** Glyph shown between this node and the next. */
  flow?: '→' | '·'
}

const DOT: Record<ProvStatus, { color: string; halo: string }> = {
  live: { color: feedback.success, halo: 'rgba(46,125,50,0.15)' },
  lag: { color: risk.medium.dot, halo: 'rgba(245,158,11,0.18)' },
  down: { color: feedback.error, halo: 'rgba(198,40,40,0.15)' },
}

/**
 * The strip under the app bar showing live connection state to every upstream
 * system. Sticky beneath the app bar, and horizontally scrollable rather than
 * wrapping — it's a status line, not content.
 */
export function ProvenanceBar({ nodes, trailing }: { nodes: ProvNode[]; trailing?: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: `${space[5]}px`,
        backgroundColor: gray.white,
        borderBottom: `1px solid ${surface.border}`,
        padding: `${space[2]}px ${space[6]}px`,
        fontSize: 11,
        overflowX: 'auto',
        position: 'sticky',
        top: layout.appBarH,
        zIndex: (theme) => theme.zIndex.appBar - 10,
      }}
    >
      <Typography
        component="div"
        sx={{
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          color: gray[300],
          flexShrink: 0,
          paddingRight: `${space[2]}px`,
          borderRight: `1px solid ${surface.border}`,
        }}
      >
        Connected Sources
      </Typography>

      {nodes.map((node, i) => (
        <Box key={node.name} sx={{ display: 'flex', alignItems: 'center', gap: `${space[5]}px` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: `${space[2]}px`, flexShrink: 0 }}>
            <Box
              sx={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                flexShrink: 0,
                backgroundColor: DOT[node.status].color,
                boxShadow: `0 0 0 3px ${DOT[node.status].halo}`,
              }}
            />
            <Box component="span" sx={{ fontWeight: 700, color: gray[900] }}>
              {node.name}
            </Box>
            <Box component="span" sx={{ color: gray[500] }}>
              {node.meta}
            </Box>
          </Box>
          {i < nodes.length - 1 ? (
            <Box
              component="span"
              aria-hidden="true"
              sx={{ color: gray[300], fontSize: 13, flexShrink: 0 }}
            >
              {node.flow ?? '→'}
            </Box>
          ) : null}
        </Box>
      ))}

      <Box sx={{ flex: 1, minWidth: `${space[4]}px` }} />
      {trailing ? <Box sx={{ flexShrink: 0 }}>{trailing}</Box> : null}
    </Box>
  )
}

/** Styled like the legacy `.prov-bar__cta` — maroon regardless of role,
 *  because it links to this layer's own lineage view. */
export function ProvBarCta({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        background: 'none',
        border: 0,
        cursor: 'pointer',
        flexShrink: 0,
        fontSize: 11,
        fontWeight: 700,
        fontFamily: 'inherit',
        color: brand.maroon,
        borderBottom: '1px solid currentColor',
        paddingBottom: '1px',
      }}
    >
      {children}
    </Box>
  )
}
