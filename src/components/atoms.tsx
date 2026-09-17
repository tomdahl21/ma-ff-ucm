import { Box, Typography, styled } from '@mui/material'
import type { ReactNode } from 'react'
import type { SourceKey } from '@/data/types'
import type { RiskTier } from '@/session/types'
import { gray, radius, risk, source, space } from '@/theme/tokens'

/* ── Source tag ─────────────────────────────────────────────────────
   The most-repeated atom in the app: an inline pill marking which system
   a value came from. Built as a plain styled span rather than a MUI Chip —
   Chip wraps its label in a span that the ::before dot can't escape, and
   this renders hundreds of times per page. */

const SRC_LABEL: Record<SourceKey, string> = {
  epic: 'Epic',
  sfdc: 'Salesforce',
  dc: 'Data Cloud',
  hc: 'Health Cloud',
  agent: 'Agentforce',
  mc: 'Marketing Cloud',
}

/** `dc` and `hc` are Salesforce products, so they borrow its colour. */
const SRC_COLOR: Record<SourceKey, { main: string; bg: string }> = {
  epic: source.epic,
  sfdc: source.sfdc,
  dc: source.sfdc,
  hc: source.sfdc,
  agent: source.agent,
  mc: source.mc,
}

const SrcPill = styled('span')({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 9,
  fontWeight: 800,
  letterSpacing: '0.7px',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
  padding: '2px 7px',
  borderRadius: 3,
  verticalAlign: 'middle',
  '&::before': {
    content: '""',
    width: 5,
    height: 5,
    borderRadius: '50%',
    flexShrink: 0,
    backgroundColor: 'currentColor',
  },
})

export function SrcTag({ system, label }: { system: SourceKey; label?: string }) {
  const c = SRC_COLOR[system]
  return (
    <SrcPill sx={{ color: c.main, backgroundColor: c.bg }}>{label ?? SRC_LABEL[system]}</SrcPill>
  )
}

/* ── Risk badge ─────────────────────────────────────────────────── */

const BadgePill = styled('span')({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 10px',
  borderRadius: radius.pill,
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.3px',
  whiteSpace: 'nowrap',
  '&::before': { content: '""', width: 7, height: 7, borderRadius: '50%', flexShrink: 0 },
})

const TIER_LABEL: Record<RiskTier, string> = { high: 'High', medium: 'Medium', low: 'Low' }

export function RiskBadge({ tier, label }: { tier: RiskTier; label?: string }) {
  const c = risk[tier]
  return (
    <BadgePill
      sx={{ backgroundColor: c.bg, color: c.text, '&::before': { backgroundColor: c.dot } }}
    >
      {label ?? TIER_LABEL[tier]}
    </BadgePill>
  )
}

export function NeutralBadge({ children }: { children: ReactNode }) {
  return (
    <BadgePill
      sx={{ backgroundColor: gray[100], color: gray[700], '&::before': { backgroundColor: gray[500] } }}
    >
      {children}
    </BadgePill>
  )
}

/* ── Score ring ─────────────────────────────────────────────────────
   A bordered circle, not an SVG arc — the number is the point, and the
   ring only carries the tier colour. */
export function ScoreRing({ score, tier, size = 60 }: { score: number; tier: RiskTier; size?: number }) {
  const c = risk[tier]
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.round(size * 0.35),
        fontWeight: 800,
        flexShrink: 0,
        backgroundColor: c.bg,
        color: c.text,
        border: `3px solid ${c.dot}`,
      }}
    >
      {score}
    </Box>
  )
}

/* ── Small typographic utilities ────────────────────────────────── */

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <Typography
      component="div"
      sx={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '1.2px',
        textTransform: 'uppercase',
        color: gray[500],
        marginBottom: `${space[3]}px`,
      }}
    >
      {children}
    </Typography>
  )
}

export function Muted({ children, sx }: { children: ReactNode; sx?: object }) {
  return (
    <Typography component="div" sx={{ fontSize: 12, color: gray[500], ...sx }}>
      {children}
    </Typography>
  )
}

/** Emoji stand in for icons throughout, as in the original. They carry no
 *  meaning a screen reader needs, so they're hidden from the a11y tree. */
export function Glyph({ children, size = 15 }: { children: ReactNode; size?: number }) {
  return (
    <Box component="span" aria-hidden="true" sx={{ fontSize: size, lineHeight: 1 }}>
      {children}
    </Box>
  )
}
