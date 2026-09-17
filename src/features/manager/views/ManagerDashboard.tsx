import { Box, Button, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { useNavigate } from 'react-router'
import { NeutralBadge, RiskBadge, SectionLabel } from '@/components/atoms'
import { EmptyState } from '@/components/EmptyState'
import { Meter } from '@/components/Meter'
import { Panel } from '@/components/Panel'
import { PageHead } from '@/components/shell/AppShell'
import { StatRow, StatTile } from '@/components/StatRow'
import { UcmAlert } from '@/components/UcmAlert'
import { DEMO_TODAY } from '@/data/demoClock'
import { sessionActions, useSettings } from '@/session/react'
import { selectSuggestedCoordinator } from '@/session/selectors'
import type { RiskTier } from '@/session/types'
import { gray, risk, space } from '@/theme/tokens'
import { toast } from '@/ui/toastApi'
import { AssignRow } from '../AssignRow'
import { CONTACT_RATE_TARGET, CONTACT_RATE_TREND } from '../demoCopy'
import { DistributionBar, MiniBarChart } from '../MiniBarChart'
import type { DrawerTarget } from '../ManagerDrawer'
import type { ManagerOverview } from '../useManagerData'

const TIERS: { tier: RiskTier; label: string; tone: 'over' | 'near' | 'ok' }[] = [
  { tier: 'high', label: 'High Risk', tone: 'over' },
  { tier: 'medium', label: 'Medium Risk', tone: 'near' },
  { tier: 'low', label: 'Low Risk', tone: 'ok' },
]

export function ManagerDashboard({
  overview,
  onOpenCoordinator,
}: {
  overview: ManagerOverview
  onOpenCoordinator: (target: DrawerTarget) => void
}) {
  const navigate = useNavigate()
  const settings = useSettings()
  const { unassigned, caseloads, counts, total, uncontacted, contactRate } = overview

  const autoAssignAll = () => {
    if (unassigned.length === 0) {
      toast('Nothing to assign', 'The unassigned queue is empty.', 'info')
      return
    }
    // Recompute the suggestion after each assignment so load rebalances as it
    // goes, rather than dumping everyone on whoever was lightest to start.
    let assigned = 0
    for (const entry of unassigned) {
      const target = selectSuggestedCoordinator(sessionActions.getSnapshot())
      if (sessionActions.assign(entry.patient.mrn, target, { priority: true })) assigned++
    }
    toast(
      `Auto-assigned ${assigned} patient${assigned === 1 ? '' : 's'}`,
      'Distributed by lowest caseload, skipping anyone on PTO. All coordinators notified.',
      'assign',
    )
  }

  const exportHuddle = () => {
    const lines = [
      'UCM Care Coordination — Morning Huddle',
      `${DEMO_TODAY}, 2026`,
      '',
      `Unassigned high-risk: ${unassigned.length}`,
      '',
      ...caseloads.map(
        (c) =>
          `${c.coord.short} — ${c.total} patients, ${c.high} high risk, ` +
          `${c.uncontacted} uncontacted${c.coord.away ? ' (PTO)' : ''}`,
      ),
    ]
    toast('Huddle summary ready', `${lines.length} lines copied to console.`, 'ok')
    console.log(lines.join('\n'))
  }

  return (
    <>
      <PageHead
        title="Team Dashboard"
        sub={`${caseloads.length} coordinators · ${total} patients under management · ${DEMO_TODAY}`}
        actions={
          <Button size="small" variant="outlined" onClick={exportHuddle}>
            Export for Huddle
          </Button>
        }
      />

      {unassigned.length > 0 && settings.notifyOnUnassigned ? (
        <UcmAlert
          severity="error"
          title={`${unassigned.length} high-risk patient${unassigned.length === 1 ? '' : 's'} have no assigned coordinator`}
          action={
            <Button size="small" variant="contained" onClick={() => navigate('/manager/assignment')}>
              Assign now
            </Button>
          }
        >
          These patients are past 24 hours post-discharge with no owner. Unassigned high-risk
          patients are the single largest driver of preventable readmissions.
        </UcmAlert>
      ) : unassigned.length === 0 ? (
        <UcmAlert severity="success" title="Every high-risk patient has an owner">
          No unassigned patients in the queue.
        </UcmAlert>
      ) : null}

      <StatRow columns={5}>
        <StatTile
          label="Unassigned High-Risk"
          value={unassigned.length}
          sub="needs action now"
          tone={unassigned.length ? 'red' : 'green'}
          alert={unassigned.length > 0}
        />
        <StatTile label="High Risk" value={counts.high} sub="across all coordinators" tone="red" />
        <StatTile
          label={`Contacted < ${settings.contactWindowHours}h`}
          value={`${contactRate}%`}
          sub={`target ≥ ${CONTACT_RATE_TARGET}%`}
          tone={contactRate >= CONTACT_RATE_TARGET ? 'green' : 'amber'}
        />
        <StatTile
          label="Uncontacted"
          value={uncontacted}
          sub="no outreach logged"
          tone={uncontacted ? 'amber' : 'green'}
        />
        <StatTile label="Total Managed" value={total} sub="active post-discharge" />
      </StatRow>

      {unassigned.length > 0 ? (
        <Panel
          title="Needs Assignment"
          sub="Highest risk first · assign directly or open the full queue"
          actions={
            <Button size="small" variant="contained" onClick={autoAssignAll}>
              Auto-Assign All
            </Button>
          }
          flush
        >
          {unassigned.slice(0, 4).map((entry) => (
            <AssignRow
              key={entry.patient.mrn}
              entry={entry}
              caseloads={caseloads}
              suggested={overview.suggested}
            />
          ))}
          {unassigned.length > 4 ? (
            <Box sx={{ padding: `${space[3]}px ${space[5]}px`, textAlign: 'center' }}>
              <Button size="small" variant="text" onClick={() => navigate('/manager/assignment')}>
                Show {unassigned.length - 4} more unassigned patients
              </Button>
            </Box>
          ) : null}
        </Panel>
      ) : null}

      <Panel title="Team Caseload" sub="Click a coordinator to see their patients" flush>
        <Table aria-label="Team caseload">
          <TableHead>
            <TableRow>
              <TableCell>Coordinator</TableCell>
              <TableCell>Caseload</TableCell>
              <TableCell>High Risk</TableCell>
              <TableCell>Uncontacted</TableCell>
              <TableCell>Contact Rate</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {caseloads.map((c) => (
              <TableRow
                key={c.coord.id}
                hover
                tabIndex={0}
                onClick={() => onOpenCoordinator({ kind: 'coordinator', id: c.coord.id })}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onOpenCoordinator({ kind: 'coordinator', id: c.coord.id })
                  }
                }}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>
                  <Typography component="div" sx={{ fontSize: 14, fontWeight: 600 }}>
                    {c.coord.name}
                  </Typography>
                  <Typography component="div" sx={{ fontSize: 12, color: gray[500] }}>
                    {c.coord.team}
                  </Typography>
                </TableCell>
                <TableCell>
                  <strong>{c.total}</strong>
                  <Box sx={{ marginTop: '5px' }}>
                    <Meter value={c.total} capacity={c.capacity} width={110} />
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography component="span" sx={{ fontSize: 17, fontWeight: 800, color: risk.high.text }}>
                    {c.high}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    component="span"
                    sx={{
                      fontSize: 13,
                      fontWeight: c.uncontacted ? 700 : 400,
                      color: c.uncontacted ? risk.high.text : gray[500],
                    }}
                  >
                    {c.uncontacted}
                  </Typography>
                </TableCell>
                <TableCell>
                  {c.contactRate === null ? (
                    <NeutralBadge>—</NeutralBadge>
                  ) : (
                    <RiskBadge
                      tier={c.contactRate >= 80 ? 'low' : c.contactRate >= 60 ? 'medium' : 'high'}
                      label={`${c.contactRate}%`}
                    />
                  )}
                </TableCell>
                <TableCell>
                  {c.coord.away ? (
                    <NeutralBadge>PTO</NeutralBadge>
                  ) : c.overBy ? (
                    <RiskBadge tier="high" label={`Over by ${c.overBy}`} />
                  ) : (
                    <RiskBadge tier="low" label="Within capacity" />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>

      <Box
        sx={{
          display: 'flex',
          gap: `${space[6]}px`,
          alignItems: 'stretch',
          '@media (max-width: 1100px)': { flexDirection: 'column' },
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Panel
            title={`Contact Rate Within ${settings.contactWindowHours} Hours`}
            sub={`Last ${CONTACT_RATE_TREND.length} days · target ${CONTACT_RATE_TARGET}%`}
          >
            <MiniBarChart bars={CONTACT_RATE_TREND} monthLabel="Sep" />
            <Box sx={{ marginTop: `${space[5]}px` }}>
              <UcmAlert
                severity="warning"
                title="4-day decline below target"
                action={
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => navigate('/manager/coordinators')}
                  >
                    Rebalance
                  </Button>
                }
              >
                Correlates with Anthony Russo&apos;s caseload and Gerald Okafor being on PTO.
                Consider redistributing.
              </UcmAlert>
            </Box>
          </Panel>
        </Box>

        <Box sx={{ width: 340, flexShrink: 0, '@media (max-width: 1100px)': { width: '100%' } }}>
          <Panel title="Risk Distribution" sub={`${total} active patients`}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: `${space[4]}px` }}>
              {TIERS.map(({ tier, tone }) => {
                const n = counts[tier]
                const pct = total ? Math.round((n / total) * 100) : 0
                return (
                  <Box key={tier}>
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <RiskBadge tier={tier} />
                      <strong>{n}</strong>
                    </Box>
                    <DistributionBar pct={pct} tone={tone} />
                    <Typography sx={{ fontSize: 11, color: gray[500], marginTop: '5px' }}>
                      {pct}% of total
                    </Typography>
                  </Box>
                )
              })}
            </Box>

            <Box sx={{ height: 1, backgroundColor: gray[100], margin: `${space[5]}px 0` }} />

            <SectionLabel>Top Diagnoses — High Risk</SectionLabel>
            {overview.topHighRiskDiagnoses.length === 0 ? (
              <Typography sx={{ fontSize: 13, color: gray[500] }}>
                No high-risk patients.
              </Typography>
            ) : (
              overview.topHighRiskDiagnoses.map((d) => (
                <Box
                  key={d.dx}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 13,
                    padding: '4px 0',
                  }}
                >
                  <span>{d.dx}</span>
                  <strong>{d.count}</strong>
                </Box>
              ))
            )}
          </Panel>
        </Box>
      </Box>

      {unassigned.length === 0 ? (
        <Panel flush>
          <EmptyState icon="✓" title="Every high-risk patient has an owner" titleColor={risk.low.text}>
            No unassigned patients past the 24-hour threshold.
          </EmptyState>
        </Panel>
      ) : null}
    </>
  )
}
