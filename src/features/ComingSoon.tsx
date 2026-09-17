import { Box, Button, Typography } from '@mui/material'
import { Link } from 'react-router'
import { Panel } from '@/components/Panel'
import { UcmAlert } from '@/components/UcmAlert'
import { gray, space } from '@/theme/tokens'

/**
 * Placeholder for the routes not yet ported. Links to the original static
 * page so the demo stays navigable while the rebuild lands in phases.
 */
export function ComingSoon({
  title,
  phase,
  legacyHref,
}: {
  title: string
  phase: string
  legacyHref: string
}) {
  return (
    <Box sx={{ maxWidth: 720, margin: '0 auto', padding: `${space[12]}px ${space[6]}px` }}>
      <Panel title={title} sub={`Not yet rebuilt — scheduled for ${phase}`}>
        <UcmAlert severity="info" title="This view is still the original prototype">
          The React rebuild is landing in phases. The coordinator view is done; this one still runs
          as the original static page.
        </UcmAlert>
        <Typography sx={{ fontSize: 14, color: gray[700], marginBottom: `${space[5]}px` }}>
          Note that the original pages no longer share live session state with the React app — the
          consolidated patient model uses a new storage schema.
        </Typography>
        <Box sx={{ display: 'flex', gap: `${space[3]}px`, flexWrap: 'wrap' }}>
          <Button variant="contained" component="a" href={legacyHref}>
            Open the original page
          </Button>
          <Button variant="outlined" component={Link} to="/coordinator">
            Go to the rebuilt coordinator view
          </Button>
        </Box>
      </Panel>
    </Box>
  )
}
