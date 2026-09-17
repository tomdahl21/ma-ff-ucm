import { Box, Button, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { Breadcrumb } from '@/components/Breadcrumb'
import { HBar } from '@/components/Meter'
import { Panel } from '@/components/Panel'
import { PageHead } from '@/components/shell/AppShell'
import { SectionLabel, SrcTag } from '@/components/atoms'
import { StatRow, StatTile } from '@/components/StatRow'
import { UcmAlert } from '@/components/UcmAlert'
import { useActivity } from '@/session/react'
import { gray, risk, space } from '@/theme/tokens'
import { toast } from '@/ui/toastApi'
import { ActivityFeed } from '../ActivityFeed'
import { CONFLICT_TYPES, CONTACT_RATE_TARGET, RECONCILIATION } from '../demoCopy'
import { meterTone } from '@/components/meterTone'
import type { ManagerOverview } from '../useManagerData'

export function ManagerPerformance({ overview }: { overview: ManagerOverview }) {
  const { caseloads, total } = overview
  const activity = useActivity()

  const maxLoad = Math.max(...caseloads.map((c) => Math.max(c.total, c.capacity)), 1)

  return (
    <>
      <Breadcrumb trail={[{ label: 'Dashboard', to: '/manager/dashboard' }, { label: 'Performance & Data Health' }]} />
      <PageHead
        title="Performance & Data Health"
        sub="Contact rates, caseload balance, and how well the two systems reconcile"
      />

      <Box
        sx={{
          display: 'flex',
          gap: `${space[6]}px`,
          alignItems: 'stretch',
          '@media (max-width: 1100px)': { flexDirection: 'column' },
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Panel title="Contact Rate by Coordinator" sub={`Target ${CONTACT_RATE_TARGET}%`}>
            {caseloads.map((c) => {
              const r = c.contactRate
              const color =
                r === null
                  ? gray[300]
                  : r >= 80
                    ? risk.low.dot
                    : r >= 60
                      ? risk.medium.dot
                      : risk.high.dot
              return (
                <HBar
                  key={c.coord.id}
                  label={c.coord.short}
                  pct={r ?? 0}
                  color={color}
                  barText={r === null ? '' : `${r}%`}
                  value={r === null ? '—' : `${r}%`}
                />
              )
            })}
            <Box sx={{ marginTop: `${space[4]}px` }}>
              <UcmAlert severity="info" title={`Target is ${CONTACT_RATE_TARGET}%`}>
                Rate counts only patients already past the contact window, so recently discharged
                patients do not penalize the number.
              </UcmAlert>
            </Box>
          </Panel>
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Panel title="Caseload Balance" sub="Against the configured capacity">
            {caseloads.map((c) => {
              const tone = meterTone(c.total, c.capacity)
              const color =
                tone === 'over' ? risk.high.dot : tone === 'near' ? risk.medium.dot : '#2F5580'
              return (
                <HBar
                  key={c.coord.id}
                  label={
                    <>
                      {c.coord.short}
                      {c.coord.away ? (
                        <Typography component="span" sx={{ fontSize: 11, color: gray[500] }}>
                          {' '}
                          (PTO)
                        </Typography>
                      ) : null}
                    </>
                  }
                  pct={(c.total / maxLoad) * 100}
                  color={color}
                  barText={c.total}
                  value={c.overBy ? `+${c.overBy}` : 'ok'}
                />
              )
            })}
          </Panel>
        </Box>
      </Box>

      <Panel
        title="Data Reconciliation Health"
        sub="What the orchestration layer resolved between Epic and Salesforce"
      >
        <StatRow columns={4}>
          <StatTile label="Unified Profiles" value={total} sub="Epic + Salesforce joined" />
          <StatTile
            label="Conflicts Resolved"
            value={RECONCILIATION.conflictsResolved}
            sub="automatically, by rule"
            tone="green"
          />
          <StatTile
            label="Needs Manual Review"
            value={RECONCILIATION.needsManualReview}
            sub="app could not resolve"
            tone="amber"
          />
          <StatTile
            label="Would Have Been Missed"
            value={RECONCILIATION.wouldHaveBeenMissed}
            sub="high-risk, only visible when joined"
            tone="green"
          />
        </StatRow>

        <UcmAlert
          severity="success"
          title={`${RECONCILIATION.wouldHaveBeenMissed} high-risk patients were invisible to either system alone`}
        >
          These patients did not meet the high-risk threshold on Epic clinical factors alone, nor on
          Salesforce engagement factors alone. They only surface when both are scored together — the
          clearest single measure of what this layer adds.
        </UcmAlert>

        <SectionLabel>Common conflict types this week</SectionLabel>
        <Table aria-label="Common conflict types">
          <TableHead>
            <TableRow>
              <TableCell>Conflict Type</TableCell>
              <TableCell>Epic Says</TableCell>
              <TableCell>Salesforce Says</TableCell>
              <TableCell>Resolution Rule</TableCell>
              <TableCell>Count</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {CONFLICT_TYPES.map((conflict) => (
              <TableRow key={conflict.type}>
                <TableCell>
                  <Typography component="div" sx={{ fontSize: 14, fontWeight: 600 }}>
                    {conflict.type}
                  </Typography>
                </TableCell>
                <TableCell sx={{ fontSize: 13 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <SrcTag system="epic" />
                    {conflict.epic}
                  </Box>
                </TableCell>
                <TableCell sx={{ fontSize: 13 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <SrcTag system="sfdc" />
                    {conflict.sfdc}
                  </Box>
                </TableCell>
                <TableCell
                  sx={{
                    fontSize: 13,
                    color: conflict.unresolved ? risk.high.text : gray[500],
                    fontWeight: conflict.unresolved ? 700 : 400,
                  }}
                >
                  {conflict.rule}
                </TableCell>
                <TableCell>
                  <strong>{conflict.count}</strong>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Box sx={{ marginTop: `${space[5]}px` }}>
          <UcmAlert
            severity="warning"
            title={`Epic sync running ${RECONCILIATION.epicSyncLag} behind`}
            action={
              <Button
                size="small"
                variant="outlined"
                onClick={() =>
                  toast(
                    'Resync requested',
                    'Epic sync job queued. Typically completes in 10–15 minutes.',
                    'info',
                  )
                }
              >
                Request Resync
              </Button>
            }
          >
            Clinical fields — diagnosis, discharge date, medications — may be stale. Engagement
            fields from Salesforce are live. Risk scores recomputed at last sync.
          </UcmAlert>
        </Box>
      </Panel>

      <Panel
        title="Session Activity"
        sub="Everything that has happened in this session"
        actions={
          <Typography component="span" sx={{ fontSize: 12, color: gray[500] }}>
            {activity.length} event{activity.length === 1 ? '' : 's'}
          </Typography>
        }
      >
        <Box sx={{ maxHeight: 420, overflowY: 'auto' }}>
          <ActivityFeed />
        </Box>
      </Panel>
    </>
  )
}
