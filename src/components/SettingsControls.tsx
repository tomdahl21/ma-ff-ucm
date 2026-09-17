import { Box, Switch, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { brand, gray, radius, space } from '@/theme/tokens'

/** One labelled row in a settings panel. */
export function SettingRow({
  name,
  desc,
  control,
}: {
  name: ReactNode
  desc?: ReactNode
  control: ReactNode
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: `${space[5]}px`,
        padding: `${space[4]}px 0`,
        borderBottom: `1px solid ${gray[100]}`,
        '&:last-child': { borderBottom: 'none' },
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography component="div" sx={{ fontSize: 14, fontWeight: 700 }}>
          {name}
        </Typography>
        {desc !== undefined ? (
          <Typography
            component="div"
            sx={{ fontSize: 12, color: gray[500], marginTop: '3px', lineHeight: 1.5 }}
          >
            {desc}
          </Typography>
        ) : null}
      </Box>
      <Box
        sx={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: `${space[3]}px`,
        }}
      >
        {control}
      </Box>
    </Box>
  )
}

/**
 * Numeric stepper. `canDecrement`/`canIncrement` come from the caller because
 * the limits are domain rules (thresholds can't cross each other), not
 * presentation.
 */
export function Stepper({
  value,
  label,
  onStep,
  canDecrement,
  canIncrement,
}: {
  value: ReactNode
  label: string
  onStep: (direction: -1 | 1) => void
  canDecrement: boolean
  canIncrement: boolean
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }} role="group" aria-label={label}>
      <StepButton
        side="left"
        disabled={!canDecrement}
        onClick={() => onStep(-1)}
        aria-label={`Decrease ${label}`}
      >
        −
      </StepButton>
      <Box
        aria-live="polite"
        sx={{
          minWidth: 52,
          height: 30,
          border: `1.5px solid ${gray[300]}`,
          borderLeft: 'none',
          borderRight: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          fontWeight: 700,
          backgroundColor: gray.white,
        }}
      >
        {value}
      </Box>
      <StepButton
        side="right"
        disabled={!canIncrement}
        onClick={() => onStep(1)}
        aria-label={`Increase ${label}`}
      >
        +
      </StepButton>
    </Box>
  )
}

function StepButton({
  side,
  children,
  disabled,
  onClick,
  ...rest
}: {
  side: 'left' | 'right'
  children: ReactNode
  disabled: boolean
  onClick: () => void
  'aria-label': string
}) {
  return (
    <Box
      component="button"
      type="button"
      disabled={disabled}
      onClick={onClick}
      {...rest}
      sx={{
        width: 30,
        height: 30,
        border: `1.5px solid ${gray[300]}`,
        backgroundColor: gray.white,
        cursor: disabled ? 'default' : 'pointer',
        fontSize: 15,
        fontWeight: 700,
        fontFamily: 'inherit',
        color: gray[700],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.4 : 1,
        borderRadius:
          side === 'left'
            ? `${radius.sm}px 0 0 ${radius.sm}px`
            : `0 ${radius.sm}px ${radius.sm}px 0`,
        '&:hover:not(:disabled)': { backgroundColor: gray[100] },
      }}
    >
      {children}
    </Box>
  )
}

/** Maroon when on — this is the app's own setting, not a role-accented control. */
export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
}) {
  return (
    <Switch
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      slotProps={{ input: { 'aria-label': label } }}
      sx={{
        '& .MuiSwitch-switchBase.Mui-checked': { color: brand.maroon },
        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
          backgroundColor: brand.maroon,
          opacity: 1,
        },
      }}
    />
  )
}
