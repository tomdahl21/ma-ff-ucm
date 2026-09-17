#!/usr/bin/env node
/**
 * Regenerates src/data/patients.ts and src/data/patientDetail.ts from the
 * legacy sources under public/legacy.
 *
 *   node scripts/generate-data.mjs
 *
 * Extraction is mechanical on purpose. The demo data is ~1200 authored values,
 * and a transcription slip in the risk-factor arithmetic would be silent, so
 * the values are read out of the original sources and cross-checked before
 * anything is written.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

/* ── 1. session.js: COORDINATORS, SEED_POOL, ROSTER, DEFAULT_SETTINGS ──
   Run the legacy IIFE against a minimal shim and read its public API. */
const sessionSrc = fs.readFileSync(path.join(REPO, 'public/legacy/js/session.js'), 'utf8')

const kv = new Map()
const shim = {
  localStorage: {
    getItem: (k) => (kv.has(k) ? kv.get(k) : null),
    setItem: (k, v) => kv.set(k, String(v)),
    removeItem: (k) => kv.delete(k),
  },
  addEventListener() {},
  BroadcastChannel: undefined,
  console,
}
new Function('__shim', sessionSrc.replace(/\}\)\(window\);\s*$/, '})(__shim);'))(shim)

const UCM = shim.UCM
if (!UCM) throw new Error('session.js did not attach UCM')

const coordinators = UCM.COORDINATORS
const manager = UCM.MANAGER
const settings = UCM.settings()
const roster = UCM.roster().map((p) => ({ ...p }))
const pool = UCM.getState().pool.map((p) => ({ ...p }))

/* ── 2. coordinator.html: the authored BASE records ────────────────────
   Evaluated with PROV stubbed to marker strings, which is exactly the
   ProvenanceKind union the TypeScript model wants. */
const coordSrc = fs.readFileSync(path.join(REPO, 'public/legacy/coordinator.html'), 'utf8')

const declAt = coordSrc.indexOf('var BASE = [')
if (declAt === -1) throw new Error('BASE array not found in coordinator.html')

const from = coordSrc.indexOf('[', declAt)
let depth = 0
let end = -1
let quote = null
for (let i = from; i < coordSrc.length; i++) {
  const c = coordSrc[i]
  if (quote) {
    if (c === quote && coordSrc[i - 1] !== '\\') quote = null
    continue
  }
  if (c === '"' || c === "'") {
    quote = c
    continue
  }
  if (c === '[') depth++
  else if (c === ']' && --depth === 0) {
    end = i
    break
  }
}
if (end === -1) throw new Error('unterminated BASE array')

const PROV = {
  reason: 'reason',
  mychart: 'mychart',
  healthCloud: 'healthCloud',
  rxSms: 'rxSms',
  sms: 'sms',
}
const base = new Function('PROV', `return ${coordSrc.slice(from, end + 1)};`)(PROV)

/* ── 3. Cross-checks — refuse to emit anything questionable ──────────── */
const problems = []

if (roster.length !== 47) problems.push(`roster length ${roster.length}, expected 47`)
if (pool.length !== 7) problems.push(`pool length ${pool.length}, expected 7`)
if (base.length !== 9) problems.push(`BASE length ${base.length}, expected 9`)

// MRN becomes the canonical id, so it has to be unique across the whole set.
const mrns = [...roster, ...pool].map((p) => p.mrn)
const dupes = mrns.filter((m, i) => mrns.indexOf(m) !== i)
if (dupes.length) problems.push(`duplicate MRNs: ${dupes.join(', ')}`)

// Every authored record must map onto exactly one roster row, and agree with it.
for (const b of base) {
  const match = roster.filter((r) => r.mrn === b.mrn)
  if (match.length !== 1) {
    problems.push(`BASE ${b.name} (${b.mrn}) matched ${match.length} roster rows`)
    continue
  }
  for (const f of ['name', 'age', 'sex', 'dx', 'score']) {
    if (String(match[0][f]) !== String(b[f])) {
      problems.push(`BASE/roster mismatch ${b.mrn}.${f}: ${b[f]} vs ${match[0][f]}`)
    }
  }
}

// The authored factor arithmetic: factors sum to epicPts/sfdcPts, which sum to score.
for (const b of base) {
  const sum = (src) => b.factors.filter((f) => f.src === src).reduce((n, f) => n + f.pts, 0)
  if (sum('epic') !== b.epicPts) problems.push(`${b.id}: epic ${sum('epic')} != ${b.epicPts}`)
  if (sum('sfdc') !== b.sfdcPts) problems.push(`${b.id}: sfdc ${sum('sfdc')} != ${b.sfdcPts}`)
  if (b.epicPts + b.sfdcPts !== b.score) {
    problems.push(`${b.id}: ${b.epicPts}+${b.sfdcPts} != score ${b.score}`)
  }
}

if (problems.length) {
  console.error('refusing to generate:')
  for (const p of problems) console.error('  -', p)
  process.exit(1)
}

/* ── 4. Emit ──────────────────────────────────────────────────────────── */
const q = (s) => JSON.stringify(s)
const detailByMrn = new Map(base.map((b) => [b.mrn, b]))

const patients = [
  ...roster.map((r) => ({
    mrn: r.mrn,
    name: r.name,
    age: r.age,
    sex: r.sex,
    dx: r.dx,
    score: r.score,
    assignedTo: r.assignedTo,
    contacted: r.contacted,
    hoursSince: r.hoursSince,
    lastOutcome: r.lastOutcome ?? null,
    ...(detailByMrn.has(r.mrn)
      ? {
          epicPts: detailByMrn.get(r.mrn).epicPts,
          sfdcPts: detailByMrn.get(r.mrn).sfdcPts,
        }
      : {}),
  })),
  ...pool.map((p) => ({
    mrn: p.mrn,
    name: p.name,
    age: p.age,
    sex: p.sex,
    dx: p.dx,
    score: p.score,
    assignedTo: null,
    contacted: p.contacted,
    hoursSince: p.hoursSince,
    lastOutcome: null,
    epicPts: p.epicPts,
    sfdcPts: p.sfdcPts,
  })),
]

const patientLine = (p) => {
  const parts = [
    `mrn: ${q(p.mrn)}`,
    `name: ${q(p.name)}`,
    `age: ${p.age}`,
    `sex: ${q(p.sex)}`,
    `dx: ${q(p.dx)}`,
    `score: ${p.score}`,
    `assignedTo: ${p.assignedTo === null ? 'null' : q(p.assignedTo)}`,
    `contacted: ${p.contacted}`,
    `hoursSince: ${p.hoursSince}`,
    `lastOutcome: ${p.lastOutcome === null ? 'null' : q(p.lastOutcome)}`,
  ]
  if (p.epicPts !== undefined) parts.push(`epicPts: ${p.epicPts}`, `sfdcPts: ${p.sfdcPts}`)
  return `  { ${parts.join(', ')} },`
}

const assigned = patients.filter((p) => p.assignedTo).length
const withSplit = patients.filter((p) => p.epicPts !== undefined).length

fs.writeFileSync(
  path.join(REPO, 'src/data/patients.ts'),
  `/* AUTO-GENERATED by scripts/generate-data.mjs — do not hand-edit.
 *
 * ${patients.length} patients: ${assigned} already owned by a coordinator, ${patients.length - assigned} in the
 * unassigned queue. ${withSplit} carry an authored Epic/Salesforce score split; the
 * rest show no breakdown rather than a fabricated one.
 */
import type { Coordinator, Patient, Settings } from '@/session/types'

export const COORDINATORS: readonly Coordinator[] = [
${coordinators
  .map(
    (c) =>
      `  { id: ${q(c.id)}, name: ${q(c.name)}, short: ${q(c.short)}, team: ${q(c.team)}${
        c.away ? ', away: true' : ''
      } },`,
  )
  .join('\n')}
]

export const MANAGER = {
  id: 'james',
  name: ${q(manager.name)},
  role: ${q(manager.role)},
} as const

export const DEFAULT_SETTINGS: Settings = {
  highThreshold: ${settings.highThreshold},
  mediumThreshold: ${settings.mediumThreshold},
  contactWindowHours: ${settings.contactWindowHours},
  defaultCapacity: ${settings.defaultCapacity},
  notifyOnUnassigned: ${settings.notifyOnUnassigned},
}

export const SEED_PATIENTS: readonly Patient[] = [
${patients.map(patientLine).join('\n')}
]
`,
)

fs.writeFileSync(
  path.join(REPO, 'src/data/patientDetail.ts'),
  `/* AUTO-GENERATED by scripts/generate-data.mjs — do not hand-edit.
 *
 * The authored narrative for ${base.length} patients: scored risk factors,
 * Epic-vs-Salesforce conflicts, next best actions and timeline moments.
 * Factor points sum to epicPts / sfdcPts, which sum to score — enforced by
 * src/data/invariants.ts.
 */
import type { PatientDetail } from './types'

export const PATIENT_DETAIL: readonly PatientDetail[] = ${JSON.stringify(
    base.map((b) => ({
      mrn: b.mrn,
      dischargedOn: b.dischargedOn,
      dischargedAgo: b.dischargedAgo,
      assignedOn: b.assignedOn,
      nextAction: b.nextAction,
      authoredTier: b.tier,
      admit: b.admit,
      discharge: b.discharge,
      factors: b.factors,
      conflicts: b.conflicts,
      actions: b.actions,
      ...(b.events ? { events: b.events } : {}),
    })),
    null,
    2,
  )}

export const DETAIL_BY_MRN: ReadonlyMap<string, PatientDetail> = new Map(
  PATIENT_DETAIL.map((d) => [d.mrn, d]),
)
`,
)

console.log(`patients.ts       ${patients.length} (${assigned} assigned, ${withSplit} with split)`)
console.log(`patientDetail.ts  ${base.length}`)
