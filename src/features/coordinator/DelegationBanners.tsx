import { Box, Button, Typography } from '@mui/material'
import { daysSince } from '@/data/invariants'
import type { Patient } from '@/session/types'
import { brand, radius, source, space } from '@/theme/tokens'

/**
 * Shown when the manager hands a patient over and the coordinator hasn't
 * acknowledged yet. Maroon because it is this layer routing work, not the
 * per-role accent.
 */
export function DelegationBanners({
  patients,
  onAccept,
  onDecline,
}: {
  patients: readonly Patient[]
  onAccept: (patient: Patient) => void
  onDecline: (patient: Patient) => void
}) {
  if (patients.length === 0) return null

  return (
    <>
      {patients.map((patient) => (
        <Box
          key={patient.mrn}
          role="region"
          aria-label={`New assignment: ${patient.name}`}
          sx={{
            display: 'flex',
            gap: `${space[4]}px`,
            alignItems: 'flex-start',
            border: `1.5px solid ${brand.maroon}`,
            backgroundColor: source.app.bg,
            borderRadius: `${radius.md}px`,
            padding: `${space[4]}px ${space[5]}px`,
            marginBottom: `${space[4]}px`,
          }}
        >
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              backgroundColor: brand.maroon,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            JP
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography component="div" sx={{ fontSize: 14, fontWeight: 700, color: brand.maroonDark }}>
              James Porter assigned you {patient.name}
            </Typography>
            <Typography component="div" sx={{ fontSize: 13, marginTop: '3px', lineHeight: 1.55 }}>
              Risk score <strong>{patient.score}</strong> · {patient.dx} · discharged{' '}
              {daysSince(patient.hoursSince)} days ago
              {patient.contacted ? '' : ' · never contacted'}. Added to the top of your queue.
            </Typography>
            <Box sx={{ display: 'flex', gap: `${space[2]}px`, marginTop: `${space[3]}px`, flexWrap: 'wrap' }}>
              <Button size="small" variant="contained" onClick={() => onAccept(patient)}>
                Acknowledge &amp; Start
              </Button>
              <Button size="small" variant="text" onClick={() => onDecline(patient)}>
                I can&apos;t take this
              </Button>
            </Box>
          </Box>
        </Box>
      ))}
    </>
  )
}
