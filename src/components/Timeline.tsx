import { Box, Typography } from '@mui/material'
import { brand, gray, risk, space, surface } from '@/theme/tokens'
import type { TimelineDot, TimelineEntry } from '@/data/types'
import { Glyph, SrcTag } from './atoms'

const DOT_STYLE: Record<
  Exclude<TimelineDot, ''> | 'default',
  { bg: string; color: string; border: string }
> = {
  default: { bg: gray[100], color: gray[700], border: surface.border },
  maroon: { bg: brand.maroonTint, color: brand.maroon, border: brand.maroon },
  red: { bg: risk.high.bg, color: risk.high.dot, border: risk.high.dot },
  green: { bg: risk.low.bg, color: risk.low.dot, border: risk.low.dot },
}

export function Timeline({ items }: { items: readonly TimelineEntry[] }) {
  return (
    <Box sx={{ paddingLeft: `${space[1]}px` }}>
      {items.map((item, i) => {
        const dot = DOT_STYLE[item.dot ? item.dot : 'default']
        const isLast = i === items.length - 1
        return (
          <Box
            key={`${item.title}-${item.time}`}
            sx={{
              display: 'flex',
              gap: `${space[4]}px`,
              paddingBottom: isLast ? 0 : `${space[5]}px`,
              position: 'relative',
              // The connector between dots, suppressed on the last item.
              '&::before': isLast
                ? undefined
                : {
                    content: '""',
                    position: 'absolute',
                    left: 15,
                    top: 32,
                    bottom: 0,
                    width: '1px',
                    backgroundColor: surface.border,
                  },
            }}
          >
            <Box
              sx={{
                width: 31,
                height: 31,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                zIndex: 1,
                backgroundColor: dot.bg,
                color: dot.color,
                border: `2px solid ${dot.border}`,
              }}
            >
              <Glyph size={13}>{item.icon}</Glyph>
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography component="div" sx={{ fontSize: 14, fontWeight: 600 }}>
                {item.title}
              </Typography>
              <Typography
                component="div"
                sx={{ fontSize: 13, color: gray[700], marginTop: '2px', lineHeight: 1.5 }}
              >
                {item.desc}
              </Typography>
              <Box
                sx={{
                  fontSize: 11,
                  color: gray[500],
                  marginTop: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: `${space[2]}px`,
                  flexWrap: 'wrap',
                }}
              >
                {item.time}
                <SrcTag system={item.src} />
              </Box>
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}
