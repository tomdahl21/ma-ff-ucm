import {
  Box,
  Button,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { Breadcrumb } from '@/components/Breadcrumb'
import { EmptyState } from '@/components/EmptyState'
import { Panel } from '@/components/Panel'
import { PageHead } from '@/components/shell/AppShell'
import { StatRow, StatTile } from '@/components/StatRow'
import { UcmAlert } from '@/components/UcmAlert'
import { sessionActions, useSettings } from '@/session/react'
import type { CoordinatorId, Mrn } from '@/session/types'
import { brand, gray, risk, source, space, surface } from '@/theme/tokens'
import { toast } from '@/ui/toastApi'
import { CoordinatorSelect } from '../AssignRow'
import { assignPatient } from '../assignPatient'
import type { ManagerOverview } from '../useManagerData'

export function ManagerAssignment({ overview }: { overview: ManagerOverview }) {
  const settings = useSettings()
  const { unassigned, caseloads, suggested } = overview
  const [selected, setSelected] = useState<ReadonlySet<Mrn>>(new Set())
  const [bulkWho, setBulkWho] = useState<CoordinatorId>(suggested)

  // Selection can go stale when patients leave the queue (here or in another tab).
  const live = new Set(unassigned.map((e) => e.patient.mrn))
  const activeSelection = [...selected].filter((mrn) => live.has(mrn))

  const overdue = unassigned.filter((e) => e.patient.hoursSince > settings.contactWindowHours)
  const avgWait = unassigned.length
    ? Math.round(
        unassigned.reduce((sum, e) => sum + e.patient.hoursSince, 0) / unassigned.length,
      )
    : 0
  const longest = unassigned.reduce((max, e) => Math.max(max, e.patient.hoursSince), 0)

  const toggle = (mrn: Mrn) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(mrn)) next.delete(mrn)
      else next.add(mrn)
      return next
    })

  const allSelected = unassigned.length > 0 && activeSelection.length === unassigned.length

  return (
    <>
      <Breadcrumb trail={[{ label: 'Dashboard', to: '/manager/dashboard' }, { label: 'Needs Assignment' }]} />
      <PageHead
        title="Needs Assignment"
        sub="Every patient discharged without a coordinator, oldest wait first"
        actions={
          unassigned.length > 0 ? (
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                setSelected(new Set(unassigned.map((e) => e.patient.mrn)))
                toast(
                  `All ${unassigned.length} selected`,
                  `Suggested owner is ${caseloads.find((c) => c.coord.id === suggested)?.coord.short} — ` +
                    'lowest current caseload. Adjust before assigning.',
                  'info',
                )
              }}
            >
              Suggest assignments
            </Button>
          ) : null
        }
      />

      <StatRow columns={4}>
        <StatTile
          label="Unassigned"
          value={unassigned.length}
          sub="awaiting an owner"
          tone={unassigned.length ? 'red' : 'green'}
          alert={unassigned.length > 0}
        />
        <StatTile
          label={`Past ${settings.contactWindowHours}h Window`}
          value={overdue.length}
          sub="contact window missed"
          tone={overdue.length ? 'red' : 'green'}
        />
        <StatTile label="Average Wait" value={`${avgWait}h`} sub="since discharge" tone="amber" />
        <StatTile label="Longest Wait" value={`${longest}h`} sub="oldest in queue" tone="red" />
      </StatRow>

      <UcmAlert severity="info" title="Assignment notifies the coordinator immediately">
        The patient appears at the top of their queue with a priority flag, and they receive an
        inbox message. Nothing is queued or batched.
      </UcmAlert>

      <Panel title="Unassigned Queue" sub={`${unassigned.length} patients`} flush>
        {activeSelection.length > 0 ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: `${space[4]}px`,
              padding: `${space[3]}px ${space[5]}px`,
              backgroundColor: source.app.bg,
              borderBottom: '1px solid #E8C8CE',
              flexWrap: 'wrap',
            }}
          >
            <Typography component="div" sx={{ fontSize: 13, fontWeight: 700, color: brand.maroon }}>
              {activeSelection.length} selected
            </Typography>
            <Box
              sx={{
                display: 'flex',
                gap: `${space[2]}px`,
                marginLeft: 'auto',
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <CoordinatorSelect
                value={bulkWho}
                onChange={setBulkWho}
                caseloads={caseloads}
                label="Assign selected to"
              />
              <Button
                size="small"
                variant="contained"
                onClick={() => {
                  const coord = caseloads.find((c) => c.coord.id === bulkWho)?.coord
                  let n = 0
                  for (const mrn of activeSelection) {
                    if (sessionActions.assign(mrn, bulkWho, { priority: true })) n++
                  }
                  setSelected(new Set())
                  toast(
                    `Assigned ${n} to ${coord?.short ?? 'coordinator'}`,
                    `All ${n} patients are now in their queue and they have been notified.`,
                    'assign',
                  )
                }}
              >
                Assign Selected
              </Button>
              <Button size="small" variant="text" onClick={() => setSelected(new Set())}>
                Clear
              </Button>
            </Box>
          </Box>
        ) : null}

        {unassigned.length === 0 ? (
          <EmptyState icon="✓" title="Queue is clear" titleColor={risk.low.text}>
            Every high-risk patient has a coordinator assigned. New unassigned patients will appear
            here as they are discharged.
          </EmptyState>
        ) : (
          <Table aria-label="Unassigned patients">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 36 }}>
                  <Checkbox
                    size="small"
                    checked={allSelected}
                    indeterminate={activeSelection.length > 0 && !allSelected}
                    onChange={(event) =>
                      setSelected(
                        event.target.checked ? new Set(unassigned.map((e) => e.patient.mrn)) : new Set(),
                      )
                    }
                    slotProps={{ input: { 'aria-label': 'Select all unassigned patients' } }}
                  />
                </TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Score</TableCell>
                <TableCell>Diagnosis</TableCell>
                <TableCell>Waiting</TableCell>
                <TableCell>Suggested</TableCell>
                <TableCell>Assign</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {unassigned.map((entry) => {
                const { patient } = entry
                const late = patient.hoursSince > settings.contactWindowHours
                return (
                  <AssignmentRow
                    key={patient.mrn}
                    mrn={patient.mrn}
                    name={patient.name}
                    meta={`MRN ${patient.mrn} · ${patient.age}${patient.sex}`}
                    score={patient.score}
                    dx={patient.dx}
                    waiting={`${patient.hoursSince}h${late ? ' — overdue' : ''}`}
                    late={late}
                    suggestedName={caseloads.find((c) => c.coord.id === suggested)?.coord.short ?? '—'}
                    checked={selected.has(patient.mrn)}
                    onToggle={() => toggle(patient.mrn)}
                    caseloads={caseloads}
                    suggested={suggested}
                  />
                )
              })}
            </TableBody>
          </Table>
        )}
      </Panel>
    </>
  )
}

function AssignmentRow({
  mrn,
  name,
  meta,
  score,
  dx,
  waiting,
  late,
  suggestedName,
  checked,
  onToggle,
  caseloads,
  suggested,
}: {
  mrn: Mrn
  name: string
  meta: string
  score: number
  dx: string
  waiting: string
  late: boolean
  suggestedName: string
  checked: boolean
  onToggle: () => void
  caseloads: ManagerOverview['caseloads']
  suggested: CoordinatorId
}) {
  const [who, setWho] = useState<CoordinatorId>(suggested)
  return (
    <TableRow
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
            backgroundColor: risk.high.dot,
          },
        },
      }}
    >
      <TableCell>
        <Checkbox
          size="small"
          checked={checked}
          onChange={onToggle}
          slotProps={{ input: { 'aria-label': `Select ${name}` } }}
        />
      </TableCell>
      <TableCell>
        <Typography component="div" sx={{ fontSize: 14, fontWeight: 600 }}>
          {name}
        </Typography>
        <Typography component="div" sx={{ fontSize: 12, color: gray[500] }}>
          {meta}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography component="span" sx={{ fontSize: 17, fontWeight: 800, color: risk.high.text }}>
          {score}
        </Typography>
      </TableCell>
      <TableCell sx={{ fontSize: 14 }}>{dx}</TableCell>
      <TableCell>
        <Typography
          component="span"
          sx={{
            fontSize: 13,
            fontWeight: late ? 700 : 400,
            color: late ? risk.high.text : gray[500],
          }}
        >
          {waiting}
        </Typography>
      </TableCell>
      <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>{suggestedName}</TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', gap: `${space[2]}px`, alignItems: 'center' }}>
          <CoordinatorSelect
            value={who}
            onChange={setWho}
            caseloads={caseloads}
            label={`Assign ${name} to`}
          />
          <Button
            size="small"
            variant="contained"
            onClick={() => assignPatient(mrn, who, caseloads)}
            sx={{ borderColor: surface.border }}
          >
            Assign
          </Button>
        </Box>
      </TableCell>
    </TableRow>
  )
}
