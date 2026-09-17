import { Box, Tooltip } from '@mui/material'
import { gray, radius, risk, space } from '@/theme/tokens'

export interface MiniBar {
  day: number
  pct: number
  belowTarget?: boolean
}

/**
 * The 14-day contact-rate sparkline. Pure CSS bars, as in the original — a
 * charting library would be heavier than the thing it draws.
 */
export function MiniBarChart({
  bars,
  monthLabel,
}: {
  bars: readonly MiniBar[]
  monthLabel: string
}) {
  return (
    <>
      <Box
        role="img"
        aria-label={`Contact rate for the last ${bars.length} days, ${bars[0]?.pct}% to ${bars.at(-1)?.pct}%`}
        sx={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: 70 }}
      >
        {bars.map((bar) => (
          <Tooltip key={bar.day} title={`${monthLabel} ${bar.day} — ${bar.pct}%`} arrow>
            <Box
              sx={{
                flex: 1,
                height: `${bar.pct}%`,
                minHeight: 4,
                borderRadius: '3px 3px 0 0',
                backgroundColor: bar.belowTarget ? risk.high.dot : 'primary.main',
                opacity: 0.85,
                transition: 'opacity 0.15s',
                '&:hover': { opacity: 1 },
              }}
            />
          </Tooltip>
        ))}
      </Box>
      <Box
        aria-hidden="true"
        sx={{
          display: 'flex',
          gap: '3px',
          marginTop: '6px',
          fontSize: 10,
          color: gray[500],
          '& > span': { flex: 1, textAlign: 'center' },
        }}
      >
        {bars.map((bar) => (
          <span key={bar.day}>{bar.day}</span>
        ))}
      </Box>
    </>
  )
}

/** Tier distribution bar used on the dashboard's Risk Distribution panel. */
export function DistributionBar({ pct, tone }: { pct: number; tone: 'over' | 'near' | 'ok' }) {
  const color =
    tone === 'over' ? risk.high.dot : tone === 'near' ? risk.medium.dot : risk.low.dot
  return (
    <Box
      sx={{
        height: 8,
        borderRadius: `${radius.pill}px`,
        backgroundColor: gray[100],
        overflow: 'hidden',
        marginTop: `${space[1]}px`,
      }}
    >
      <Box sx={{ height: '100%', width: `${pct}%`, backgroundColor: color, transition: 'width 0.3s' }} />
    </Box>
  )
}
