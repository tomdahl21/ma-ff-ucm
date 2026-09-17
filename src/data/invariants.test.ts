import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, COORDINATORS, SEED_PATIENTS } from './patients'
import { DETAIL_BY_MRN, PATIENT_DETAIL } from './patientDetail'
import { tierFor, validateData } from './invariants'

describe('demo data', () => {
  it('holds all authored invariants', () => {
    expect(validateData()).toEqual([])
  })

  it('has the expected shape', () => {
    expect(SEED_PATIENTS).toHaveLength(54)
    expect(PATIENT_DETAIL).toHaveLength(9)
    expect(COORDINATORS).toHaveLength(6)
    expect(SEED_PATIENTS.filter((p) => p.assignedTo === null)).toHaveLength(7)
    expect(SEED_PATIENTS.filter((p) => p.assignedTo !== null)).toHaveLength(47)
  })

  it('uses MRN as a unique canonical id', () => {
    const mrns = new Set(SEED_PATIENTS.map((p) => p.mrn))
    expect(mrns.size).toBe(SEED_PATIENTS.length)
  })

  it('attaches every authored detail record to a real patient', () => {
    for (const d of PATIENT_DETAIL) {
      expect(SEED_PATIENTS.some((p) => p.mrn === d.mrn)).toBe(true)
    }
    expect(DETAIL_BY_MRN.size).toBe(PATIENT_DETAIL.length)
  })

  it('gives every patient with authored detail a score split', () => {
    for (const d of PATIENT_DETAIL) {
      const p = SEED_PATIENTS.find((x) => x.mrn === d.mrn)!
      expect(p.epicPts).toBeDefined()
      expect(p.sfdcPts).toBeDefined()
      expect(p.epicPts! + p.sfdcPts!).toBe(p.score)
    }
  })

  it('never stores a tier on a patient', () => {
    for (const p of SEED_PATIENTS) {
      expect(p).not.toHaveProperty('tier')
    }
  })
})

describe('tierFor', () => {
  it('bands on the settings thresholds', () => {
    expect(tierFor(75, DEFAULT_SETTINGS)).toBe('high')
    expect(tierFor(74, DEFAULT_SETTINGS)).toBe('medium')
    expect(tierFor(40, DEFAULT_SETTINGS)).toBe('medium')
    expect(tierFor(39, DEFAULT_SETTINGS)).toBe('low')
  })

  it('re-tiers when thresholds move — the legacy disagreement this prevents', () => {
    const maria = SEED_PATIENTS.find((p) => p.name === 'Maria Okonkwo')!
    expect(maria.score).toBe(62)
    expect(tierFor(maria.score, DEFAULT_SETTINGS)).toBe('medium')
    // Drop the high threshold below her score and she is high everywhere at once.
    expect(tierFor(maria.score, { ...DEFAULT_SETTINGS, highThreshold: 60 })).toBe('high')
  })
})
