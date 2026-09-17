import { Box, Button, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material'
import { useMemo, useState } from 'react'
import { EmptyState } from '@/components/EmptyState'
import { FilterChips, type FilterOption } from '@/components/FilterChips'
import { Panel } from '@/components/Panel'
import { PageHead } from '@/components/shell/AppShell'
import { NeutralBadge } from '@/components/atoms'
import { UcmAlert } from '@/components/UcmAlert'
import { gray, space, surface } from '@/theme/tokens'
import { toast } from '@/ui/toastApi'
import { PROTOCOLS, PROTOCOL_SERVICES, type Protocol } from '../protocolLibrary'
import type { Caseload } from '../useCaseload'

type ServiceFilter = string

/**
 * A document index, not the documents themselves — the prototype has no
 * content store behind this. The one genuinely live column is "In your
 * queue", joined from each protocol's diagnoses to the actual caseload.
 */
export function CoordinatorProtocols({ caseload }: { caseload: Caseload }) {
  const [query, setQuery] = useState('')
  const [service, setService] = useState<ServiceFilter>('all')

  /** How many of my patients each protocol covers. */
  const applicableCount = useMemo(() => {
    const counts = new Map<string, number>()
    for (const protocol of PROTOCOLS) {
      const n =
        protocol.appliesToDx.length === 0
          ? caseload.total // the universal standard covers everyone
          : caseload.rows.filter((r) => protocol.appliesToDx.includes(r.patient.dx)).length
      counts.set(protocol.id, n)
    }
    return counts
  }, [caseload])

  const visible = useMemo(() => {
    const q = query.toLowerCase().trim()
    return PROTOCOLS.filter((protocol) => {
      if (service !== 'all' && protocol.service !== service) return false
      if (!q) return true
      return (
        protocol.title.toLowerCase().includes(q) ||
        protocol.service.toLowerCase().includes(q) ||
        protocol.appliesToDx.some((dx) => dx.toLowerCase().includes(q))
      )
    }).sort((a, b) => (applicableCount.get(b.id) ?? 0) - (applicableCount.get(a.id) ?? 0))
  }, [query, service, applicableCount])

  const relevant = visible.filter((p) => (applicableCount.get(p.id) ?? 0) > 0).length

  const serviceFilters: FilterOption<ServiceFilter>[] = [
    { id: 'all', label: 'All services', count: PROTOCOLS.length },
    ...PROTOCOL_SERVICES.map((s) => ({
      id: s,
      label: s,
      count: PROTOCOLS.filter((p) => p.service === s).length,
    })),
  ]

  return (
    <>
      <PageHead
        title="Care Protocols"
        sub={`${PROTOCOLS.length} published pathways · ${relevant} apply to patients in your queue`}
      />

      <UcmAlert severity="info" title="Reference index only in this prototype">
        Protocol documents live in the clinical content system. This view lists what is published
        and which of your patients each pathway covers; opening a document is not wired up.
      </UcmAlert>

      <Panel
        title="Published Pathways"
        sub="Sorted by how many of your patients they apply to"
        flush
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: `${space[4]}px`,
            padding: `${space[4]}px ${space[5]}px`,
            borderBottom: `1px solid ${surface.border}`,
            flexWrap: 'wrap',
          }}
        >
          <TextField
            size="small"
            placeholder="Search title, service or diagnosis…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            slotProps={{ input: { 'aria-label': 'Search protocols' } }}
            sx={{ minWidth: 280, flex: 1 }}
          />
        </Box>

        <Box sx={{ padding: `${space[4]}px ${space[5]}px`, borderBottom: `1px solid ${surface.border}` }}>
          <FilterChips
            label="Filter by owning service"
            options={serviceFilters}
            value={service}
            onChange={setService}
          />
        </Box>

        {visible.length === 0 ? (
          <EmptyState icon="📋" title="No protocols match">
            Try a different term or clear the service filter.
          </EmptyState>
        ) : (
          <Table aria-label="Care protocols">
            <TableHead>
              <TableRow>
                <TableCell>Protocol</TableCell>
                <TableCell>Owning Service</TableCell>
                <TableCell>Version</TableCell>
                <TableCell>Last Reviewed</TableCell>
                <TableCell>In Your Queue</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {visible.map((protocol) => (
                <ProtocolRow
                  key={protocol.id}
                  protocol={protocol}
                  applies={applicableCount.get(protocol.id) ?? 0}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>
    </>
  )
}

function ProtocolRow({ protocol, applies }: { protocol: Protocol; applies: number }) {
  const universal = protocol.appliesToDx.length === 0
  return (
    <TableRow hover>
      <TableCell>
        <Typography component="div" sx={{ fontSize: 14, fontWeight: 600 }}>
          {protocol.title}
        </Typography>
        <Typography component="div" sx={{ fontSize: 12, color: gray[500] }}>
          {universal ? 'Applies to every post-discharge patient' : protocol.appliesToDx.join(' · ')}
        </Typography>
      </TableCell>
      <TableCell sx={{ fontSize: 13 }}>{protocol.service}</TableCell>
      <TableCell sx={{ fontSize: 13, fontWeight: 600 }}>{protocol.version}</TableCell>
      <TableCell sx={{ fontSize: 13, color: gray[500] }}>{protocol.reviewed}</TableCell>
      <TableCell>
        {applies > 0 ? (
          <NeutralBadge>
            {applies} patient{applies === 1 ? '' : 's'}
          </NeutralBadge>
        ) : (
          <Typography component="span" sx={{ fontSize: 13, color: gray[500] }}>
            —
          </Typography>
        )}
      </TableCell>
      <TableCell>
        <Button
          size="small"
          variant="outlined"
          onClick={() =>
            toast(
              'Not available in the prototype',
              `${protocol.title} ${protocol.version} lives in the clinical content system.`,
              'info',
            )
          }
        >
          Open
        </Button>
      </TableCell>
    </TableRow>
  )
}
