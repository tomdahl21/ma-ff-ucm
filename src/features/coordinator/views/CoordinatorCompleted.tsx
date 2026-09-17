import { Box, Typography } from '@mui/material'
import { useMemo } from 'react'
import { EmptyState } from '@/components/EmptyState'
import { Panel } from '@/components/Panel'
import { PageHead } from '@/components/shell/AppShell'
import { Glyph, NeutralBadge, RiskBadge, SectionLabel, SrcTag } from '@/components/atoms'
import { StatRow, StatTile } from '@/components/StatRow'
import { COORDINATORS } from '@/data/patients'
import { useActivity } from '@/session/react'
import { relTime } from '@/session/selectors'
import { gray, risk, space, surface } from '@/theme/tokens'
import { ME } from '../me'
import type { Caseload } from '../useCaseload'

const MY_SHORT = COORDINATORS.find((c) => c.id === ME)?.short ?? 'Sarah Lin'

/** Outcomes that count as actually reaching the patient. */
const REACHED = new Set(['Reached — patient responsive'])
const ESCALATIONS = new Set(['Escalate to social work'])

/**
 * What this coordinator has logged. Derived from the session activity feed
 * rather than a stored "today" figure — so it's honest that a fresh demo
 * starts empty, and every entry here corresponds to a real action.
 */
export function CoordinatorCompleted({ caseload }: { caseload: Caseload }) {
  const activity = useActivity()

  const myCalls = useMemo(
    () => activity.filter((a) => a.verb === 'logged call' && a.actorName === MY_SHORT),
    [activity],
  )

  const stats = useMemo(() => {
    let reached = 0
    let noAnswer = 0
    let escalated = 0
    for (const call of myCalls) {
      // The detail line is "<name> — <outcome>[ · note]".
      const outcome = call.detail.split(' — ')[1]?.split(' · ')[0] ?? ''
      if (REACHED.has(outcome)) reached++
      else if (ESCALATIONS.has(outcome)) escalated++
      else noAnswer++
    }
    return { reached, noAnswer, escalated }
  }, [myCalls])

  const acknowledged = useMemo(
    () => activity.filter((a) => a.verb === 'acknowledged' && a.actorName === MY_SHORT),
    [activity],
  )

  const contactedPatients = useMemo(
    () => caseload.rows.filter((r) => r.patient.lastContactAt != null),
    [caseload.rows],
  )

  return (
    <>
      <PageHead
        title="Completed Today"
        sub="Every outcome you've logged this session, newest first"
      />

      <StatRow columns={4}>
        <StatTile
          label="Calls Logged"
          value={myCalls.length}
          sub="written to Health Cloud"
          tone={myCalls.length ? 'green' : 'default'}
        />
        <StatTile label="Patients Reached" value={stats.reached} sub="answered and responsive" tone="green" />
        <StatTile
          label="No Answer"
          value={stats.noAnswer}
          sub="voicemail or unreachable"
          tone={stats.noAnswer ? 'amber' : 'default'}
        />
        <StatTile
          label="Escalated"
          value={stats.escalated}
          sub="referred to social work"
          tone={stats.escalated ? 'red' : 'default'}
        />
      </StatRow>

      <Panel
        title="Logged Outcomes"
        sub={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            Written once to <SrcTag system="hc" /> · no duplicate entry in Epic
          </Box>
        }
        flush={myCalls.length === 0}
      >
        {myCalls.length === 0 ? (
          <EmptyState icon="📞" title="Nothing logged yet this session">
            Outcomes you save from a patient&apos;s detail panel appear here, and in your
            manager&apos;s activity feed at the same time.
          </EmptyState>
        ) : (
          <Box>
            {myCalls.map((call) => {
              const [name, rest] = call.detail.split(' — ')
              const outcome = rest?.split(' · ')[0] ?? ''
              const note = rest?.split(' · ').slice(1).join(' · ')
              const reached = REACHED.has(outcome)
              const escalated = ESCALATIONS.has(outcome)
              return (
                <Box
                  key={call.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: `${space[3]}px`,
                    padding: `${space[3]}px 0`,
                    borderBottom: `1px solid ${gray[100]}`,
                    '&:last-child': { borderBottom: 'none' },
                  }}
                >
                  <Box
                    sx={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: reached
                        ? risk.low.bg
                        : escalated
                          ? risk.high.bg
                          : risk.medium.bg,
                      color: reached
                        ? risk.low.text
                        : escalated
                          ? risk.high.text
                          : risk.medium.text,
                    }}
                  >
                    <Glyph size={11}>{reached ? '✓' : escalated ? '⚠️' : '📞'}</Glyph>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography component="div" sx={{ fontSize: 14, fontWeight: 600 }}>
                      {name}
                    </Typography>
                    <Typography component="div" sx={{ fontSize: 13, color: gray[700], marginTop: '2px' }}>
                      {outcome}
                    </Typography>
                    {note ? (
                      <Typography
                        component="div"
                        sx={{
                          fontSize: 12,
                          color: gray[500],
                          marginTop: '4px',
                          paddingLeft: `${space[3]}px`,
                          borderLeft: `2px solid ${surface.border}`,
                          lineHeight: 1.5,
                        }}
                      >
                        {note}
                      </Typography>
                    ) : null}
                  </Box>
                  <Typography
                    component="div"
                    sx={{ fontSize: 11, color: gray[500], flexShrink: 0, whiteSpace: 'nowrap' }}
                  >
                    {relTime(call.ts)}
                  </Typography>
                </Box>
              )
            })}
          </Box>
        )}
      </Panel>

      {acknowledged.length > 0 ? (
        <Panel title="Handovers Accepted" sub="Assignments you acknowledged this session">
          {acknowledged.map((entry) => (
            <Box
              key={entry.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: `${space[3]}px`,
                padding: `${space[2]}px 0`,
                fontSize: 13,
              }}
            >
              <Glyph size={12}>✓</Glyph>
              <Box sx={{ flex: 1, minWidth: 0 }}>{entry.detail}</Box>
              <Typography component="span" sx={{ fontSize: 11, color: gray[500] }}>
                {relTime(entry.ts)}
              </Typography>
            </Box>
          ))}
        </Panel>
      ) : null}

      <Panel
        title="Contact Status Across My Queue"
        sub={`${contactedPatients.length} of ${caseload.total} contacted at some point`}
      >
        <SectionLabel>Reached, most recent first</SectionLabel>
        {contactedPatients.length === 0 ? (
          <Typography sx={{ fontSize: 13, color: gray[500] }}>
            No contact recorded against any patient in this session.
          </Typography>
        ) : (
          [...contactedPatients]
            .sort((a, b) => (b.patient.lastContactAt ?? 0) - (a.patient.lastContactAt ?? 0))
            .map((row) => (
              <Box
                key={row.patient.mrn}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: `${space[3]}px`,
                  padding: `${space[2]}px 0`,
                  borderBottom: `1px solid ${gray[100]}`,
                  '&:last-child': { borderBottom: 'none' },
                  flexWrap: 'wrap',
                }}
              >
                <Typography component="span" sx={{ fontSize: 13, fontWeight: 600, minWidth: 160 }}>
                  {row.patient.name}
                </Typography>
                <RiskBadge tier={row.tier} />
                <NeutralBadge>{row.patient.lastOutcome ?? 'Contacted'}</NeutralBadge>
                <Typography component="span" sx={{ fontSize: 11, color: gray[500], marginLeft: 'auto' }}>
                  {row.patient.lastContactAt ? relTime(row.patient.lastContactAt) : ''}
                </Typography>
              </Box>
            ))
        )}
      </Panel>
    </>
  )
}
