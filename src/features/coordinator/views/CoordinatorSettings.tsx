import { Box, Button, Typography } from '@mui/material'
import { Panel } from '@/components/Panel'
import { PageHead } from '@/components/shell/AppShell'
import { KeyValue, KeyValueGrid } from '@/components/KeyValue'
import { Meter } from '@/components/Meter'
import { SectionLabel } from '@/components/atoms'
import { SettingRow } from '@/components/SettingsControls'
import { UcmAlert } from '@/components/UcmAlert'
import { COORDINATORS, MANAGER } from '@/data/patients'
import { sessionActions, useCaseloads, useSettings } from '@/session/react'
import { gray, space } from '@/theme/tokens'
import { toast } from '@/ui/toastApi'
import { sessionStore } from '@/session/store'
import { ME } from '../me'
import { initials } from '@/util/initials'
import type { Caseload } from '../useCaseload'

const ME_PROFILE = COORDINATORS.find((c) => c.id === ME)!

/**
 * Read-only by design. Risk thresholds and capacity are the manager's to set —
 * showing them here as someone else's decision is more honest than offering
 * controls that would either not persist or would let a coordinator re-tier
 * the whole board.
 */
export function CoordinatorSettings({ caseload }: { caseload: Caseload }) {
  const settings = useSettings()
  const caseloads = useCaseloads()
  const mine = caseloads.find((c) => c.coord.id === ME)

  return (
    <>
      <PageHead title="Settings" sub="Your profile and the rules your queue is scored against" />

      <Panel title="Profile" sub="From the Health Cloud coordinator record">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: `${space[4]}px`, marginBottom: `${space[5]}px` }}>
          <Box
            sx={{
              width: 54,
              height: 54,
              borderRadius: '50%',
              flexShrink: 0,
              backgroundColor: 'primary.light',
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 19,
              fontWeight: 800,
            }}
          >
            {initials(ME_PROFILE.name)}
          </Box>
          <Box>
            <Typography component="div" sx={{ fontSize: 17, fontWeight: 700 }}>
              {ME_PROFILE.name}
            </Typography>
            <Typography component="div" sx={{ fontSize: 13, color: gray[500] }}>
              {ME_PROFILE.team} · reports to {MANAGER.name}
            </Typography>
          </Box>
        </Box>

        <KeyValueGrid>
          <KeyValue label="Current caseload" value={`${caseload.total} patients`} src="hc" />
          <KeyValue label="High risk" value={`${caseload.counts.high} patients`} src="dc" />
          <KeyValue label="Callbacks outstanding" value={`${caseload.counts.callbacks}`} src="sfdc" />
          <KeyValue
            label="Contact rate"
            value={mine?.contactRate === null || mine === undefined ? '—' : `${mine.contactRate}%`}
            src="sfdc"
          />
        </KeyValueGrid>

        {mine ? (
          <Box sx={{ marginTop: `${space[5]}px` }}>
            <SectionLabel>Capacity</SectionLabel>
            <Meter
              value={mine.total}
              capacity={mine.capacity}
              left={`${mine.total} of ${mine.capacity} capacity`}
              right={mine.overBy ? `Over by ${mine.overBy}` : 'Within capacity'}
            />
          </Box>
        ) : null}
      </Panel>

      <Panel
        title="Scoring & Contact Rules"
        sub={`Managed by ${MANAGER.name} · read-only here`}
      >
        <UcmAlert severity="info" title="These are set for the whole team">
          Changing a threshold re-tiers every patient for every coordinator, so it sits with your
          manager. You will see the effect here immediately when they change it.
        </UcmAlert>

        <SettingRow
          name="High-risk threshold"
          desc={
            <>
              Patients scoring at or above this are flagged high risk.{' '}
              <strong>{caseload.counts.high}</strong> of your patients currently qualify.
            </>
          }
          control={<ReadOnlyValue>{settings.highThreshold}</ReadOnlyValue>}
        />
        <SettingRow
          name="Medium-risk threshold"
          desc={
            <>
              Below this, patients are monitoring-only.{' '}
              <strong>{caseload.counts.medium}</strong> of yours are medium.
            </>
          }
          control={<ReadOnlyValue>{settings.mediumThreshold}</ReadOnlyValue>}
        />
        <SettingRow
          name="Contact window"
          desc="How long after discharge first contact should happen. Drives the overdue flag on your queue."
          control={<ReadOnlyValue>{settings.contactWindowHours}h</ReadOnlyValue>}
        />
        <SettingRow
          name="Coordinator capacity"
          desc="Patients per coordinator before the team is flagged over capacity."
          control={<ReadOnlyValue>{settings.defaultCapacity}</ReadOnlyValue>}
        />
      </Panel>

      <Panel title="Session" sub="Prototype state management">
        <SettingRow
          name="Reset demo state"
          desc="Clears all assignments, messages, and logged outcomes, and restores default thresholds."
          control={
            <Button
              variant="outlined"
              onClick={() => {
                sessionActions.reset()
                toast('Demo reset', 'Session state cleared.', 'info')
              }}
            >
              Reset Everything
            </Button>
          }
        />
        <SettingRow
          name="Storage backend"
          desc={
            <Typography component="span" sx={{ fontSize: 12, color: gray[500] }}>
              {sessionStore.persistent
                ? 'localStorage — state persists across reloads and syncs to other open tabs.'
                : 'In-memory fallback — localStorage is blocked, so state will not persist or sync between tabs.'}
            </Typography>
          }
          control={null}
        />
      </Panel>
    </>
  )
}

function ReadOnlyValue({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      component="div"
      sx={{
        minWidth: 52,
        textAlign: 'center',
        fontSize: 14,
        fontWeight: 700,
        color: gray[700],
        backgroundColor: gray[100],
        borderRadius: '4px',
        padding: '6px 12px',
      }}
    >
      {children}
    </Typography>
  )
}
