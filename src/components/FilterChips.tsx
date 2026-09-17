import { Box } from '@mui/material'
import { gray, radius, space, surface } from '@/theme/tokens'

export interface FilterOption<T extends string> {
  id: T
  label: string
  count?: number
}

/**
 * The legacy `.chip-row` filter set. A radio group in behaviour, so it's
 * marked up as one rather than as a row of buttons.
 */
export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly FilterOption<T>[]
  value: T
  onChange: (id: T) => void
  label: string
}) {
  return (
    <Box
      role="radiogroup"
      aria-label={label}
      sx={{ display: 'flex', gap: `${space[2]}px`, flexWrap: 'wrap' }}
    >
      {options.map((option) => {
        const active = option.id === value
        return (
          <Box
            key={option.id}
            component="button"
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.id)}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: `5px ${space[3]}px`,
              borderRadius: `${radius.pill}px`,
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'inherit',
              cursor: 'pointer',
              transition: 'all 0.12s',
              backgroundColor: active ? 'primary.main' : gray.white,
              color: active ? gray.white : gray[700],
              border: `1.5px solid ${active ? 'transparent' : surface.border}`,
              '&:hover': { borderColor: active ? 'transparent' : gray[300] },
              '&:focus-visible': { outline: '3px solid', outlineColor: 'primary.main', outlineOffset: 2 },
            }}
          >
            {option.label}
            {option.count !== undefined ? (
              <Box
                component="span"
                sx={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: `${radius.pill}px`,
                  backgroundColor: active ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.08)',
                }}
              >
                {option.count}
              </Box>
            ) : null}
          </Box>
        )
      })}
    </Box>
  )
}
