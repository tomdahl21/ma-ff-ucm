import { Box, Button } from '@mui/material'
import { useCallback, useMemo, useState } from 'react'
import { Panel } from '@/components/Panel'
import { StatRow, StatTile } from '@/components/StatRow'
import { UcmAlert } from '@/components/UcmAlert'
import { DemoResetButton } from '@/components/DemoResetButton'
import { FilterChips, type FilterOption } from '@/components/FilterChips'
import { Timeline } from '@/components/Timeline'
import { AppShell, PageHead } from '@/components/shell/AppShell'
import type { NavGroup } from '@/components/shell/SideNav'
import type { ProvNode } from '@/components/shell/ProvenanceBar'
import { ProvBarCta } from '@/components/shell/ProvenanceBar'
import { DEMO_TODAY } from '@/data/demoClock'
import { sessionActions, useSessionEvent, useSettings } from '@/session/react'
import type { CoordinatorId, Mrn, Patient } from '@/session/types'
import { layout, space } from '@/theme/tokens'
import { toast } from '@/ui/toastApi'
import { DelegationBanners } from './DelegationBanners'
import { InboxBell } from './InboxBell'
import { PatientDetailPanel } from './PatientDetailPanel'
import { TriageTable } from './TriageTable'
import { buildTimeline } from './buildTimeline'
import { resolveSelection, useCaseload } from './useCaseload'

const ME: CoordinatorId = 'sarah'

const USER = { name: 'Sarah Lin, RN', role: 'Care Coordinator', initials: 'SL' }

const PROVENANCE: ProvNode[] = [
  { name: 'Epic EHR', meta: 'synced 4h 12m ago', status: 'lag' },
  { name: 'Data Cloud', meta: 'risk scores · 22m ago', status: 'live' },
  { name: 'Health Cloud', meta: 'live read/write', status: 'live', flow: '·' },
  { name: 'Agentforce', meta: '12 actions generated', status: 'live' },
]

type QueueFilter = 'all' | 'high' | 'uncontacted'

export function CoordinatorPage() {
  const caseload = useCaseload(ME)
  const settings = useSettings()
  const [requestedMrn, setRequestedMrn] = useState<Mrn | null>(null)
  const [filter, setFilter] = useState<QueueFilter>('all')

  const selected = resolveSelection(caseload, requestedMrn)

  const visibleRows = useMemo(() => {
    if (filter === 'high') return caseload.rows.filter((r) => r.tier === 'high')
    if (filter === 'uncontacted') return caseload.rows.filter((r) => !r.patient.contacted)
    return caseload.rows
  }, [caseload.rows, filter])

  /* Patients the manager just handed over and we haven't acknowledged. */
  const pendingDelegations = useMemo(
    () =>
      caseload.rows
        .filter((r) => r.patient.assignedAt != null && r.patient.acknowledged === false)
        .map((r) => r.patient),
    [caseload.rows],
  )

  const approachingWindow = useMemo(
    () =>
      caseload.rows.filter(
        (r) => !r.patient.contacted && r.patient.hoursSince >= settings.contactWindowHours,
      ),
    [caseload.rows, settings.contactWindowHours],
  )

  /* Toasts fire from tagged events, so exactly once per event rather than
     once per render. */
  useSessionEvent(
    useCallback((event, state) => {
      if (event.type === 'assign' && event.coordId === ME) {
        const patient = state.patients.find((p) => p.mrn === event.mrn)
        if (patient) {
          toast(
            'New patient assigned',
            `James Porter assigned you ${patient.name} — risk ${patient.score}.`,
            'assign',
          )
        }
      }
      if (event.type === 'message' && event.coordId === ME) {
        const message = state.messages.find((m) => m.id === event.messageId)
        if (message) {
          toast(
            'Message from James Porter',
            message.body.length > 90 ? `${message.body.slice(0, 90)}…` : message.body,
            'info',
          )
        }
      }
    }, []),
  )

  const handleLogOutcome = useCallback(
    (outcome: string, note: string) => {
      if (!selected) return
      sessionActions.logCall(selected.patient.mrn, ME, outcome, note)
      toast('Outcome saved', 'Written to Health Cloud. Manager activity feed updated.', 'ok')
    },
    [selected],
  )

  const handleAccept = useCallback((patient: Patient) => {
    sessionActions.acknowledge(patient.mrn, ME)
    toast('Acknowledged', 'James Porter has been notified you picked this up.', 'ok')
  }, [])

  const handleDecline = useCallback((patient: Patient) => {
    sessionActions.unassign(patient.mrn)
    toast('Returned to manager', 'Patient sent back to the unassigned queue.', 'info')
  }, [])

  const nav: NavGroup[] = [
    {
      label: 'Triage',
      items: [
        { label: 'My Patient Queue', icon: '⚠️', to: '/coordinator', badge: { count: caseload.total } },
        {
          label: 'Callbacks Due',
          icon: '📞',
          badge: { count: caseload.counts.uncontacted, alert: true },
        },
        { label: 'Completed Today', icon: '✓' },
      ],
    },
    {
      label: 'Tools',
      items: [
        { label: 'Patient Search', icon: '🔍' },
        { label: 'Care Protocols', icon: '📋' },
      ],
    },
    { label: 'Account', items: [{ label: 'Settings', icon: '⚙️' }] },
  ]

  const filters: FilterOption<QueueFilter>[] = [
    { id: 'all', label: 'All', count: caseload.total },
    { id: 'high', label: 'High Risk', count: caseload.counts.high },
    { id: 'uncontacted', label: 'Uncontacted', count: caseload.counts.uncontacted },
  ]

  return (
    <AppShell
      user={USER}
      nav={nav}
      provenance={PROVENANCE}
      provenanceTrailing={<ProvBarCta>View data lineage</ProvBarCta>}
      appBarRight={<InboxBell coordId={ME} />}
    >
      <PageHead
        title="My Patient Queue"
        sub={`${caseload.total} patients assigned · sorted by readmission risk · ${DEMO_TODAY}`}
      />

      <DelegationBanners
        patients={pendingDelegations}
        onAccept={handleAccept}
        onDecline={handleDecline}
      />

      {approachingWindow.length > 0 ? (
        <UcmAlert
          severity="error"
          title={`${approachingWindow.length} high-risk patient${
            approachingWindow.length === 1 ? '' : 's'
          } past the ${settings.contactWindowHours}-hour window`}
          action={
            <Button size="small" variant="contained" onClick={() => setFilter('uncontacted')}>
              Show Only These
            </Button>
          }
        >
          Contact within the first {settings.contactWindowHours} hours post-discharge is the
          strongest predictor of avoided readmission. These patients have not yet been reached.
        </UcmAlert>
      ) : null}

      <StatRow columns={4}>
        <StatTile label="High Risk" value={caseload.counts.high} sub="in my queue" tone="red" />
        <StatTile label="Medium Risk" value={caseload.counts.medium} sub="in my queue" tone="amber" />
        <StatTile label="Low Risk" value={caseload.counts.low} sub="monitoring only" tone="green" />
        <StatTile
          label="Uncontacted"
          value={caseload.counts.uncontacted}
          sub="never reached since discharge"
          alert={caseload.counts.uncontacted > 0}
        />
      </StatRow>

      <Box
        sx={{
          display: 'flex',
          gap: `${space[6]}px`,
          alignItems: 'flex-start',
          [`@media (max-width: ${layout.workAreaStack}px)`]: { flexDirection: 'column' },
        }}
      >
        {/* ── Queue ── */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Panel
            title="Patient Triage List"
            sub="Risk scores from Salesforce Data Cloud · updated 22 minutes ago"
            flush
          >
            <Box sx={{ padding: `${space[4]}px ${space[5]}px`, borderBottom: '1px solid', borderColor: 'divider' }}>
              <FilterChips
                label="Filter queue"
                options={filters}
                value={filter}
                onChange={setFilter}
              />
            </Box>
            <TriageTable
              rows={visibleRows}
              selectedMrn={selected?.patient.mrn}
              onSelect={setRequestedMrn}
            />
          </Panel>
        </Box>

        {/* ── Detail rail ── */}
        <Box
          sx={{
            width: layout.detailRailW,
            flexShrink: 0,
            position: 'sticky',
            top: layout.appBarH + layout.provBarH + space[5],
            [`@media (max-width: ${layout.workAreaStack}px)`]: {
              width: '100%',
              position: 'static',
            },
          }}
        >
          {selected ? (
            <>
              <PatientDetailPanel row={selected} onLogOutcome={handleLogOutcome} />
              <Panel
                title="Recent Activity"
                sub={`${selected.patient.name} · unified Epic + Salesforce timeline`}
              >
                <Timeline items={buildTimeline(selected)} />
              </Panel>
            </>
          ) : null}
        </Box>
      </Box>

      {/* Announce rail changes, which are otherwise silent to screen readers. */}
      <Box className="sr-only" role="status" aria-live="polite">
        {selected ? `Selected ${selected.patient.name}, risk score ${selected.patient.score}` : ''}
      </Box>

      <DemoResetButton onReset={() => setRequestedMrn(null)} />
    </AppShell>
  )
}
