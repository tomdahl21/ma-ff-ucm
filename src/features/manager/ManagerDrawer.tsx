import { Box, Button, MenuItem, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { RiskBadge, NeutralBadge, SectionLabel } from '@/components/atoms'
import { KeyValue, KeyValueGrid } from '@/components/KeyValue'
import { Meter } from '@/components/Meter'
import { SideDrawer } from '@/components/SideDrawer'
import { UcmAlert } from '@/components/UcmAlert'
import { sessionActions } from '@/session/react'
import type { CoordinatorId, Mrn } from '@/session/types'
import { brand, gray, radius, risk, source, space } from '@/theme/tokens'
import { toast } from '@/ui/toastApi'
import type { ComposerPrefill } from './ManagerLayout'
import type { ManagerOverview } from './useManagerData'

export type DrawerTarget =
  | { kind: 'patient'; mrn: Mrn }
  | { kind: 'coordinator'; id: CoordinatorId }
  | null

export function ManagerDrawer({
  target,
  overview,
  onClose,
  onNavigate,
  onComposeMessage,
}: {
  target: DrawerTarget
  overview: ManagerOverview
  onClose: () => void
  onNavigate: (next: DrawerTarget) => void
  onComposeMessage: (prefill: ComposerPrefill) => void
}) {
  const navigate = useNavigate()

  const goCompose = (prefill: ComposerPrefill) => {
    onComposeMessage(prefill)
    onClose()
    navigate('/manager/coordinators')
  }

  if (target?.kind === 'patient') {
    return (
      <PatientDrawerContent
        mrn={target.mrn}
        overview={overview}
        onClose={onClose}
        onCompose={goCompose}
      />
    )
  }
  if (target?.kind === 'coordinator') {
    return (
      <CoordinatorDrawerContent
        id={target.id}
        overview={overview}
        onClose={onClose}
        onOpenPatient={(mrn) => onNavigate({ kind: 'patient', mrn })}
        onCompose={goCompose}
      />
    )
  }
  return <SideDrawer open={false} onClose={onClose} title="" />
}

/* ── Patient ─────────────────────────────────────────────────────── */

function PatientDrawerContent({
  mrn,
  overview,
  onClose,
  onCompose,
}: {
  mrn: Mrn
  overview: ManagerOverview
  onClose: () => void
  onCompose: (prefill: ComposerPrefill) => void
}) {
  const entry = overview.patients.find((p) => p.patient.mrn === mrn)
  const [assignTo, setAssignTo] = useState<CoordinatorId>(overview.suggested)

  if (!entry) return <SideDrawer open={false} onClose={onClose} title="" />
  const { patient, tier, days, coordinatorName } = entry

  const footer = patient.assignedTo ? (
    <>
      <Button
        variant="outlined"
        onClick={() => {
          sessionActions.unassign(patient.mrn)
          onClose()
          toast('Returned to queue', 'Patient is unassigned and back in the assignment queue.', 'info')
        }}
      >
        Return to queue
      </Button>
      <Button
        variant="text"
        onClick={() => onCompose({ coordId: patient.assignedTo!, patientMrn: patient.mrn })}
      >
        Message {coordinatorName?.split(' ')[0] ?? 'coordinator'}
      </Button>
    </>
  ) : (
    <>
      <TextField
        select
        size="small"
        value={assignTo}
        onChange={(event) => setAssignTo(event.target.value as CoordinatorId)}
        sx={{ minWidth: 180 }}
        slotProps={{ inputLabel: { shrink: true } }}
        label="Assign to"
      >
        {overview.caseloads.map((c) => (
          <MenuItem key={c.coord.id} value={c.coord.id}>
            {c.coord.short} ({c.total}){c.overBy ? ' — over' : ''}
            {c.coord.away ? ' — PTO' : ''}
          </MenuItem>
        ))}
      </TextField>
      <Button
        variant="contained"
        onClick={() => {
          const coord = overview.caseloads.find((c) => c.coord.id === assignTo)?.coord
          if (!sessionActions.assign(patient.mrn, assignTo, { priority: true }) || !coord) return
          onClose()
          toast(
            `Assigned to ${coord.short}`,
            `${patient.name} is now in ${coord.short.split(' ')[0]}'s queue. They've been notified.`,
            'assign',
          )
        }}
      >
        Assign
      </Button>
    </>
  )

  return (
    <SideDrawer
      open
      onClose={onClose}
      title={
        <>
          {patient.name}
          <RiskBadge tier={tier} />
        </>
      }
      sub={`MRN ${patient.mrn} · ${patient.age}${patient.sex} · ${patient.dx}`}
      footer={footer}
    >
      <SectionLabel>Unified risk score</SectionLabel>
      {patient.epicPts !== undefined && patient.sfdcPts !== undefined ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: `${space[5]}px`,
            backgroundColor: gray[100],
            padding: `${space[4]}px`,
            borderRadius: `${radius.md}px`,
            marginBottom: `${space[5]}px`,
          }}
        >
          <ScorePart value={patient.epicPts} color={source.epic.main} label="Epic" />
          <Box sx={{ color: gray[300] }}>+</Box>
          <ScorePart value={patient.sfdcPts} color={source.sfdc.main} label="Salesforce" />
          <Box sx={{ color: gray[300] }}>=</Box>
          <ScorePart value={patient.score} color={brand.maroon} label="Unified" large />
        </Box>
      ) : (
        // The legacy drawer guessed `score * 0.58` here, which disagreed with
        // the coordinator view for 8 of the 9 patients that had a real split.
        <Typography
          sx={{
            fontSize: 12,
            color: gray[500],
            backgroundColor: gray[100],
            padding: `${space[4]}px`,
            borderRadius: `${radius.md}px`,
            marginBottom: `${space[5]}px`,
            lineHeight: 1.6,
          }}
        >
          Unified score <strong style={{ color: gray[900] }}>{patient.score}</strong>. No
          Epic/Salesforce breakdown has been published for this patient, so none is shown.
        </Typography>
      )}

      <SectionLabel>Record</SectionLabel>
      <Box sx={{ marginBottom: `${space[5]}px` }}>
        <KeyValueGrid>
          <KeyValue label="Diagnosis" value={patient.dx} src="epic" />
          <KeyValue label="Discharged" value={`${days} days ago`} src="epic" />
          <KeyValue
            label="Coordinator"
            value={
              coordinatorName ?? (
                <Box component="span" sx={{ color: risk.high.text }}>
                  Unassigned
                </Box>
              )
            }
            src="hc"
          />
          <KeyValue
            label="Last contact"
            value={
              patient.contacted ? (
                (patient.lastOutcome ?? 'Contacted')
              ) : (
                <Box component="span" sx={{ color: risk.high.text }}>
                  Never
                </Box>
              )
            }
            src="sfdc"
          />
          <KeyValue label="Risk tier" value={tier[0]!.toUpperCase() + tier.slice(1)} src="dc" />
          <KeyValue label="Hours since" value={`${patient.hoursSince}h`} src="epic" />
        </KeyValueGrid>
      </Box>

      {!patient.contacted && tier === 'high' ? (
        <UcmAlert severity="error" title="High risk and never contacted">
          This is the highest-value intervention available. Every hour past the contact window
          raises readmission probability.
        </UcmAlert>
      ) : null}
    </SideDrawer>
  )
}

function ScorePart({
  value,
  color,
  label,
  large,
}: {
  value: number
  color: string
  label: string
  large?: boolean
}) {
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography component="div" sx={{ fontSize: large ? 26 : 18, fontWeight: 800, color }}>
        {value}
      </Typography>
      <Typography
        component="div"
        sx={{
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: '0.7px',
          color: gray[500],
          fontWeight: 700,
          marginTop: '3px',
        }}
      >
        {label}
      </Typography>
    </Box>
  )
}

/* ── Coordinator ─────────────────────────────────────────────────── */

function CoordinatorDrawerContent({
  id,
  overview,
  onClose,
  onOpenPatient,
  onCompose,
}: {
  id: CoordinatorId
  overview: ManagerOverview
  onClose: () => void
  onOpenPatient: (mrn: Mrn) => void
  onCompose: (prefill: ComposerPrefill) => void
}) {
  const caseload = overview.caseloads.find((c) => c.coord.id === id)
  if (!caseload) return <SideDrawer open={false} onClose={onClose} title="" />

  const sorted = overview.patients
    .filter((p) => p.patient.assignedTo === id)
    .sort((a, b) => {
      // Uncontacted first, then by score — the manager's actual priority.
      if (a.patient.contacted !== b.patient.contacted) return a.patient.contacted ? 1 : -1
      return b.patient.score - a.patient.score
    })

  return (
    <SideDrawer
      open
      onClose={onClose}
      title={
        <>
          {caseload.coord.short}
          {caseload.coord.away ? <NeutralBadge>PTO</NeutralBadge> : null}
        </>
      }
      sub={`${caseload.coord.team} · ${caseload.total} patients`}
      footer={
        <>
          <Button variant="contained" onClick={() => onCompose({ coordId: id })}>
            Message {caseload.coord.short.split(' ')[0]}
          </Button>
          <Button variant="text" onClick={onClose}>
            Close
          </Button>
        </>
      }
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: `${space[3]}px`,
          marginBottom: `${space[4]}px`,
        }}
      >
        <DrawerStat value={caseload.total} label="Caseload" />
        <DrawerStat value={caseload.high} label="High Risk" color={risk.high.text} />
        <DrawerStat
          value={caseload.contactRate === null ? '—' : `${caseload.contactRate}%`}
          label="Contact Rate"
        />
      </Box>

      <Box sx={{ marginBottom: `${space[5]}px` }}>
        <Meter
          value={caseload.total}
          capacity={caseload.capacity}
          left={`${caseload.total} of ${caseload.capacity} capacity`}
          right={caseload.overBy ? `Over by ${caseload.overBy}` : 'Within capacity'}
        />
      </Box>

      {caseload.uncontacted > 0 ? (
        <UcmAlert
          severity="warning"
          title={`${caseload.uncontacted} patient${caseload.uncontacted === 1 ? '' : 's'} not yet contacted`}
        >
          Listed first below.
        </UcmAlert>
      ) : null}

      <SectionLabel>Caseload — uncontacted first, then highest risk</SectionLabel>
      {sorted.length === 0 ? (
        <Typography sx={{ fontSize: 13, color: gray[500] }}>No patients assigned.</Typography>
      ) : (
        sorted.map(({ patient, tier }) => (
          <Box
            key={patient.mrn}
            component="button"
            type="button"
            onClick={() => onOpenPatient(patient.mrn)}
            sx={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              background: 'none',
              border: 0,
              borderBottom: `1px solid ${gray[100]}`,
              padding: `${space[3]}px 0`,
              cursor: 'pointer',
              fontFamily: 'inherit',
              '&:hover': { backgroundColor: gray[100] },
            }}
          >
            <Typography sx={{ fontSize: 12.5, lineHeight: 1.5 }}>
              <strong>{patient.name}</strong> · {patient.dx}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: `${space[2]}px`,
                marginTop: '4px',
                flexWrap: 'wrap',
              }}
            >
              <RiskBadge tier={tier} />
              <Typography component="span" sx={{ fontSize: 11, fontWeight: 700, color: gray[500] }}>
                Score {patient.score}
              </Typography>
              {patient.contacted ? (
                <Typography component="span" sx={{ fontSize: 10, color: gray[500] }}>
                  {patient.lastOutcome ?? 'Contacted'}
                </Typography>
              ) : (
                <Typography
                  component="span"
                  sx={{ fontSize: 10, fontWeight: 700, color: risk.high.text }}
                >
                  NEVER CONTACTED
                </Typography>
              )}
            </Box>
          </Box>
        ))
      )}
    </SideDrawer>
  )
}

function DrawerStat({
  value,
  label,
  color,
}: {
  value: ReactNodeLike
  label: string
  color?: string
}) {
  return (
    <Box>
      <Typography component="div" sx={{ fontSize: 20, fontWeight: 800, lineHeight: 1, color }}>
        {value}
      </Typography>
      <Typography
        component="div"
        sx={{
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: '0.7px',
          color: gray[500],
          fontWeight: 700,
          marginTop: '3px',
        }}
      >
        {label}
      </Typography>
    </Box>
  )
}

type ReactNodeLike = string | number
