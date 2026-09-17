import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { Breadcrumb } from '@/components/Breadcrumb'
import { Meter } from '@/components/Meter'
import { Panel } from '@/components/Panel'
import { PageHead } from '@/components/shell/AppShell'
import { NeutralBadge, RiskBadge } from '@/components/atoms'
import { UcmAlert } from '@/components/UcmAlert'
import { sessionActions } from '@/session/react'
import type { Caseload, CoordinatorId, Mrn } from '@/session/types'
import { gray, radius, risk, space, surface } from '@/theme/tokens'
import { toast } from '@/ui/toastApi'
import type { ComposerPrefill } from '../ManagerLayout'
import type { DrawerTarget } from '../ManagerDrawer'
import { initials, type ManagerOverview } from '../useManagerData'

export function ManagerCoordinators({
  overview,
  onOpenCoordinator,
  prefill,
}: {
  overview: ManagerOverview
  onOpenCoordinator: (target: DrawerTarget) => void
  prefill: ComposerPrefill | null
}) {
  const { caseloads, overCapacity } = overview

  return (
    <>
      <Breadcrumb trail={[{ label: 'Dashboard', to: '/manager/dashboard' }, { label: 'Coordinators' }]} />
      <PageHead title="Coordinators" sub={`${caseloads.length} on the team · capacity and contact rate`} />

      {overCapacity.length > 0 ? (
        <UcmAlert
          severity="warning"
          title={`${overCapacity.length} coordinator${overCapacity.length === 1 ? ' is' : 's are'} over capacity`}
        >
          {overCapacity.map((c) => `${c.coord.short} (+${c.overBy})`).join(', ')}. Consider
          redistributing before assigning anyone new.
        </UcmAlert>
      ) : null}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: `${space[4]}px`,
          marginBottom: `${space[6]}px`,
        }}
      >
        {caseloads.map((c) => (
          <CoordCard
            key={c.coord.id}
            caseload={c}
            onOpen={() => onOpenCoordinator({ kind: 'coordinator', id: c.coord.id })}
          />
        ))}
      </Box>

      <MessageComposer
        key={prefill ? `${prefill.coordId ?? ''}:${prefill.patientMrn ?? ''}` : 'default'}
        overview={overview}
        initialTo={prefill?.coordId ?? 'sarah'}
        initialPatient={prefill?.patientMrn ?? ''}
        autoFocus={prefill !== null}
      />
    </>
  )
}

function CoordCard({ caseload: c, onOpen }: { caseload: Caseload; onOpen: () => void }) {
  return (
    <Paper
      component="button"
      onClick={onOpen}
      sx={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: 0,
        overflow: 'hidden',
        cursor: 'pointer',
        fontFamily: 'inherit',
        borderColor: c.overBy ? risk.high.dot : surface.border,
        borderWidth: c.overBy ? 1.5 : 1,
        opacity: c.coord.away ? 0.72 : 1,
        transition: 'box-shadow 0.15s, border-color 0.15s',
        '&:hover': { boxShadow: 3, borderColor: c.overBy ? risk.high.dot : gray[300] },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: `${space[3]}px`,
          padding: `${space[4]}px ${space[5]}px`,
          borderBottom: `1px solid ${gray[100]}`,
        }}
      >
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: '50%',
            flexShrink: 0,
            backgroundColor: '#DDEAF8',
            color: '#2F5580',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            fontWeight: 800,
          }}
        >
          {initials(c.coord.name)}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography component="div" sx={{ fontSize: 15, fontWeight: 700 }}>
            {c.coord.short}
          </Typography>
          <Typography component="div" sx={{ fontSize: 11, color: gray[500] }}>
            {c.coord.team}
          </Typography>
        </Box>
        {c.coord.away ? (
          <NeutralBadge>PTO</NeutralBadge>
        ) : c.overBy ? (
          <RiskBadge tier="high" label="Over" />
        ) : null}
      </Box>

      <Box sx={{ padding: `${space[4]}px ${space[5]}px` }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: `${space[3]}px`,
            marginBottom: `${space[4]}px`,
          }}
        >
          <CardStat value={c.total} label="Caseload" />
          <CardStat value={c.high} label="High Risk" color={risk.high.text} />
          <CardStat
            value={c.uncontacted}
            label="Uncontacted"
            color={c.uncontacted ? risk.medium.text : risk.low.text}
          />
        </Box>
        <Meter
          value={c.total}
          capacity={c.capacity}
          left={`${c.total} of ${c.capacity} capacity`}
          right={c.contactRate === null ? '—' : `${c.contactRate}% contact rate`}
        />
      </Box>

      <Box
        sx={{
          padding: `${space[3]}px ${space[5]}px`,
          backgroundColor: gray[100],
          borderTop: `1px solid ${surface.border}`,
          fontSize: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography component="span" sx={{ fontSize: 12, color: gray[500] }}>
          Click to view caseload
        </Typography>
        <Typography component="span" sx={{ fontSize: 12, color: '#2F5580', fontWeight: 700 }}>
          View →
        </Typography>
      </Box>
    </Paper>
  )
}

function CardStat({
  value,
  label,
  color,
}: {
  value: number
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

/**
 * Initial values come from props rather than an effect. The caller remounts
 * this via `key` when the drawer's "Message X" routes here, so the prefill
 * lands as initial state instead of a second render pass.
 */
function MessageComposer({
  overview,
  initialTo,
  initialPatient,
  autoFocus,
}: {
  overview: ManagerOverview
  initialTo: CoordinatorId
  initialPatient: Mrn | ''
  autoFocus: boolean
}) {
  const [to, setTo] = useState<CoordinatorId>(initialTo)
  const [patientMrn, setPatientMrn] = useState<Mrn | ''>(initialPatient)
  const [body, setBody] = useState('')
  const [priority, setPriority] = useState(false)

  const byScore = [...overview.patients].sort((a, b) => b.patient.score - a.patient.score)

  return (
    <Panel title="Message a Coordinator" sub="Lands in their inbox immediately">
      <Box sx={{ display: 'flex', gap: `${space[4]}px`, flexWrap: 'wrap', marginBottom: `${space[4]}px` }}>
        <TextField
          select
          size="small"
          label="To"
          value={to}
          onChange={(event) => setTo(event.target.value as CoordinatorId)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ minWidth: 220 }}
        >
          {overview.caseloads.map((c) => (
            <MenuItem key={c.coord.id} value={c.coord.id}>
              {c.coord.short} ({c.total}){c.overBy ? ' — over' : ''}
              {c.coord.away ? ' — PTO' : ''}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label="Regarding patient"
          value={patientMrn}
          onChange={(event) => setPatientMrn(event.target.value as Mrn | '')}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ minWidth: 320, flex: 1 }}
        >
          <MenuItem value="">
            <em>— None —</em>
          </MenuItem>
          {byScore.map(({ patient, coordinatorName }) => (
            <MenuItem key={patient.mrn} value={patient.mrn}>
              {patient.name} · {patient.dx}
              {coordinatorName ? ` (${coordinatorName})` : ' (unassigned)'}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <TextField
        fullWidth
        multiline
        minRows={3}
        size="small"
        label="Message"
        autoFocus={autoFocus}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="e.g. Please prioritise the CHF patients discharged this week."
        slotProps={{ inputLabel: { shrink: true } }}
        sx={{ marginBottom: `${space[3]}px` }}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: `${space[4]}px`, flexWrap: 'wrap' }}>
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={priority}
              onChange={(event) => setPriority(event.target.checked)}
            />
          }
          label={
            <Typography component="span" sx={{ fontSize: 13 }}>
              Mark as priority
            </Typography>
          }
        />
        <Button
          variant="contained"
          disabled={!body.trim()}
          onClick={() => {
            const coord = overview.caseloads.find((c) => c.coord.id === to)?.coord
            const sent = sessionActions.message(to, body, {
              priority,
              patientMrn: patientMrn || null,
            })
            if (!sent) return
            setBody('')
            setPriority(false)
            toast('Message sent', `Delivered to ${coord?.short ?? 'coordinator'}.`, 'ok')
          }}
          sx={{ borderRadius: `${radius.sm}px` }}
        >
          Send Message
        </Button>
      </Box>
    </Panel>
  )
}
