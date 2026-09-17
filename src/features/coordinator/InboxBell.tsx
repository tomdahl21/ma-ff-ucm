import { Box, Button, Popover, Typography } from '@mui/material'
import { useState } from 'react'
import { Glyph } from '@/components/atoms'
import { relTime } from '@/session/selectors'
import { sessionActions, useInbox, useUnreadCount } from '@/session/react'
import type { CoordinatorId, Message } from '@/session/types'
import { brand, gray, radius, risk, source, space, surface } from '@/theme/tokens'

/**
 * Bell + inbox. A MUI Popover replaces the legacy document-level click
 * handler, which brings focus trapping, Escape-to-close and focus restore.
 */
export function InboxBell({ coordId }: { coordId: CoordinatorId }) {
  // Anchor lives in state, not a ref — a ref read during render isn't
  // guaranteed to be populated on the pass that opens the popover.
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const unread = useUnreadCount(coordId)
  const messages = useInbox(coordId)
  const open = anchor !== null

  return (
    <>
      <Box
        component="button"
        type="button"
        onClick={(event: React.MouseEvent<HTMLElement>) =>
          setAnchor((current) => (current ? null : event.currentTarget))
        }
        aria-label={`Notifications, ${unread} unread`}
        aria-haspopup="dialog"
        aria-expanded={open}
        sx={{
          position: 'relative',
          background: 'none',
          border: 0,
          cursor: 'pointer',
          padding: `${space[2]}px`,
          borderRadius: `${radius.sm}px`,
          transition: 'background 0.15s',
          '&:hover': { backgroundColor: 'rgba(255,255,255,0.15)' },
        }}
      >
        <Glyph size={18}>🔔</Glyph>
        {unread > 0 ? (
          <Box
            component="span"
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              minWidth: 16,
              height: 16,
              borderRadius: `${radius.pill}px`,
              backgroundColor: '#FFD34E',
              color: '#4A3200',
              border: `2px solid ${brand.maroon}`,
              fontSize: 9,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 3px',
            }}
          >
            {unread}
          </Box>
        ) : null}
      </Box>

      <Popover
        open={open}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 400, maxWidth: 'calc(100vw - 32px)', maxHeight: '70vh' } } }}
      >
        <Box
          sx={{
            padding: `${space[3]}px ${space[4]}px`,
            borderBottom: `1px solid ${surface.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography component="div" sx={{ fontSize: 14, fontWeight: 700 }}>
            Inbox
          </Typography>
          <Button size="small" variant="text" onClick={() => sessionActions.markAllRead(coordId)}>
            Mark all read
          </Button>
        </Box>

        <Box sx={{ overflowY: 'auto' }}>
          {messages.length === 0 ? (
            <Typography
              sx={{ padding: `${space[6]}px`, fontSize: 13, color: gray[500], textAlign: 'center' }}
            >
              No messages.
              <br />
              Assignments and notes from your manager appear here.
            </Typography>
          ) : (
            messages.map((message) => (
              <MessageRow key={message.id} message={message} coordId={coordId} />
            ))
          )}
        </Box>
      </Popover>
    </>
  )
}

function MessageRow({ message, coordId }: { message: Message; coordId: CoordinatorId }) {
  return (
    <Box
      sx={{
        padding: `${space[3]}px ${space[4]}px`,
        borderBottom: `1px solid ${gray[100]}`,
        borderLeft: `3px solid ${
          message.priority ? risk.high.dot : message.read ? 'transparent' : brand.maroon
        }`,
        backgroundColor: message.read ? 'transparent' : '#FFFDF4',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: `${space[2]}px`, flexWrap: 'wrap' }}>
        <Typography component="span" sx={{ fontSize: 13, fontWeight: 700 }}>
          {message.fromName}
        </Typography>
        <Box
          component="span"
          sx={{
            fontSize: 9,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
            padding: '1px 6px',
            borderRadius: '3px',
            backgroundColor: message.priority ? risk.high.bg : source.app.bg,
            color: message.priority ? risk.high.text : brand.maroon,
          }}
        >
          {message.priority ? 'Priority' : message.kind === 'assignment' ? 'Assignment' : 'Message'}
        </Box>
        <Typography component="span" sx={{ fontSize: 11, color: gray[500], marginLeft: 'auto' }}>
          {relTime(message.ts)}
        </Typography>
      </Box>

      <Typography sx={{ fontSize: 13, marginTop: '4px', lineHeight: 1.5 }}>{message.body}</Typography>

      {message.patientName ? (
        <Typography sx={{ fontSize: 12, color: brand.maroon, fontWeight: 600, marginTop: '4px' }}>
          → {message.patientName}
        </Typography>
      ) : null}

      {message.read ? null : (
        <Box sx={{ marginTop: `${space[2]}px` }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              sessionActions.markRead(message.id)
              if (message.patientMrn) sessionActions.acknowledge(message.patientMrn, coordId)
            }}
          >
            Acknowledge
          </Button>
        </Box>
      )}
    </Box>
  )
}
