import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useCallback, useRef, type KeyboardEvent } from 'react'
import { Glyph, RiskBadge, SrcTag } from '@/components/atoms'
import type { Mrn, RiskTier } from '@/session/types'
import { gray, risk, space } from '@/theme/tokens'
import type { CaseloadRow } from './useCaseload'

const SCORE_COLOR: Record<RiskTier, string> = {
  high: risk.high.text,
  medium: risk.medium.text,
  low: risk.low.text,
}

interface TriageTableProps {
  rows: readonly CaseloadRow[]
  selectedMrn: Mrn | undefined
  onSelect: (mrn: Mrn) => void
}

export function TriageTable({ rows, selectedMrn, onSelect }: TriageTableProps) {
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([])

  /* Arrow keys move focus and selection together — the correct pattern for a
     master/detail list, and it matches what the rail already does on click. */
  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTableRowElement>, index: number) => {
      const target =
        event.key === 'ArrowDown'
          ? index + 1
          : event.key === 'ArrowUp'
            ? index - 1
            : event.key === 'Home'
              ? 0
              : event.key === 'End'
                ? rows.length - 1
                : null

      if (target !== null) {
        event.preventDefault()
        const clamped = Math.min(Math.max(target, 0), rows.length - 1)
        const row = rows[clamped]
        if (row) {
          onSelect(row.patient.mrn)
          rowRefs.current[clamped]?.focus()
        }
        return
      }

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        const row = rows[index]
        if (row) onSelect(row.patient.mrn)
      }
    },
    [rows, onSelect],
  )

  return (
    <Table
      role="grid"
      aria-label="Patient triage list"
      aria-multiselectable={false}
      aria-controls="patient-detail"
      sx={{ width: '100%' }}
    >
      <TableHead>
        <TableRow>
          <TableCell>
            Patient <SrcTag system="epic" />
          </TableCell>
          <TableCell>Risk</TableCell>
          <TableCell>
            Score <SrcTag system="dc" />
          </TableCell>
          <TableCell>
            Diagnosis <SrcTag system="epic" />
          </TableCell>
          <TableCell>
            Discharged <SrcTag system="epic" />
          </TableCell>
          <TableCell>
            Last Contact <SrcTag system="sfdc" />
          </TableCell>
          <TableCell>
            Next Action <SrcTag system="agent" />
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row, index) => {
          const { patient, tier, days, detail, isNew } = row
          const selected = patient.mrn === selectedMrn
          return (
            <TableRow
              key={patient.mrn}
              ref={(el) => {
                rowRefs.current[index] = el
              }}
              hover
              selected={selected}
              role="row"
              aria-selected={selected}
              // Roving tabindex: the table is one tab stop, not one per row.
              tabIndex={selected ? 0 : -1}
              onClick={() => onSelect(patient.mrn)}
              onKeyDown={(event) => onKeyDown(event, index)}
              sx={{
                cursor: 'pointer',
                animation: isNew ? 'ucm-arrive 2.6s ease-out 1' : undefined,
                '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -2 },
                // The risk stripe. Drawn as a pseudo-element on the first cell
                // rather than a border-left on the row, so it survives if the
                // table ever needs border-collapse: separate for a sticky head.
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: `${space[2]}px` }}>
                  <Typography component="div" sx={{ fontSize: 14, fontWeight: 600 }}>
                    {patient.name}
                  </Typography>
                  {isNew ? (
                    <Box
                      component="span"
                      sx={{
                        fontSize: 9,
                        fontWeight: 800,
                        letterSpacing: '0.6px',
                        color: 'primary.main',
                        border: '1px solid',
                        borderColor: 'primary.main',
                        borderRadius: '3px',
                        padding: '0 4px',
                      }}
                    >
                      NEW
                    </Box>
                  ) : null}
                </Box>
                <Typography component="div" sx={{ fontSize: 12, color: gray[500] }}>
                  MRN {patient.mrn} · {patient.age}
                  {patient.sex}
                </Typography>
              </TableCell>
              <TableCell>
                <RiskBadge tier={tier} />
              </TableCell>
              <TableCell>
                <Typography
                  component="span"
                  sx={{ fontSize: 17, fontWeight: 800, color: SCORE_COLOR[tier] }}
                >
                  {patient.score}
                </Typography>
              </TableCell>
              <TableCell sx={{ fontSize: 14 }}>{patient.dx}</TableCell>
              <TableCell sx={{ fontSize: 14 }}>
                {days === 0 ? 'Today' : `${days} day${days === 1 ? '' : 's'} ago`}
              </TableCell>
              <TableCell
                sx={{
                  fontSize: 13,
                  color: patient.contacted ? gray[500] : risk.high.text,
                  fontWeight: patient.contacted ? 400 : 700,
                }}
              >
                {patient.contacted ? (patient.lastOutcome ?? 'Contacted') : 'Never'}
              </TableCell>
              <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>
                {detail ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Glyph size={13}>{detail.nextAction.slice(0, 2).trim()}</Glyph>
                    {detail.nextAction.replace(/^\S+\s*/, '')}
                  </Box>
                ) : (
                  <Typography component="span" sx={{ fontSize: 13, color: gray[500] }}>
                    —
                  </Typography>
                )}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
