import { Navigate, Route, Routes } from 'react-router'
import { useState } from 'react'
import { DemoResetButton } from '@/components/DemoResetButton'
import { AppShell } from '@/components/shell/AppShell'
import type { NavGroup } from '@/components/shell/SideNav'
import type { ProvNode } from '@/components/shell/ProvenanceBar'
import { ProvBarCta } from '@/components/shell/ProvenanceBar'
import type { CoordinatorId, Mrn } from '@/session/types'
import { ManagerAssignment } from './views/ManagerAssignment'
import { ManagerCoordinators } from './views/ManagerCoordinators'
import { ManagerDashboard } from './views/ManagerDashboard'
import { ManagerPatients } from './views/ManagerPatients'
import { ManagerPerformance } from './views/ManagerPerformance'
import { ManagerSettings } from './views/ManagerSettings'
import { ManagerDrawer, type DrawerTarget } from './ManagerDrawer'
import { useManagerOverview } from './useManagerData'

const USER = { name: 'James Porter', role: 'Manager, Care Coordination', initials: 'JP' }

const PROVENANCE: ProvNode[] = [
  { name: 'Epic EHR', meta: 'synced 4h 12m ago', status: 'lag' },
  { name: 'Data Cloud', meta: 'risk scores · 22m ago', status: 'live' },
  { name: 'Health Cloud', meta: 'live read/write', status: 'live', flow: '·' },
  { name: 'Agentforce', meta: '12 actions generated', status: 'live' },
]

/** Prefill carried when the drawer's "Message X" jumps to the composer. */
export interface ComposerPrefill {
  coordId?: CoordinatorId
  patientMrn?: Mrn
}

export function ManagerLayout() {
  const overview = useManagerOverview()
  const [drawer, setDrawer] = useState<DrawerTarget>(null)
  const [prefill, setPrefill] = useState<ComposerPrefill | null>(null)

  const nav: NavGroup[] = [
    {
      label: 'Oversight',
      items: [
        { label: 'Dashboard', icon: '📊', to: '/manager/dashboard' },
        {
          label: 'Needs Assignment',
          icon: '🔴',
          to: '/manager/assignment',
          badge: { count: overview.unassigned.length, alert: true },
        },
        {
          label: 'All Patients',
          icon: '👥',
          to: '/manager/patients',
          badge: { count: overview.total },
        },
      ],
    },
    {
      label: 'Team',
      items: [
        {
          label: 'Coordinators',
          icon: '🧑‍⚕️',
          to: '/manager/coordinators',
          badge: { count: overview.caseloads.length },
        },
        { label: 'Performance', icon: '📈', to: '/manager/performance' },
      ],
    },
    { label: 'Account', items: [{ label: 'Settings', icon: '⚙️', to: '/manager/settings' }] },
  ]

  return (
    <AppShell
      user={USER}
      nav={nav}
      provenance={PROVENANCE}
      provenanceTrailing={<ProvBarCta>View data lineage</ProvBarCta>}
    >
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route
          path="dashboard"
          element={<ManagerDashboard overview={overview} onOpenCoordinator={setDrawer} />}
        />
        <Route path="assignment" element={<ManagerAssignment overview={overview} />} />
        <Route
          path="patients"
          element={<ManagerPatients overview={overview} onOpenPatient={setDrawer} />}
        />
        <Route
          path="coordinators"
          element={
            <ManagerCoordinators
              overview={overview}
              onOpenCoordinator={setDrawer}
              prefill={prefill}
            />
          }
        />
        <Route path="performance" element={<ManagerPerformance overview={overview} />} />
        <Route path="settings" element={<ManagerSettings overview={overview} />} />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>

      <ManagerDrawer
        target={drawer}
        overview={overview}
        onClose={() => setDrawer(null)}
        onNavigate={setDrawer}
        onComposeMessage={setPrefill}
      />

      <DemoResetButton />
    </AppShell>
  )
}
