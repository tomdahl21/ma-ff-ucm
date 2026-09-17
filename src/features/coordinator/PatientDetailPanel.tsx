import { Box, Divider, Paper, Tab, Tabs, Typography } from '@mui/material'
import { useState } from 'react'
import { Glyph, RiskBadge, ScoreRing, SectionLabel, SrcTag } from '@/components/atoms'
import { Timeline } from '@/components/Timeline'
import { gray, radius, risk, space, surface } from '@/theme/tokens'
import { ConflictList, FactorList, NextBestActions, ScoreMath } from './DetailSections'
import { LogOutcomeForm } from './LogOutcomeForm'
import { buildTimeline } from './buildTimeline'
import type { CaseloadRow } from './useCaseload'

type TabKey = 'actions' | 'timeline' | 'details'

export function PatientDetailPanel({
  row,
  onLogOutcome,
}: {
  row: CaseloadRow
  onLogOutcome: (outcome: string, note: string) => void
}) {
  const [tab, setTab] = useState<TabKey>('actions')
  const { patient, tier, detail } = row
  const headingId = 'patient-detail-name'

  return (
    <Paper id="patient-detail" aria-labelledby={headingId} sx={{ overflow: 'hidden', marginBottom: `${space[6]}px` }}>
      {/* ── Header ── */}
      <Box sx={{ padding: `${space[5]}px`, borderBottom: `1px solid ${surface.border}` }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: `${space[3]}px`,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography id={headingId} component="h2" sx={{ fontSize: 19, fontWeight: 700 }}>
              {patient.name}
            </Typography>
            <Typography sx={{ fontSize: 12, color: gray[500], marginTop: '2px' }}>
              MRN {patient.mrn} · {patient.age}
              {patient.sex}
              {detail ? ` · Discharged ${detail.dischargedOn}` : null}
            </Typography>
          </Box>
          <RiskBadge tier={tier} label={`${tier === 'high' ? 'High' : tier === 'medium' ? 'Medium' : 'Low'} Risk`} />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: `${space[4]}px`, marginTop: `${space[4]}px` }}>
          <ScoreRing score={patient.score} tier={tier} />
          <Typography component="div" sx={{ fontSize: 11, color: gray[500], lineHeight: 1.6 }}>
            <Box component="strong" sx={{ color: gray[900], fontSize: 12 }}>
              Readmission Risk Score
            </Box>
            <br />
            Source: Salesforce Data Cloud
            <br />
            As of Sep 17, 9:42 AM · Model v2.3
          </Typography>
        </Box>
      </Box>

      {/* ── Tabs — functional now; the legacy page rendered them inert ── */}
      <Tabs
        value={tab}
        onChange={(_event, next: TabKey) => setTab(next)}
        aria-label="Patient detail sections"
        sx={{ paddingX: `${space[5]}px` }}
      >
        <Tab label="Actions" value="actions" id="tab-actions" aria-controls="panel-actions" />
        <Tab label="Timeline" value="timeline" id="tab-timeline" aria-controls="panel-timeline" />
        <Tab label="Details" value="details" id="tab-details" aria-controls="panel-details" />
      </Tabs>

      {tab === 'actions' ? (
        <Box role="tabpanel" id="panel-actions" aria-labelledby="tab-actions" sx={{ padding: `${space[5]}px` }}>
          <StaleSyncNotice />
          {patient.epicPts !== undefined && patient.sfdcPts !== undefined ? (
            <ScoreMath epicPts={patient.epicPts} sfdcPts={patient.sfdcPts} score={patient.score} />
          ) : (
            <NoBreakdownNotice />
          )}
          {detail ? <FactorList factors={detail.factors} /> : null}
          {detail ? (
            <>
              <Divider sx={{ marginY: `${space[5]}px` }} />
              <NextBestActions actions={detail.actions} />
            </>
          ) : null}
          <Divider sx={{ marginY: `${space[5]}px` }} />
          {/* Keyed so switching patients clears any half-typed draft. */}
          <LogOutcomeForm key={patient.mrn} patient={patient} onSubmit={onLogOutcome} />
        </Box>
      ) : null}

      {tab === 'timeline' ? (
        <Box role="tabpanel" id="panel-timeline" aria-labelledby="tab-timeline" sx={{ padding: `${space[5]}px` }}>
          {detail ? (
            <Timeline items={buildTimeline(row)} />
          ) : (
            <Typography sx={{ fontSize: 13, color: gray[500] }}>
              No detailed timeline has been authored for this patient.
            </Typography>
          )}
        </Box>
      ) : null}

      {tab === 'details' ? (
        <Box role="tabpanel" id="panel-details" aria-labelledby="tab-details" sx={{ padding: `${space[5]}px` }}>
          <SectionLabel>Demographics</SectionLabel>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: `${space[3]}px`,
              marginBottom: `${space[5]}px`,
            }}
          >
            <KeyValue label="MRN" value={patient.mrn} src="epic" />
            <KeyValue label="Age / Sex" value={`${patient.age} · ${patient.sex}`} src="epic" />
            <KeyValue label="Primary Diagnosis" value={patient.dx} src="epic" />
            <KeyValue
              label="Days Since Discharge"
              value={String(row.days)}
              src="epic"
            />
            <KeyValue
              label="Assigned To"
              value={patient.assignedTo ? 'Sarah Lin, RN' : 'Unassigned'}
              src="hc"
            />
            <KeyValue
              label="Last Contact"
              value={patient.contacted ? (patient.lastOutcome ?? 'Contacted') : 'Never'}
              src="sfdc"
            />
          </Box>

          {detail ? (
            <>
              <Divider sx={{ marginY: `${space[5]}px` }} />
              <ConflictList conflicts={detail.conflicts} />
            </>
          ) : null}
        </Box>
      ) : null}
    </Paper>
  )
}

function KeyValue({
  label,
  value,
  src,
}: {
  label: string
  value: string
  src: 'epic' | 'sfdc' | 'hc'
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

function StaleSyncNotice() {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: `${space[2]}px`,
        fontSize: 11,
        color: risk.medium.text,
        backgroundColor: risk.medium.bg,
        padding: `6px ${space[4]}px`,
        borderRadius: `${radius.sm}px`,
        marginBottom: `${space[4]}px`,
      }}
    >
      <Glyph size={12}>⚠️</Glyph> Epic data last synced 4h 12m ago — scores may be stale
    </Box>
  )
}

/** Shown instead of a fabricated split. The legacy manager drawer guessed
 *  `score * 0.58` here, which disagreed with the coordinator page. */
function NoBreakdownNotice() {
  return (
    <>
      <SectionLabel>How this score is composed</SectionLabel>
      <Typography
        sx={{
          fontSize: 12,
          color: gray[500],
          lineHeight: 1.6,
          backgroundColor: gray[100],
          borderRadius: `${radius.md}px`,
          padding: `${space[4]}px`,
          marginBottom: `${space[5]}px`,
        }}
      >
        No Epic/Salesforce breakdown has been published for this patient. The unified score is
        available, but its composition is not — so none is shown rather than an estimate.
      </Typography>
    </>
  )
}
