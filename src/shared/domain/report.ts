import type { AppState, Entry, Person } from '../storage/state'

export type CauseKey = 'BOUNDARY' | 'TIME' | 'MONEY' | 'MOOD' | 'RECIPROCITY'

export type PersonAggregate = {
  personId: string
  personName: string
  entries: number
  minutes: number
  moneyWon: number
  costWon: number
  benefitWon: number
  netWon: number
  netLossWon: number
  roiPct: number
  avgReciprocity: number
  avgMoodDelta: number
  boundaryHits: number
  topCause: CauseKey
}

export type Report = {
  windowLabel: string
  timeValuePerHourWon: number
  totals: {
    entries: number
    minutes: number
    moneyWon: number
    costWon: number
    benefitWon: number
    netWon: number
    netLossWon: number
    roiPct: number
  }
  people: PersonAggregate[]
  topCauseLabel: string
  topPersonLabel: string
}

export type ReportRange = {
  /** YYYY-MM-DD */
  start: string
  /** YYYY-MM-DD */
  end: string
  /** e.g. '지난 7일' */
  label: string
}

function calcEntryCost(e: Entry, timeValuePerHourWon: number) {
  const timeCost = (e.minutes / 60) * timeValuePerHourWon
  const boundaryPenalty = e.boundaryHit ? 15000 : 0
  // moodDelta < 0이면 멘탈 비용. 절대값이 클수록 비용 증가.
  const moodPenalty = e.moodDelta < 0 ? Math.abs(e.moodDelta) * 12000 : 0
  // reciprocity 낮으면 비용(기대 대비 박탈)
  const reciprocityPenalty = e.reciprocity <= 2 ? (3 - e.reciprocity) * 7000 : 0
  return {
    timeCost,
    boundaryPenalty,
    moodPenalty,
    reciprocityPenalty,
    costWon: Math.round(e.moneyWon + timeCost + boundaryPenalty + moodPenalty + reciprocityPenalty),
  }
}

function calcEntryBenefit(e: Entry) {
  // moodDelta > 0이면 benefit
  const moodBenefit = e.moodDelta > 0 ? e.moodDelta * 10000 : 0
  // reciprocity 높으면 benefit
  const reciprocityBenefit = e.reciprocity >= 4 ? (e.reciprocity - 3) * 6000 : 0
  const benefitWon = Math.round(moodBenefit + reciprocityBenefit)
  return { moodBenefit, reciprocityBenefit, benefitWon }
}

function pickTopCause(a: Omit<PersonAggregate, 'topCause' | 'topCauseLabel'>): CauseKey {
  // 간단 휴리스틱: 가장 강한 리스크를 원인으로
  if (a.boundaryHits >= Math.max(1, Math.floor(a.entries * 0.3))) return 'BOUNDARY'
  if (a.avgReciprocity <= 2.2) return 'RECIPROCITY'
  if (a.avgMoodDelta <= -0.6) return 'MOOD'
  // 돈/시간 중 큰 쪽
  const moneyShare = a.moneyWon / Math.max(1, a.costWon)
  if (moneyShare >= 0.35) return 'MONEY'
  return 'TIME'
}

export function causeLabel(k: CauseKey): string {
  switch (k) {
    case 'BOUNDARY': return '추가 비용 발생'
    case 'TIME': return '인건비 초과'
    case 'MONEY': return '직접 지출'
    case 'MOOD': return '감정세 부과'
    case 'RECIPROCITY': return '투자 효율 저하'
  }
}

export type ReportFilter = {
  month?: string
  range?: ReportRange
  personId?: string
  cause?: CauseKey
}

export function buildReport(state: AppState, opts?: ReportFilter):
  Report {
  const month = opts?.month // 'YYYY-MM'
  const range = opts?.range
  const personIdFilter = opts?.personId
  const causeFilter = opts?.cause
  const timeValue = state.settings.timeValuePerHourWon

  const peopleMap = new Map<string, Person>()
  for (const p of state.people) peopleMap.set(p.id, p)

  const entries = state.entries.filter(e => {
    // 날짜 필터
    if (range && (e.date < range.start || e.date > range.end)) return false
    if (month && !e.date.startsWith(month)) return false
    // 사람 필터
    if (personIdFilter && e.personId !== personIdFilter) return false
    return true
  })

  const agg = new Map<string, {
    entries: number
    minutes: number
    moneyWon: number
    costWon: number
    benefitWon: number
    boundaryHits: number
    sumReciprocity: number
    sumMoodDelta: number
  }>()

  for (const e of entries) {
    const c = calcEntryCost(e, timeValue)
    const b = calcEntryBenefit(e)
    const a = agg.get(e.personId) || {
      entries: 0,
      minutes: 0,
      moneyWon: 0,
      costWon: 0,
      benefitWon: 0,
      boundaryHits: 0,
      sumReciprocity: 0,
      sumMoodDelta: 0,
    }
    a.entries += 1
    a.minutes += e.minutes
    a.moneyWon += e.moneyWon
    a.costWon += c.costWon
    a.benefitWon += b.benefitWon
    if (e.boundaryHit) a.boundaryHits += 1
    a.sumReciprocity += e.reciprocity
    a.sumMoodDelta += e.moodDelta
    agg.set(e.personId, a)
  }

  const people: PersonAggregate[] = [...agg.entries()].map(([personId, a]) => {
    const p = peopleMap.get(personId)
    const netWon = Math.round(a.benefitWon - a.costWon)
    const netLossWon = Math.max(0, -netWon)
    const roiPct = a.costWon > 0 ? Math.round((netWon / a.costWon) * 100) : 0
    const avgReciprocity = a.entries ? a.sumReciprocity / a.entries : 0
    const avgMoodDelta = a.entries ? a.sumMoodDelta / a.entries : 0

    const base = {
      personId,
      personName: p?.name || '(unknown)',
      entries: a.entries,
      minutes: Math.round(a.minutes),
      moneyWon: Math.round(a.moneyWon),
      costWon: Math.round(a.costWon),
      benefitWon: Math.round(a.benefitWon),
      netWon,
      netLossWon,
      roiPct,
      avgReciprocity: Math.round(avgReciprocity * 10) / 10,
      avgMoodDelta: Math.round(avgMoodDelta * 10) / 10,
      boundaryHits: a.boundaryHits,
    }

    const topCause = pickTopCause(base)

    return {
      ...base,
      topCause,
    }
  })

  // 원인별 필터
  const filteredPeople = causeFilter
    ? people.filter(p => p.topCause === causeFilter)
    : people

  // "손해 큰 순"으로 정렬
  filteredPeople.sort((x, y) => y.netLossWon - x.netLossWon)

  const totals = filteredPeople.reduce(
    (t, p) => {
      t.entries += p.entries
      t.minutes += p.minutes
      t.moneyWon += p.moneyWon
      t.costWon += p.costWon
      t.benefitWon += p.benefitWon
      t.netWon += p.netWon
      t.netLossWon += p.netLossWon
      return t
    },
    { entries: 0, minutes: 0, moneyWon: 0, costWon: 0, benefitWon: 0, netWon: 0, netLossWon: 0 }
  )

  const roiPct = totals.costWon > 0 ? Math.round((totals.netWon / totals.costWon) * 100) : 0

  // top cause overall: 가장 많이 등장한 topCause
  const causeCount = new Map<CauseKey, number>()
  for (const p of filteredPeople) causeCount.set(p.topCause, (causeCount.get(p.topCause) || 0) + 1)
  let topCause: CauseKey = 'TIME'
  let topCauseN = -1
  for (const [k, n] of causeCount.entries()) {
    if (n > topCauseN) {
      topCauseN = n
      topCause = k
    }
  }

  const topPersonLabel = filteredPeople[0]?.personName || '—'

  return {
    windowLabel: range ? range.label : (month ? `${month} 결산` : '전체 결산'),
    timeValuePerHourWon: timeValue,
    totals: { ...totals, roiPct },
    people: filteredPeople,
    topCauseLabel: causeLabel(topCause),
    topPersonLabel,
  }
}
