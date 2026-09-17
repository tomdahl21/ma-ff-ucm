import { Box, Typography } from '@mui/material'
import { relTime } from '@/session/selectors'
import { useActivity } from '@/session/react'
import type { ActivityVerb } from '@/session/types'
import { brand, gray, risk, source, space } from '@/theme/tokens'
import { Glyph } from '@/components/atoms'

const VERB_META: Record<ActivityVerb, { icon: string; bg: string; color: string }> = {
  assigned: { icon: '👤', bg: source.app.bg, color: brand.maroon },
  unassigned: { icon: '↩', bg: source.app.bg, color: brand.maroon },
  'logged call': { icon: '📞', bg: risk.low.bg, color: risk.low.text },
  messaged: { icon: '💬', bg: source.sfdc.bg, color: source.sfdc.main },
  acknowledged: { icon: '✓', bg: gray[100], color: gray[700] },
  'updated settings': { icon: '⚙️', bg: gray[100], color: gray[700] },
}

export function ActivityFeed() {
  const items = useActivity()

  if (items.length === 0) {
    return (
      <Typography sx={{ fontSize: 13, color: gray[500], padding: `${space[5]}px`, textAlign: 'center' }}>
        No activity yet this session.
        <br />
        Assign a patient or send a message to see it here.
      </Typography>
    )
  }

  return (
    <Box>
      {items.map((item) => {
        const meta = VERB_META[item.verb]
        return (
          <Box
            key={item.id}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: `${space[3]}px`,
              padding: `${space[3]}px 0`,
              borderBottom: `1px solid ${gray[100]}`,
              '&:last-child': { borderBottom: 'none' },
            }}
          >
            <Box
              sx={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: meta.bg,
                color: meta.color,
              }}
            >
              <Glyph size={11}>{meta.icon}</Glyph>
            </Box>
            <Typography component="div" sx={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.5 }}>
              <strong>{item.actorName}</strong> {item.verb} {item.detail}
            </Typography>
            <Typography
              component="div"
              sx={{ fontSize: 11, color: gray[500], flexShrink: 0, whiteSpace: 'nowrap' }}
            >
              {relTime(item.ts)}
            </Typography>
          </Box>
        )
      })}
    </Box>
  )
}
