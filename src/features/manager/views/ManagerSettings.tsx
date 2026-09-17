import { Button, Typography } from '@mui/material'
import { Breadcrumb } from '@/components/Breadcrumb'
import { Panel } from '@/components/Panel'
import { PageHead } from '@/components/shell/AppShell'
import { SettingRow, Stepper, Toggle } from '@/components/SettingsControls'
import { UcmAlert } from '@/components/UcmAlert'
import { sessionActions, useSettings } from '@/session/react'
import { sessionStore } from '@/session/store'
import { gray } from '@/theme/tokens'
import { toast } from '@/ui/toastApi'
import { canStep, stepSetting, type SteppableSetting } from '../settingsRules'
import type { ManagerOverview } from '../useManagerData'

export function ManagerSettings({ overview }: { overview: ManagerOverview }) {
  const settings = useSettings()

  // Computed from the live snapshot rather than the rendered props: two clicks
  // in the same frame, or a concurrent change in another tab, would otherwise
  // both step from the same stale value and the second would be a no-op.
  const step = (key: SteppableSetting) => (direction: -1 | 1) => {
    const current = sessionActions.getSnapshot().settings
    const next = stepSetting(current, key, direction)
    if (next === null) return
    sessionActions.updateSettings({ [key]: next })
  }

  const stepperFor = (key: SteppableSetting, label: string, suffix = '') => (
    <Stepper
      label={label}
      value={`${settings[key]}${suffix}`}
      onStep={step(key)}
      canDecrement={canStep(settings, key, -1)}
      canIncrement={canStep(settings, key, 1)}
    />
  )

  return (
    <>
      <Breadcrumb trail={[{ label: 'Dashboard', to: '/manager/dashboard' }, { label: 'Settings' }]} />
      <PageHead title="Settings" sub="Live controls — every change re-scores the whole board immediately" />

      <UcmAlert severity="info" title="These are live, not saved drafts">
        Changing a threshold re-tiers every patient across every view, in this tab and any other
        open tab, the moment you click.
      </UcmAlert>

      <Panel title="Risk Thresholds" sub="Score boundaries that determine patient tier">
        <SettingRow
          name="High-risk threshold"
          desc={
            <>
              Patients scoring at or above this are flagged high risk and surface in the priority
              queue. Currently <strong>{overview.counts.high}</strong> patients qualify.
            </>
          }
          control={stepperFor('highThreshold', 'High-risk threshold')}
        />
        <SettingRow
          name="Medium-risk threshold"
          desc={
            <>
              Lower boundary for medium risk. Below this, patients are monitoring-only. Currently{' '}
              <strong>{overview.counts.medium}</strong> patients qualify as medium.
            </>
          }
          control={stepperFor('mediumThreshold', 'Medium-risk threshold')}
        />
      </Panel>

      <Panel title="Capacity & Contact Rules" sub="Operational targets used for alerts and auto-assignment">
        <SettingRow
          name="Coordinator capacity"
          desc={
            <>
              Maximum patients per coordinator before they are flagged over capacity.{' '}
              <strong>{overview.overCapacity.length}</strong> coordinators currently exceed this.
            </>
          }
          control={stepperFor('defaultCapacity', 'Coordinator capacity')}
        />
        <SettingRow
          name="Contact window (hours)"
          desc="Target window for first contact after discharge. Drives the contact-rate metric and the overdue alert on the dashboard."
          control={stepperFor('contactWindowHours', 'Contact window', 'h')}
        />
        <SettingRow
          name="Notify on unassigned high-risk"
          desc="Show the red dashboard banner when any high-risk patient has no coordinator."
          control={
            <Toggle
              label="Notify on unassigned high-risk"
              checked={settings.notifyOnUnassigned}
              onChange={(next) => sessionActions.updateSettings({ notifyOnUnassigned: next })}
            />
          }
        />
      </Panel>

      <Panel title="Session" sub="Prototype state management">
        <SettingRow
          name="Reset demo state"
          desc="Clears all assignments, messages, and activity, and restores default thresholds. Use between demo runs."
          control={
            <Button
              variant="outlined"
              onClick={() => {
                sessionActions.reset()
                toast(
                  'Demo reset',
                  'All assignments, messages, and settings restored to defaults.',
                  'info',
                )
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
