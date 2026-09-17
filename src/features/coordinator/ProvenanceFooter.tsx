import { Box } from '@mui/material'
import type { ReactNode } from 'react'
import { SrcTag } from '@/components/atoms'
import type { ProvenanceKind } from '@/data/types'
import { gray, space } from '@/theme/tokens'

function Row({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: `${space[2]}px`,
        flexWrap: 'wrap',
        marginTop: `${space[2]}px`,
        fontSize: 10,
        color: gray[500],
      }}
    >
      {children}
    </Box>
  )
}

/**
 * The provenance line under each action card. These were five hardcoded HTML
 * strings in the legacy page, injected with innerHTML; as components they need
 * no escaping and no dangerouslySetInnerHTML.
 */
export function ProvenanceFooter({ kind }: { kind: ProvenanceKind }) {
  switch (kind) {
    case 'reason':
      return (
        <Row>
          <SrcTag system="agent" />
          <span>reasoning from</span>
          <SrcTag system="epic" />
          <span>+</span>
          <SrcTag system="sfdc" />
        </Row>
      )
    case 'mychart':
      return (
        <Row>
          <SrcTag system="agent" />
          <span>writes to</span>
          <SrcTag system="epic" label="MyChart" />
        </Row>
      )
    case 'healthCloud':
      return (
        <Row>
          <SrcTag system="agent" />
          <span>writes to</span>
          <SrcTag system="hc" />
        </Row>
      )
    case 'rxSms':
      return (
        <Row>
          <span>Rx data</span>
          <SrcTag system="epic" />
          <span>· consent</span>
          <SrcTag system="sfdc" />
          <span>· sends via</span>
          <SrcTag system="mc" />
        </Row>
      )
    case 'sms':
      return (
        <Row>
          <span>consent</span>
          <SrcTag system="sfdc" />
          <span>· sends via</span>
          <SrcTag system="mc" />
        </Row>
      )
  }
}
