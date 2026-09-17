import { Box } from '@mui/material'
import { gray, radius, space } from '@/theme/tokens'
import { sessionActions } from '@/session/react'
import { toast } from '@/ui/toastApi'

/** Fixed bottom-left affordance for putting the demo back to its seed. */
export function DemoResetButton({ onReset }: { onReset?: () => void }) {
  return (
    <Box
      component="button"
      type="button"
      onClick={() => {
        onReset?.()
        sessionActions.reset()
        toast('Demo reset', 'Session state cleared.', 'info')
      }}
      sx={{
        position: 'fixed',
        bottom: space[4],
        left: space[4],
        zIndex: (theme) => theme.zIndex.appBar - 20,
        backgroundColor: 'rgba(26,26,26,0.85)',
        color: gray.white,
        border: 0,
        borderRadius: `${radius.pill}px`,
        fontSize: 12,
        fontFamily: 'inherit',
        padding: '7px 14px',
        cursor: 'pointer',
        backdropFilter: 'blur(4px)',
        '&:hover': { backgroundColor: 'rgba(26,26,26,0.95)' },
      }}
    >
      ↺ Reset demo
    </Box>
  )
}
