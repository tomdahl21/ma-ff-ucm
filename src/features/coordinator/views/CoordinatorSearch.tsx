import { Box, Button, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import { EmptyState } from '@/components/EmptyState'
import { FilterChips, type FilterOption } from '@/components/FilterChips'
import { Panel } from '@/components/Panel'
import { PageHead } from '@/components/shell/AppShell'
import { NeutralBadge, RiskBadge, SrcTag } from '@/components/atoms'
import { UcmAlert } from '@/components/UcmAlert'
import { COORDINATORS } from '@/data/patients'
import { daysSince, tierFor } from '@/data/invariants'
import { useSessionSelector, useSettings } from '@/session/react'
import { selectPatients, shallowArrayEqual } from '@/session/selectors'
import type { CoordinatorId, Mrn, RiskTier } from '@/session/types'
import { gray, risk, space, surface } from '@/theme/tokens'
import { ME } from '../me'
import type { Caseload } from '../useCaseload'

type Scope = 'mine' | 'all'

interface Hit {
  mrn: Mrn
  name: string
  age: number
  sex: string
  dx: string
  score: number
  tier: RiskTier
  days: number
  contacted: boolean
  lastOutcome: string | null
  assignedTo: CoordinatorId | null
  isMine: boolean
}

/**
 * Lookup rather than triage. The queue is risk-ordered and scoped to this
 * coordinator; search answers "where is this person" and can reach the whole
 * roster, because a coordinator taking a call needs to find a patient who
 * isn't theirs.
 */
export function CoordinatorSearch({
  caseload,
  onOpenPatient,
}: {
  caseload: Caseload
  onOpenPatient: (mrn: Mrn) => void
}) {
  const settings = useSettings()
  const allPatients = useSessionSelector(selectPatients, shallowArrayEqual)
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState<Scope>('mine')

  const hits = useMemo(() => {
    const q = query.toLowerCase().trim()
    const source = scope === 'mine' ? allPatients.filter((p) => p.assignedTo === ME) : allPatients

    const rows: Hit[] = source.map((patient) => ({
      mrn: patient.mrn,
      name: patient.name,
      age: patient.age,
      sex: patient.sex,
      dx: patient.dx,
      score: patient.score,
      tier: tierFor(patient.score, settings),
      days: daysSince(patient.hoursSince),
      contacted: patient.contacted,
      lastOutcome: patient.lastOutcome,
      assignedTo: patient.assignedTo,
      isMine: patient.assignedTo === ME,
    }))

    const matched = q
      ? rows.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            r.mrn.includes(q) ||
            r.dx.toLowerCase().includes(q),
        )
      : rows

    return matched.sort((a, b) => b.score - a.score)
  }, [allPatients, query, scope, settings])

  const scopes: FilterOption<Scope>[] = [
    { id: 'mine', label: 'My caseload', count: caseload.total },
    { id: 'all', label: 'All patients', count: allPatients.length },
  ]

  const coordName = (id: CoordinatorId | null) =>
    id === null ? null : (COORDINATORS.find((c) => c.id === id)?.short ?? null)

  return (
    <>
      <PageHead title="Patient Search" sub="Find a patient by name, MRN or diagnosis" />

      <Panel title="Search" flush>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: `${space[4]}px`,
            padding: `${space[4]}px ${space[5]}px`,
            borderBottom: `1px solid ${surface.border}`,
            flexWrap: 'wrap',
          }}
        >
          <TextField
            size="small"
            autoFocus
            placeholder="Name, MRN or diagnosis…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            slotProps={{ input: { 'aria-label': 'Search patients' } }}
            sx={{ minWidth: 300, flex: 1 }}
          />
          <FilterChips label="Search scope" options={scopes} value={scope} onChange={setScope} />
        </Box>

        {scope === 'all' ? (
          <Box sx={{ padding: `${space[4]}px ${space[5]}px 0` }}>
            <UcmAlert severity="info" title="Searching outside your caseload">
              Patients owned by another coordinator are read-only here. Logging an outcome is only
              available for your own patients.
            </UcmAlert>
          </Box>
        ) : null}

        {hits.length === 0 ? (
          <EmptyState icon="🔍" title="No patients match">
            Try a different name, a partial MRN, or widen the scope to all patients.
          </EmptyState>
        ) : (
          <Table aria-label="Search results">
            <TableHead>
              <TableRow>
                <TableCell>
                  Patient <SrcTag system="epic" />
                </TableCell>
                <TableCell>Risk</TableCell>
                <TableCell>Diagnosis</TableCell>
                <TableCell>Discharged</TableCell>
                <TableCell>
                  Coordinator <SrcTag system="hc" />
                </TableCell>
                <TableCell>
                  Last Contact <SrcTag system="sfdc" />
                </TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {hits.map((hit) => (
                <TableRow
                  key={hit.mrn}
                  hover
                  sx={{
                    '& > td:first-of-type': {
                      position: 'relative',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 3,
                        backgroundColor: risk[hit.tier].dot,
                      },
                    },
                  }}
                >
                  <TableCell>
                    <Typography component="div" sx={{ fontSize: 14, fontWeight: 600 }}>
                      {hit.name}
                    </Typography>
                    <Typography component="div" sx={{ fontSize: 12, color: gray[500] }}>
                      MRN {hit.mrn} · {hit.age}
                      {hit.sex}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: `${space[2]}px` }}>
                      <Typography
                        component="span"
                        sx={{ fontSize: 17, fontWeight: 800, color: risk[hit.tier].text }}
                      >
                        {hit.score}
                      </Typography>
                      <RiskBadge tier={hit.tier} />
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: 14 }}>{hit.dx}</TableCell>
                  <TableCell sx={{ fontSize: 13, color: gray[500] }}>{hit.days}d ago</TableCell>
                  <TableCell sx={{ fontSize: 13 }}>
                    {hit.isMine ? (
                      <NeutralBadge>You</NeutralBadge>
                    ) : (
                      (coordName(hit.assignedTo) ?? (
                        <Typography
                          component="span"
                          sx={{ fontSize: 13, fontWeight: 700, color: risk.high.text }}
                        >
                          Unassigned
                        </Typography>
                      ))
                    )}
                  </TableCell>
                  <TableCell sx={{ fontSize: 13 }}>
                    {hit.contacted ? (
                      <Typography component="span" sx={{ fontSize: 13, color: gray[500] }}>
                        {hit.lastOutcome ?? 'Contacted'}
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
                  <TableCell>
                    {hit.isMine ? (
                      <Button size="small" variant="contained" onClick={() => onOpenPatient(hit.mrn)}>
                        Open
                      </Button>
                    ) : (
                      <Typography component="span" sx={{ fontSize: 12, color: gray[500] }}>
                        Not yours
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>
    </>
  )
}
