import { Box, Button, MenuItem, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { SectionLabel, SrcTag } from '@/components/atoms'
import { gray, space } from '@/theme/tokens'
import type { Patient } from '@/session/types'

const OUTCOMES = [
  'Reached — patient responsive',
  'Left voicemail',
  'No answer',
  'Patient refused',
  'Escalate to social work',
] as const

/**
 * Controlled and locally-stateful, so an incoming session event can no longer
 * wipe a half-typed note. The legacy page worked around that by refusing to
 * re-render the rail at all; mount this with `key={patient.mrn}` so switching
 * patients clears the draft deliberately rather than by accident.
 */
export function LogOutcomeForm({
  patient,
  onSubmit,
}: {
  patient: Patient
  onSubmit: (outcome: string, note: string) => void
}) {
  const [outcome, setOutcome] = useState('')
  const [note, setNote] = useState('')

  return (
    <Box
      component="form"
      onSubmit={(event) => {
        event.preventDefault()
        if (!outcome) return
        onSubmit(outcome, note)
        setOutcome('')
        setNote('')
      }}
    >
      <SectionLabel>Log an Outcome — {patient.name}</SectionLabel>
      <Typography sx={{ fontSize: 11, color: gray[500], marginBottom: `${space[3]}px` }}>
        {patient.contacted
          ? `Last contact: ${patient.lastOutcome ?? 'Contacted'}`
          : 'No contact logged since discharge.'}
      </Typography>

      <TextField
        select
        fullWidth
        size="small"
        label="Call Result"
        value={outcome}
        onChange={(event) => setOutcome(event.target.value)}
        slotProps={{ inputLabel: { shrink: true } }}
        sx={{ marginBottom: `${space[4]}px` }}
      >
        <MenuItem value="">
          <em>Select outcome…</em>
        </MenuItem>
        {OUTCOMES.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        fullWidth
        multiline
        minRows={3}
        size="small"
        label="Notes"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="e.g. Confirmed transportation barrier — no ride to pharmacy. Referred to patient transport services."
        slotProps={{ inputLabel: { shrink: true } }}
        sx={{ marginBottom: `${space[4]}px` }}
      />

      <Button type="submit" variant="contained" fullWidth disabled={!outcome}>
        Save Outcome
      </Button>

      <Box
        sx={{
          textAlign: 'center',
          marginTop: `${space[3]}px`,
          fontSize: 11,
          color: gray[500],
          lineHeight: 1.6,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
          Writes once to <SrcTag system="hc" />
        </Box>
        No duplicate entry in Epic required
      </Box>
    </Box>
  )
}
