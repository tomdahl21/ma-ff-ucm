import { GlobalStyles as MuiGlobalStyles } from '@mui/material'

/** The handful of rules that genuinely have to be global. */
export function GlobalStyles() {
  return (
    <MuiGlobalStyles
      styles={{
        '.sr-only': {
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0 0 0 0)',
          whiteSpace: 'nowrap',
          border: 0,
        },
        // The arrival highlight for a patient streaming into the queue.
        // Was `@keyframes ucm-arrive` in the legacy sheet.
        '@keyframes ucm-arrive': {
          '0%': { backgroundColor: '#FFF4C2' },
          '100%': { backgroundColor: 'transparent' },
        },
      }}
    />
  )
}
