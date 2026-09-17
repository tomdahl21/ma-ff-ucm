import {
  Box,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { Breadcrumb } from '@/components/Breadcrumb'
import { EmptyState } from '@/components/EmptyState'
import { FilterChips, type FilterOption } from '@/components/FilterChips'
import { Pager } from '@/components/Pager'
import { Panel } from '@/components/Panel'
import { PageHead } from '@/components/shell/AppShell'
import { RiskBadge, SrcTag } from '@/components/atoms'
import type { CoordinatorId } from '@/session/types'
import { gray, risk, space, surface } from '@/theme/tokens'
import type { DrawerTarget } from '../ManagerDrawer'
import type { ManagedPatient, ManagerOverview } from '../useManagerData'

type PatientFilter = 'all' | 'high' | 'medium' | 'low' | 'uncontacted' | 'unassigned'
type SortKey = 'name' | 'score' | 'dx' | 'days' | 'assignedTo' | 'contacted'

const PER_PAGE = 12

const COLUMNS: { key: SortKey; label: string; src?: 'epic' | 'dc' | 'sfdc' | 'hc' }[] = [
  { key: 'name', label: 'Patient', src: 'epic' },
  { key: 'score', label: 'Score', src: 'dc' },
  { key: 'dx', label: 'Diagnosis', src: 'epic' },
  { key: 'days', label: 'Discharged', src: 'epic' },
  { key: 'assignedTo', label: 'Coordinator', src: 'hc' },
  { key: 'contacted', label: 'Last Contact', src: 'sfdc' },
]

export function ManagerPatients({
  overview,
  onOpenPatient,
}: {
  overview: ManagerOverview
  onOpenPatient: (target: DrawerTarget) => void
}) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<PatientFilter>('all')
  const [coord, setCoord] = useState<CoordinatorId | '__none' | ''>('')
  const [sort, setSort] = useState<SortKey>('score')
  const [dir, setDir] = useState<1 | -1>(-1)
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    const rows = overview.patients.filter((entry) => {
      const { patient } = entry
      if (
        q &&
        !(
          patient.name.toLowerCase().includes(q) ||
          patient.mrn.includes(q) ||
          patient.dx.toLowerCase().includes(q)
        )
      ) {
        return false
      }
      if (coord === '__none') {
        if (patient.assignedTo !== null) return false
      } else if (coord && patient.assignedTo !== coord) {
        return false
      }
      switch (filter) {
        case 'high':
        case 'medium':
        case 'low':
          return entry.tier === filter
        case 'uncontacted':
          return !patient.contacted
        case 'unassigned':
          return patient.assignedTo === null
        default:
          return true
      }
    })

    const compare = (a: ManagedPatient, b: ManagedPatient): number => {
      switch (sort) {
        case 'name':
          return a.patient.name.localeCompare(b.patient.name) * dir
        case 'dx':
          return a.patient.dx.localeCompare(b.patient.dx) * dir
        case 'assignedTo':
          // Unassigned sorts last regardless of direction — it's the outlier
          // the manager is looking for, not a name.
          return (
            (a.coordinatorName ?? 'zzz').localeCompare(b.coordinatorName ?? 'zzz') * dir
          )
        case 'contacted':
          return ((a.patient.contacted ? 1 : 0) - (b.patient.contacted ? 1 : 0)) * dir
        case 'days':
          return (a.days - b.days) * dir
        case 'score':
        default:
          return (a.patient.score - b.patient.score) * dir
      }
    }
    return [...rows].sort(compare)
  }, [overview.patients, query, filter, coord, sort, dir])

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage = Math.min(page, pages - 1)
  const start = safePage * PER_PAGE
  const slice = filtered.slice(start, start + PER_PAGE)

  const toggleSort = (key: SortKey) => {
    if (sort === key) setDir((d) => (d === 1 ? -1 : 1))
    else {
      setSort(key)
      setDir(key === 'score' ? -1 : 1)
    }
    setPage(0)
  }

  const filters: FilterOption<PatientFilter>[] = [
    { id: 'all', label: 'All', count: overview.total },
    { id: 'high', label: 'High', count: overview.counts.high },
    { id: 'medium', label: 'Medium', count: overview.counts.medium },
    { id: 'low', label: 'Low', count: overview.counts.low },
    { id: 'uncontacted', label: 'Uncontacted', count: overview.uncontacted },
    { id: 'unassigned', label: 'Unassigned', count: overview.unassigned.length },
  ]

  return (
    <>
      <Breadcrumb trail={[{ label: 'Dashboard', to: '/manager/dashboard' }, { label: 'All Patients' }]} />
      <PageHead
        title="All Patients"
        sub="Everyone under management — established caseload plus the unassigned queue"
      />

      <Panel
        title="Patient Directory"
        sub={`${filtered.length} of ${overview.total} patients`}
        flush
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: `${space[3]}px`,
            padding: `${space[4]}px ${space[5]}px`,
            borderBottom: `1px solid ${surface.border}`,
            flexWrap: 'wrap',
          }}
        >
          <TextField
            size="small"
            placeholder="Search name, MRN or diagnosis…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(0)
            }}
            slotProps={{ input: { 'aria-label': 'Search patients' } }}
            sx={{ minWidth: 260 }}
          />
          <TextField
            select
            size="small"
            value={coord}
            onChange={(event) => {
              setCoord(event.target.value as CoordinatorId | '__none' | '')
              setPage(0)
            }}
            slotProps={{ select: { 'aria-label': 'Filter by coordinator' } }}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">All coordinators</MenuItem>
            {overview.caseloads.map((c) => (
              <MenuItem key={c.coord.id} value={c.coord.id}>
                {c.coord.short}
              </MenuItem>
            ))}
            <MenuItem value="__none">Unassigned</MenuItem>
          </TextField>
        </Box>

        <Box sx={{ padding: `${space[4]}px ${space[5]}px`, borderBottom: `1px solid ${surface.border}` }}>
          <FilterChips
            label="Filter patients by tier or status"
            options={filters}
            value={filter}
            onChange={(next) => {
              setFilter(next)
              setPage(0)
            }}
          />
        </Box>

        {slice.length === 0 ? (
          <EmptyState icon="🔍" title="No patients match">
            Try clearing the search or switching filters.
          </EmptyState>
        ) : (
          <>
            <Table aria-label="All patients">
              <TableHead>
                <TableRow>
                  {COLUMNS.map((col) => {
                    const active = sort === col.key
                    return (
                      <TableCell
                        key={col.key}
                        aria-sort={active ? (dir === 1 ? 'ascending' : 'descending') : 'none'}
                        sx={{ padding: 0 }}
                      >
                        <Box
                          component="button"
                          type="button"
                          onClick={() => toggleSort(col.key)}
                          sx={{
                            background: 'none',
                            border: 0,
                            cursor: 'pointer',
                            font: 'inherit',
                            color: 'inherit',
                            textTransform: 'inherit',
                            letterSpacing: 'inherit',
                            width: '100%',
                            textAlign: 'left',
                            padding: `${space[3]}px ${space[4]}px`,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            gap: '4px',
                            '&:hover': { color: gray[900] },
                          }}
                        >
                          <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {col.label}
                            <Box component="span" aria-hidden="true" sx={{ opacity: active ? 1 : 0.3, fontSize: 10 }}>
                              {active ? (dir === 1 ? '↑' : '↓') : '⇅'}
                            </Box>
                          </Box>
                          {col.src ? <SrcTag system={col.src} /> : null}
                        </Box>
                      </TableCell>
                    )
                  })}
                </TableRow>
              </TableHead>
              <TableBody>
                {slice.map((entry) => {
                  const { patient, tier, days, coordinatorName } = entry
                  return (
                    <TableRow
                      key={patient.mrn}
                      hover
                      tabIndex={0}
                      onClick={() => onOpenPatient({ kind: 'patient', mrn: patient.mrn })}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          onOpenPatient({ kind: 'patient', mrn: patient.mrn })
                        }
                      }}
                      sx={{
                        cursor: 'pointer',
                        '& > td:first-of-type': {
                          position: 'relative',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: 3,
                            backgroundColor: risk[tier].dot,
                          },
                        },
                      }}
                    >
                      <TableCell>
                        <Typography component="div" sx={{ fontSize: 14, fontWeight: 600 }}>
                          {patient.name}
                        </Typography>
                        <Typography component="div" sx={{ fontSize: 12, color: gray[500] }}>
                          MRN {patient.mrn} · {patient.age}
                          {patient.sex}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: `${space[2]}px` }}>
                          <Typography
                            component="span"
                            sx={{ fontSize: 17, fontWeight: 800, color: risk[tier].text }}
                          >
                            {patient.score}
                          </Typography>
                          <RiskBadge tier={tier} />
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: 14 }}>{patient.dx}</TableCell>
                      <TableCell sx={{ fontSize: 13, color: gray[500] }}>{days}d ago</TableCell>
                      <TableCell sx={{ fontSize: 13 }}>
                        {coordinatorName ?? (
                          <Typography
                            component="span"
                            sx={{ fontSize: 13, fontWeight: 700, color: risk.high.text }}
                          >
                            Unassigned
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ fontSize: 13 }}>
                        {patient.contacted ? (
                          <Typography component="span" sx={{ fontSize: 13, color: gray[500] }}>
                            {patient.lastOutcome ?? 'Contacted'}
                          </Typography>
                        ) : (
                          <Typography
                            component="span"
                            sx={{ fontSize: 13, fontWeight: 700, color: risk.high.text }}
                          >
                            Never
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            <Pager
              info={`Showing ${start + 1}–${Math.min(start + PER_PAGE, filtered.length)} of ${filtered.length}`}
              onPrev={() => setPage((p) => Math.max(0, p - 1))}
              onNext={() => setPage((p) => Math.min(pages - 1, p + 1))}
              canPrev={safePage > 0}
              canNext={safePage < pages - 1}
            />
          </>
        )}
      </Panel>
    </>
  )
}
