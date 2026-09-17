import { useCallback, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router'
import { DemoResetButton } from '@/components/DemoResetButton'
import { AppShell } from '@/components/shell/AppShell'
import type { NavGroup } from '@/components/shell/SideNav'
import type { ProvNode } from '@/components/shell/ProvenanceBar'
import { ProvBarCta } from '@/components/shell/ProvenanceBar'
import { sessionActions, useSessionEvent } from '@/session/react'
import type { Mrn, Patient } from '@/session/types'
import { toast } from '@/ui/toastApi'
import { DelegationBanners } from './DelegationBanners'
import { InboxBell } from './InboxBell'
import { CoordinatorCallbacks } from './views/CoordinatorCallbacks'
import { CoordinatorCompleted } from './views/CoordinatorCompleted'
import { CoordinatorProtocols } from './views/CoordinatorProtocols'
import { CoordinatorQueue } from './views/CoordinatorQueue'
import { CoordinatorSearch } from './views/CoordinatorSearch'
import { CoordinatorSettings } from './views/CoordinatorSettings'
import { ME } from './me'
import { useCaseload } from './useCaseload'

const USER = { name: 'Sarah Lin, RN', role: 'Care Coordinator', initials: 'SL' }

const PROVENANCE: ProvNode[] = [
  { name: 'Epic EHR', meta: 'synced 4h 12m ago', status: 'lag' },
  { name: 'Data Cloud', meta: 'risk scores · 22m ago', status: 'live' },
  { name: 'Health Cloud', meta: 'live read/write', status: 'live', flow: '·' },
  { name: 'Agentforce', meta: '12 actions generated', status: 'live' },
]

export function CoordinatorLayout() {
  const caseload = useCaseload(ME)
  const navigate = useNavigate()

  /* Selection lives here rather than in the queue view, so jumping to a
     patient from Callbacks or Search lands on them in the queue. */
  const [selectedMrn, setSelectedMrn] = useState<Mrn | null>(null)

  const openInQueue = useCallback(
    (mrn: Mrn) => {
      setSelectedMrn(mrn)
      navigate('/coordinator')
    },
    [navigate],
  )

  const pendingDelegations = useMemo(
    () =>
      caseload.rows
        .filter((r) => r.patient.assignedAt != null && r.patient.acknowledged === false)
        .map((r) => r.patient),
    [caseload.rows],
  )

  /* Toasts come from tagged events, so they fire once per event rather than
     once per render — and they follow the coordinator across every view. */
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
        {
          label: 'My Patient Queue',
          icon: '⚠️',
          to: '/coordinator',
          badge: { count: caseload.total },
        },
        {
          label: 'Callbacks Due',
          icon: '📞',
          to: '/coordinator/callbacks',
          badge: { count: caseload.counts.callbacks, alert: true },
        },
        { label: 'Completed Today', icon: '✓', to: '/coordinator/completed' },
      ],
    },
    {
      label: 'Tools',
      items: [
        { label: 'Patient Search', icon: '🔍', to: '/coordinator/search' },
        { label: 'Care Protocols', icon: '📋', to: '/coordinator/protocols' },
      ],
    },
    {
      label: 'Account',
      items: [{ label: 'Settings', icon: '⚙️', to: '/coordinator/settings' }],
    },
  ]

  return (
    <AppShell
      user={USER}
      nav={nav}
      provenance={PROVENANCE}
      provenanceTrailing={<ProvBarCta>View data lineage</ProvBarCta>}
      appBarRight={<InboxBell coordId={ME} />}
    >
      {/* An unacknowledged handover is an interrupt — it follows you across
          every view rather than only showing on the queue. */}
      <DelegationBanners
        patients={pendingDelegations}
        onAccept={handleAccept}
        onDecline={handleDecline}
      />

      <Routes>
        <Route
          index
          element={
            <CoordinatorQueue
              caseload={caseload}
              selectedMrn={selectedMrn}
              onSelect={setSelectedMrn}
            />
          }
        />
        <Route
          path="callbacks"
          element={<CoordinatorCallbacks caseload={caseload} onOpenPatient={openInQueue} />}
        />
        <Route path="completed" element={<CoordinatorCompleted caseload={caseload} />} />
        <Route
          path="search"
          element={<CoordinatorSearch caseload={caseload} onOpenPatient={openInQueue} />}
        />
        <Route path="protocols" element={<CoordinatorProtocols caseload={caseload} />} />
        <Route path="settings" element={<CoordinatorSettings caseload={caseload} />} />
        <Route path="*" element={<Navigate to="/coordinator" replace />} />
      </Routes>

      <DemoResetButton onReset={() => setSelectedMrn(null)} />
    </AppShell>
  )
}
