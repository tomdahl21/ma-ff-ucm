import { Box, Button, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { EmptyState } from '@/components/EmptyState'
import { Panel } from '@/components/Panel'
import { PageHead } from '@/components/shell/AppShell'
import { NeutralBadge, RiskBadge, SrcTag } from '@/components/atoms'
import { StatRow, StatTile } from '@/components/StatRow'
import { UcmAlert } from '@/components/UcmAlert'
import { useSettings } from '@/session/react'
import type { Mrn } from '@/session/types'
import { gray, risk, space } from '@/theme/tokens'
import type { Caseload, CaseloadRow } from '../useCaseload'

/**
 * The actionable worklist: everyone still owed a call, most urgent first.
 * Entirely derived — a patient is here because nobody has reached them, or
 * because the last attempt didn't connect.
 */
export function CoordinatorCallbacks({
  caseload,
  onOpenPatient,
}: {
  caseload: Caseload
  onOpenPatient: (mrn: Mrn) => void
}) {
  const settings = useSettings()
  const { callbacks, counts } = caseload

  return (
    <>
      <PageHead
        title="Callbacks Due"
        sub="Patients with no logged contact, or whose last attempt didn't connect"
      />

      <StatRow columns={3}>
        <StatTile
          label="Past the Window"
          value={counts.overdue}
          sub={`over ${settings.contactWindowHours}h since discharge`}
          tone={counts.overdue ? 'red' : 'green'}
          alert={counts.overdue > 0}
        />
        <StatTile
          label="Never Contacted"
          value={counts.uncontacted}
          sub="no outreach logged"
          tone={counts.uncontacted ? 'amber' : 'green'}
        />
        <StatTile
          label="Needs Retry"
          value={counts.retry}
          sub="voicemail or no answer"
          tone={counts.retry ? 'amber' : 'green'}
        />
      </StatRow>

      {counts.overdue > 0 ? (
        <UcmAlert
          severity="error"
          title={`${counts.overdue} patient${counts.overdue === 1 ? ' is' : 's are'} past the ${settings.contactWindowHours}-hour contact window`}
        >
          These are listed first. Contact within the window is the strongest single predictor of an
          avoided readmission.
        </UcmAlert>
      ) : null}

      <Panel
        title="Call List"
        sub={`${callbacks.length} of ${caseload.total} patients · overdue first, then never contacted, then by risk`}
        flush
      >
        {callbacks.length === 0 ? (
          <EmptyState icon="✓" title="No callbacks outstanding" titleColor={risk.low.text}>
            Every patient in your queue has been reached. New callbacks appear here as patients are
            discharged or when an attempt doesn&apos;t connect.
          </EmptyState>
        ) : (
          <Table aria-label="Callbacks due">
            <TableHead>
              <TableRow>
                <TableCell>
                  Patient <SrcTag system="epic" />
                </TableCell>
                <TableCell>Risk</TableCell>
                <TableCell>Diagnosis</TableCell>
                <TableCell>Since Discharge</TableCell>
                <TableCell>
                  Why <SrcTag system="sfdc" />
                </TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {callbacks.map((row) => (
                <CallbackRow key={row.patient.mrn} row={row} onOpen={onOpenPatient} />
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>
    </>
  )
}

function CallbackRow({ row, onOpen }: { row: CaseloadRow; onOpen: (mrn: Mrn) => void }) {
  const { patient, tier, days, overdue, callback } = row
  return (
    <TableRow
      hover
      sx={{
        backgroundColor: overdue ? '#fffbfb' : undefined,
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
          <Typography component="span" sx={{ fontSize: 17, fontWeight: 800, color: risk[tier].text }}>
            {patient.score}
          </Typography>
          <RiskBadge tier={tier} />
        </Box>
      </TableCell>
      <TableCell sx={{ fontSize: 14 }}>{patient.dx}</TableCell>
      <TableCell>
        <Typography
          component="span"
          sx={{
            fontSize: 13,
            fontWeight: overdue ? 700 : 400,
            color: overdue ? risk.high.text : gray[500],
          }}
        >
          {patient.hoursSince}h
          {days > 0 ? ` · ${days}d` : ''}
          {overdue ? ' — overdue' : ''}
        </Typography>
      </TableCell>
      <TableCell>
        {callback === 'never-contacted' ? (
          <RiskBadge tier="high" label="Never contacted" />
        ) : (
          <NeutralBadge>{patient.lastOutcome ?? 'Retry'}</NeutralBadge>
        )}
      </TableCell>
      <TableCell>
        <Button size="small" variant="contained" onClick={() => onOpen(patient.mrn)}>
          Open &amp; log call
        </Button>
      </TableCell>
    </TableRow>
  )
}
