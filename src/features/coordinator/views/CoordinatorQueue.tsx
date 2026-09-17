import { Box, Button } from '@mui/material'
import { useCallback, useMemo, useState } from 'react'
import { FilterChips, type FilterOption } from '@/components/FilterChips'
import { Panel } from '@/components/Panel'
import { PageHead } from '@/components/shell/AppShell'
import { StatRow, StatTile } from '@/components/StatRow'
import { Timeline } from '@/components/Timeline'
import { UcmAlert } from '@/components/UcmAlert'
import { DEMO_TODAY } from '@/data/demoClock'
import { sessionActions, useSettings } from '@/session/react'
import type { Mrn } from '@/session/types'
import { layout, space } from '@/theme/tokens'
import { toast } from '@/ui/toastApi'
import { ME } from '../me'
import { PatientDetailPanel } from '../PatientDetailPanel'
import { TriageTable } from '../TriageTable'
import { buildTimeline } from '../buildTimeline'
import { resolveSelection, type Caseload } from '../useCaseload'

type QueueFilter = 'all' | 'high' | 'uncontacted'

export function CoordinatorQueue({
  caseload,
  selectedMrn,
  onSelect,
}: {
  caseload: Caseload
  selectedMrn: Mrn | null
  onSelect: (mrn: Mrn) => void
}) {
  const settings = useSettings()
  const [filter, setFilter] = useState<QueueFilter>('all')

  const selected = resolveSelection(caseload, selectedMrn)

  const visibleRows = useMemo(() => {
    if (filter === 'high') return caseload.rows.filter((r) => r.tier === 'high')
    if (filter === 'uncontacted') return caseload.rows.filter((r) => !r.patient.contacted)
    return caseload.rows
  }, [caseload.rows, filter])

  const handleLogOutcome = useCallback(
    (outcome: string, note: string) => {
      if (!selected) return
      sessionActions.logCall(selected.patient.mrn, ME, outcome, note)
      toast('Outcome saved', 'Written to Health Cloud. Manager activity feed updated.', 'ok')
    },
    [selected],
  )

  const filters: FilterOption<QueueFilter>[] = [
    { id: 'all', label: 'All', count: caseload.total },
    { id: 'high', label: 'High Risk', count: caseload.counts.high },
    { id: 'uncontacted', label: 'Uncontacted', count: caseload.counts.uncontacted },
  ]

  return (
    <>
      <PageHead
        title="My Patient Queue"
        sub={`${caseload.total} patients assigned · sorted by readmission risk · ${DEMO_TODAY}`}
      />

      {caseload.counts.overdue > 0 ? (
        <UcmAlert
          severity="error"
          title={`${caseload.counts.overdue} patient${caseload.counts.overdue === 1 ? '' : 's'} past the ${settings.contactWindowHours}-hour window`}
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
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Panel
            title="Patient Triage List"
            sub="Risk scores from Salesforce Data Cloud · updated 22 minutes ago"
            flush
          >
            <Box
              sx={{
                padding: `${space[4]}px ${space[5]}px`,
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
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
              onSelect={onSelect}
            />
          </Panel>
        </Box>

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

      {/* Rail changes are otherwise silent to screen readers. */}
      <Box className="sr-only" role="status" aria-live="polite">
        {selected ? `Selected ${selected.patient.name}, risk score ${selected.patient.score}` : ''}
      </Box>
    </>
  )
}
