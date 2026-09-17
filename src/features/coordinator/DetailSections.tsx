import { Box, Button, Typography } from '@mui/material'
import { Glyph, SectionLabel, SrcTag } from '@/components/atoms'
import type { NextBestAction, NbaTone, RiskFactor, SourceConflict } from '@/data/types'
import { brand, gray, radius, risk, source, space, surface } from '@/theme/tokens'
import { ProvenanceFooter } from './ProvenanceFooter'

/* ── Score composition ──────────────────────────────────────────────── */

export function ScoreMath({
  epicPts,
  sfdcPts,
  score,
}: {
  epicPts: number
  sfdcPts: number
  score: number
}) {
  return (
    <>
      <SectionLabel>How this score is composed</SectionLabel>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: `${space[3]}px`,
          flexWrap: 'wrap',
          backgroundColor: gray[100],
          borderRadius: `${radius.md}px`,
          padding: `${space[4]}px`,
          marginBottom: `${space[4]}px`,
        }}
      >
        <Part value={epicPts} color={source.epic.main} caption={['Clinical', 'Epic']} />
        <Op>+</Op>
        <Part value={sfdcPts} color={source.sfdc.main} caption={['Engagement', 'Salesforce']} />
        <Op>=</Op>
        <Part value={score} color={brand.maroon} caption={['Unified', 'Risk Score']} large />
      </Box>
      <Typography
        sx={{
          fontSize: 11,
          lineHeight: 1.5,
          color: gray[500],
          marginBottom: `${space[5]}px`,
        }}
      >
        Neither system can produce this score alone. Epic holds the clinical history; Salesforce
        holds the engagement history. This score exists only because both are read together.
      </Typography>
    </>
  )
}

function Part({
  value,
  color,
  caption,
  large,
}: {
  value: number
  color: string
  caption: [string, string]
  large?: boolean
}) {
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography
        component="div"
        sx={{ fontSize: large ? 26 : 20, fontWeight: 800, lineHeight: 1, color }}
      >
        {value}
      </Typography>
      <Typography
        component="div"
        sx={{
          fontSize: 9,
          color: gray[500],
          marginTop: '4px',
          textTransform: 'uppercase',
          letterSpacing: '0.6px',
          fontWeight: 700,
        }}
      >
        {caption[0]}
        <br />
        {caption[1]}
      </Typography>
    </Box>
  )
}

function Op({ children }: { children: string }) {
  return (
    <Box component="span" aria-hidden="true" sx={{ fontSize: 17, color: gray[300], fontWeight: 300 }}>
      {children}
    </Box>
  )
}

/* ── Contributing factors ───────────────────────────────────────────── */

export function FactorList({ factors }: { factors: readonly RiskFactor[] }) {
  return (
    <>
      <SectionLabel>Contributing factors</SectionLabel>
      <Box sx={{ marginBottom: `${space[5]}px` }}>
        {factors.map((factor) => {
          const up = factor.pts >= 0
          return (
            <Box
              key={factor.text}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: `${space[3]}px`,
                padding: `${space[3]}px 0`,
                borderBottom: `1px solid ${gray[100]}`,
                '&:last-child': { borderBottom: 'none' },
              }}
            >
              <Box
                component="span"
                aria-hidden="true"
                sx={{
                  fontSize: 9,
                  flexShrink: 0,
                  marginTop: '4px',
                  fontWeight: 700,
                  color: up ? risk.high.dot : risk.low.dot,
                }}
              >
                {up ? '▲' : '▼'}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 12.5, lineHeight: 1.5 }}>{factor.text}</Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: `${space[2]}px`,
                    marginTop: '4px',
                  }}
                >
                  <SrcTag system={factor.src} />
                  <Typography component="span" sx={{ fontSize: 11, fontWeight: 700, color: gray[500] }}>
                    {up ? '+' : '−'}
                    {Math.abs(factor.pts)} pts
                  </Typography>
                </Box>
              </Box>
            </Box>
          )
        })}
      </Box>
    </>
  )
}

/* ── Reconciled conflicts ───────────────────────────────────────────── */

export function ConflictList({ conflicts }: { conflicts: readonly SourceConflict[] }) {
  return (
    <>
      <SectionLabel>Reconciled by this app</SectionLabel>
      {conflicts.length === 0 ? (
        <Resolution>
          <strong>No conflicts.</strong> Epic and Salesforce agree on every field the coordinator
          needs for this patient.
        </Resolution>
      ) : (
        conflicts.map((conflict) => (
          <Box
            key={conflict.head}
            sx={{
              border: '1.5px solid #F5D78E',
              backgroundColor: '#FFFDF6',
              borderRadius: `${radius.md}px`,
              padding: `${space[4]}px`,
              marginBottom: `${space[3]}px`,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: `${space[2]}px`,
                fontSize: 12,
                fontWeight: 800,
                color: risk.medium.text,
                marginBottom: `${space[3]}px`,
              }}
            >
              <Glyph size={12}>⚠️</Glyph>
              {conflict.head}
            </Box>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                gap: `${space[3]}px`,
                alignItems: 'center',
                marginBottom: `${space[3]}px`,
              }}
            >
              <Side srcKey={conflict.a.src} value={conflict.a.value} />
              <Box
                component="span"
                aria-hidden="true"
                sx={{ fontSize: 10, fontWeight: 800, color: gray[300], letterSpacing: '1px' }}
              >
                VS
              </Box>
              <Side srcKey={conflict.b.src} value={conflict.b.value} />
            </Box>
            <Resolution>
              <strong>{conflict.verdict}</strong> {conflict.why}
            </Resolution>
          </Box>
        ))
      )}
    </>
  )
}

function Side({ srcKey, value }: { srcKey: SourceConflict['a']['src']; value: string }) {
  return (
    <Box
      sx={{
        backgroundColor: gray.white,
        border: `1px solid ${surface.border}`,
        borderRadius: `${radius.sm}px`,
        padding: `${space[2]}px ${space[3]}px`,
      }}
    >
      <SrcTag system={srcKey} />
      <Typography sx={{ fontSize: 13, fontWeight: 700, marginTop: '3px' }}>{value}</Typography>
    </Box>
  )
}

function Resolution({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: `${space[2]}px`,
        fontSize: 12,
        color: gray[700],
        // Maroon tint: this is the orchestration layer's own verdict.
        backgroundColor: source.app.bg,
        borderRadius: `${radius.sm}px`,
        padding: `${space[3]}px`,
        lineHeight: 1.5,
        '& strong': { color: brand.maroon },
      }}
    >
      <Box component="span" aria-hidden="true">
        ✓
      </Box>
      <Box>{children}</Box>
    </Box>
  )
}

/* ── Next best actions ──────────────────────────────────────────────── */

const TONE_BG: Record<NbaTone, string> = {
  call: '#E3F2FD',
  visit: brand.maroonTint,
  rx: risk.low.bg,
  alert: risk.medium.bg,
}

export function NextBestActions({ actions }: { actions: readonly NextBestAction[] }) {
  return (
    <>
      <SectionLabel>Next Best Actions</SectionLabel>
      {actions.map((action) => (
        <Box
          key={action.title}
          sx={{
            display: 'flex',
            gap: `${space[3]}px`,
            border: `1px solid ${surface.border}`,
            borderRadius: `${radius.md}px`,
            padding: `${space[4]}px`,
            marginBottom: `${space[3]}px`,
            backgroundColor: gray.white,
          }}
        >
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: `${radius.sm}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              backgroundColor: TONE_BG[action.tone],
            }}
          >
            <Glyph size={16}>{action.icon}</Glyph>
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              component="div"
              sx={{
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                color: action.ai ? source.agent.main : gray[500],
              }}
            >
              {action.label}
            </Typography>
            <Typography component="div" sx={{ fontSize: 14, fontWeight: 700, marginTop: '2px' }}>
              {action.title}
            </Typography>
            <Typography
              component="div"
              sx={{ fontSize: 13, color: gray[700], marginTop: '3px', lineHeight: 1.5 }}
            >
              {action.desc}
            </Typography>
            <ProvenanceFooter kind={action.prov} />
            <Box sx={{ display: 'flex', gap: `${space[2]}px`, marginTop: `${space[3]}px`, flexWrap: 'wrap' }}>
              {action.buttons.map((button) => (
                <Button
                  key={button.text}
                  size="small"
                  variant={
                    button.kind === 'primary'
                      ? 'contained'
                      : button.kind === 'secondary'
                        ? 'outlined'
                        : 'text'
                  }
                >
                  {button.text}
                </Button>
              ))}
            </Box>
          </Box>
        </Box>
      ))}
    </>
  )
}
