import { Box, Button, MenuItem, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { RiskBadge } from '@/components/atoms'
import type { Caseload, CoordinatorId } from '@/session/types'
import { assignPatient } from './assignPatient'
import { gray, space, surface } from '@/theme/tokens'
import type { ManagedPatient } from './useManagerData'

export function CoordinatorSelect({
  value,
  onChange,
  caseloads,
  label,
}: {
  value: CoordinatorId
  onChange: (next: CoordinatorId) => void
  caseloads: readonly Caseload[]
  label: string
}) {
  return (
    <TextField
      select
      size="small"
      value={value}
      onChange={(event) => onChange(event.target.value as CoordinatorId)}
      slotProps={{ select: { 'aria-label': label } }}
      sx={{ minWidth: 170 }}
    >
      {caseloads.map((c) => (
        <MenuItem key={c.coord.id} value={c.coord.id}>
          {c.coord.short} ({c.total}){c.overBy ? ' — over' : ''}
          {c.coord.away ? ' — PTO' : ''}
        </MenuItem>
      ))}
    </TextField>
  )
}

/** The dashboard's inline assign card. */
export function AssignRow({
  entry,
  caseloads,
  suggested,
}: {
  entry: ManagedPatient
  caseloads: readonly Caseload[]
  suggested: CoordinatorId
}) {
  const [who, setWho] = useState<CoordinatorId>(suggested)
  const { patient } = entry

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: `${space[4]}px`,
        padding: `${space[4]}px ${space[5]}px`,
        borderBottom: `1px solid ${surface.border}`,
        backgroundColor: '#fffbfb',
        flexWrap: 'wrap',
      }}
    >
      <RiskBadge tier={entry.tier} label={String(patient.score)} />
      <Box sx={{ flex: 1, minWidth: 200 }}>
        <Typography component="div" sx={{ fontSize: 14, fontWeight: 700 }}>
          {patient.name}
        </Typography>
        <Typography component="div" sx={{ fontSize: 12, color: gray[500] }}>
          MRN {patient.mrn} · {patient.age}
          {patient.sex} · {patient.dx} · Discharged {patient.hoursSince} hours ago
          {patient.contacted ? '' : ' · Never contacted'}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: `${space[2]}px`, alignItems: 'center', flexShrink: 0 }}>
        <CoordinatorSelect
          value={who}
          onChange={setWho}
          caseloads={caseloads}
          label={`Assign ${patient.name} to`}
        />
        <Button
          size="small"
          variant="contained"
          onClick={() => assignPatient(patient.mrn, who, caseloads)}
        >
          Assign
        </Button>
      </Box>
    </Box>
  )
}
