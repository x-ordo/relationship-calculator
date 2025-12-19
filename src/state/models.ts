export type PersonId = string
export type EntryId = string

export type Person = {
  id: PersonId
  label: string // share/coach에서는 기본적으로 A/B/C로 보이게
  createdAt: number
}

export type Entry = {
  id: EntryId
  personId: PersonId
  createdAt: number

  minutes: number
  moneyWon: number
  moodDelta: -2 | -1 | 0 | 1 | 2
  reciprocity: 0 | 1 | 2 | 3
  boundaryHits: 0 | 1 | 2 | 3
  note?: string
}

export type Plan = 'free' | 'paid'

export type ReportTotals = {
  netLossWon: number
  hoursLost: number
  timeValueWon: number
}

export type PersonAggregate = {
  personId: PersonId
  label: string
  netWon: number
  benefitWon: number
  hours: number
  roiPct: number
  boundaryHits: number
  reciprocityScoreAvg: number
}

export type Report = {
  totals: ReportTotals
  people: PersonAggregate[]
  topCauseLabel: string
  topPersonLabel: string
}
