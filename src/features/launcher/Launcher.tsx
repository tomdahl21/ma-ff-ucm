import { Box, Typography } from '@mui/material'
import { Link } from 'react-router'
import { gray, radius, source, space, surface } from '@/theme/tokens'

interface RoleCard {
  to: string
  accent: string
  avatarBg: string
  initials: string
  name: string
  title: string
  question: string
  bullets: string[]
  cta: string
  /** Phase 1 only ported the coordinator view. */
  ready: boolean
}

const ROLES: RoleCard[] = [
  {
    to: '/coordinator',
    accent: '#820B25',
    avatarBg: '#F5E8EB',
    initials: 'SL',
    name: 'Sarah Lin',
    title: 'Care Coordinator, RN',
    question: '"Who do I call first today?"',
    bullets: [
      'Risk-ordered patient queue',
      'Next best actions per patient',
      'Unified Epic + Salesforce timeline',
      'One-click call outcome logging',
    ],
    cta: 'Open Triage Queue',
    ready: true,
  },
  {
    to: '/manager',
    accent: '#3D6B9E',
    avatarBg: '#DDEAF8',
    initials: 'JP',
    name: 'James Porter',
    title: 'Manager, Care Coordination',
    question: '"Is anyone falling through the cracks?"',
    bullets: [
      'Unassigned high-risk alerts',
      'Team caseload & capacity view',
      'Live daily activity KPIs',
      'Inline patient assignment',
    ],
    cta: 'Open Manager Dashboard',
    ready: false,
  },
  {
    to: '/executive',
    accent: '#3D3D3D',
    avatarBg: '#F2F2F2',
    initials: 'DR',
    name: 'Dr. David Reyes',
    title: 'Chief Medical Officer',
    question: '"Are we actually improving?"',
    bullets: [
      '30-day readmission trend',
      'Traced patient journey',
      'Cross-system contribution view',
      'Board-ready impact narrative',
    ],
    cta: 'Open Executive Overview',
    ready: false,
  },
]

const LEGEND = [
  { key: 'epic', dot: source.epic.main, title: 'Epic EHR', text: 'Clinical truth — diagnosis, discharge, medications' },
  { key: 'sfdc', dot: source.sfdc.main, title: 'Salesforce', text: 'Engagement truth — calls, consent, assignment' },
  { key: 'agent', dot: source.agent.main, title: 'Agentforce', text: 'AI-generated next best actions' },
  { key: 'mc', dot: source.mc.main, title: 'Marketing Cloud', text: 'Outbound SMS and email channels' },
  { key: 'app', dot: '#FFFFFF', title: 'This Layer', text: 'Joins them, resolves conflicts, routes the work' },
]

export function Launcher() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #6B0820 0%, #820B25 45%, #5C0819 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${space[12]}px ${space[8]}px`,
      }}
    >
      <Box sx={{ textAlign: 'center', marginBottom: `${space[10]}px` }}>
        <Box
          component="img"
          src="/img/uchicago-medicine-logo-vector.svg"
          alt="UChicago Medicine"
          sx={{ height: 210, width: 'auto', filter: 'brightness(0) invert(1)', marginBottom: `${space[6]}px` }}
        />
        <Typography sx={{ color: gray.white, fontSize: 32, fontWeight: 700, letterSpacing: '-0.6px' }}>
          Care Coordination Platform
        </Typography>
        <Typography
          sx={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: 15,
            marginTop: `${space[2]}px`,
            maxWidth: 540,
            marginX: 'auto',
            lineHeight: 1.6,
          }}
        >
          A unified orchestration layer bringing Epic clinical data and Salesforce engagement data
          together into a single actionable view — so no high-risk patient falls through the cracks.
        </Typography>
        <Box
          component="span"
          sx={{
            display: 'inline-block',
            marginTop: `${space[4]}px`,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.65)',
            border: '1px solid rgba(255,255,255,0.3)',
            padding: '5px 14px',
            borderRadius: `${radius.pill}px`,
          }}
        >
          Prototype · Select a role to begin
        </Box>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: `${space[5]}px`,
          maxWidth: 1020,
          width: '100%',
          '@media (max-width: 920px)': { gridTemplateColumns: '1fr', maxWidth: 460 },
        }}
      >
        {ROLES.map((role) => (
          <Box
            key={role.to}
            component={Link}
            to={role.to}
            sx={{
              backgroundColor: gray.white,
              borderRadius: `${radius.lg}px`,
              overflow: 'hidden',
              textDecoration: 'none',
              color: 'inherit',
              boxShadow: surface.shadowLg,
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.18s ease, box-shadow 0.18s ease',
              border: '1px solid rgba(255,255,255,0.15)',
              '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 16px 40px rgba(0,0,0,0.3)' },
              '&:hover .cta-arrow': { transform: 'translateX(4px)' },
            }}
          >
            <Box sx={{ height: 6, backgroundColor: role.accent }} />
            <Box
              sx={{
                padding: `${space[6]}px ${space[6]}px ${space[4]}px`,
                display: 'flex',
                alignItems: 'center',
                gap: `${space[4]}px`,
                borderBottom: `1px solid ${gray[100]}`,
              }}
            >
              <Box
                sx={{
                  width: 54,
                  height: 54,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 19,
                  fontWeight: 800,
                  letterSpacing: '-0.5px',
                  flexShrink: 0,
                  backgroundColor: role.avatarBg,
                  color: role.accent,
                }}
              >
                {role.initials}
              </Box>
              <Box>
                <Typography sx={{ fontSize: 17, fontWeight: 700, lineHeight: 1.2 }}>
                  {role.name}
                </Typography>
                <Typography sx={{ fontSize: 12, color: gray[500], marginTop: '3px' }}>
                  {role.title}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ padding: `${space[5]}px ${space[6]}px`, flex: 1 }}>
              <Typography
                sx={{
                  fontFamily: (theme) => theme.serif,
                  fontSize: 16,
                  fontStyle: 'italic',
                  color: gray[700],
                  lineHeight: 1.5,
                  marginBottom: `${space[4]}px`,
                }}
              >
                {role.question}
              </Typography>
              <Box component="ul" sx={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                {role.bullets.map((bullet) => (
                  <Box
                    component="li"
                    key={bullet}
                    sx={{
                      fontSize: 13,
                      color: gray[700],
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: `${space[2]}px`,
                      lineHeight: 1.5,
                      '&::before': {
                        content: '""',
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        flexShrink: 0,
                        marginTop: '7px',
                        backgroundColor: role.accent,
                      },
                    }}
                  >
                    {bullet}
                  </Box>
                ))}
              </Box>
            </Box>

            <Box
              sx={{
                padding: `${space[4]}px ${space[6]}px`,
                backgroundColor: gray[100],
                borderTop: `1px solid ${surface.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 13,
                fontWeight: 700,
                color: role.accent,
              }}
            >
              {role.ready ? role.cta : `${role.cta} (original)`}
              <Box component="span" className="cta-arrow" sx={{ fontSize: 16, transition: 'transform 0.18s' }}>
                →
              </Box>
            </Box>
          </Box>
        ))}
      </Box>

      {/* ── Source legend ── */}
      <Box
        sx={{
          marginTop: `${space[10]}px`,
          maxWidth: 1020,
          width: '100%',
          borderTop: '1px solid rgba(255,255,255,0.2)',
          paddingTop: `${space[6]}px`,
        }}
      >
        <Typography
          sx={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '1.4px',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.5)',
            textAlign: 'center',
            marginBottom: `${space[5]}px`,
          }}
        >
          Throughout the app, every value carries its source
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: `${space[4]}px`,
            '@media (max-width: 920px)': { gridTemplateColumns: 'repeat(2, 1fr)' },
          }}
        >
          {LEGEND.map((item) => (
            <Box
              key={item.key}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: `${space[3]}px`,
                padding: `${space[3]}px`,
                borderRadius: `${radius.md}px`,
                backgroundColor: item.key === 'app' ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.07)',
                outline: item.key === 'app' ? '1px solid rgba(255,255,255,0.3)' : undefined,
              }}
            >
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  flexShrink: 0,
                  marginTop: '4px',
                  backgroundColor: item.dot,
                }}
              />
              <Box>
                <Typography sx={{ fontSize: 12, color: gray.white, fontWeight: 700 }}>
                  {item.title}
                </Typography>
                <Typography
                  sx={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4, marginTop: '2px' }}
                >
                  {item.text}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      <Box
        sx={{
          marginTop: `${space[10]}px`,
          display: 'flex',
          gap: `${space[6]}px`,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {[
          { href: '/legacy/index.html', label: 'Original prototype' },
          { href: '/legacy/coordinator.html', label: 'Original coordinator view' },
        ].map((link) => (
          <Box
            key={link.href}
            component="a"
            href={link.href}
            sx={{
              color: 'rgba(255,255,255,0.65)',
              fontSize: 13,
              textDecoration: 'none',
              borderBottom: '1px solid rgba(255,255,255,0.25)',
              paddingBottom: '2px',
              transition: 'color 0.15s',
              '&:hover': { color: gray.white, borderBottomColor: gray.white },
            }}
          >
            {link.label}
          </Box>
        ))}
      </Box>
    </Box>
  )
}
