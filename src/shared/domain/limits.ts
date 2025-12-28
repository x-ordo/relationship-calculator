/**
 * 플랜별 기능 제한
 * FREE → PLUS 전환을 유도하기 위한 제한 설정
 */

import type { LayoutId } from '../ui/shareCardLayouts'

export type PlanType = 'free' | 'plus' | 'pro'

export type PlanLimits = {
  maxPeople: number
  maxEntries: number
  /** 사용 가능한 공유 카드 레이아웃 ID 목록. 'all'이면 전체 */
  shareCardLayouts: LayoutId[] | 'all'
  /** 월간 AI 코치 사용 횟수. Infinity면 무제한 */
  aiCoachPerMonth: number
  /** PDF 다운로드 가능 여부 */
  pdfExport: boolean
  /** 월간 리포트 제공 여부 */
  monthlyReport: boolean
}

/** FREE 플랜에서 사용 가능한 공유 카드 레이아웃 (5종) */
export const FREE_LAYOUTS: LayoutId[] = [
  'L01_CLEAN',      // 기본 - Clean Report
  'L02_BRUTAL',     // 강렬 - Brutal Verdict
  'L06_RECEIPT',    // 영수증 - Receipt
  'L08_MINIMAL',    // 기본 - Minimal Calm
  'L07_POSTER',     // 강렬 - Poster
]

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    maxPeople: 3,
    maxEntries: 30,
    shareCardLayouts: FREE_LAYOUTS,
    aiCoachPerMonth: 0,
    pdfExport: false,
    monthlyReport: false,
  },
  plus: {
    maxPeople: 10,
    maxEntries: Infinity,
    shareCardLayouts: 'all',
    aiCoachPerMonth: 3,
    pdfExport: true,
    monthlyReport: true,
  },
  pro: {
    maxPeople: Infinity,
    maxEntries: Infinity,
    shareCardLayouts: 'all',
    aiCoachPerMonth: Infinity,
    pdfExport: true,
    monthlyReport: true,
  },
}

/** 현재 플랜의 제한 가져오기 */
export function getPlanLimits(plan: PlanType): PlanLimits {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free
}

/** 인원 추가 가능 여부 체크 */
export function canAddPerson(plan: PlanType, currentCount: number): {
  allowed: boolean
  limit: number
  remaining: number
} {
  const limits = getPlanLimits(plan)
  const remaining = Math.max(0, limits.maxPeople - currentCount)
  return {
    allowed: currentCount < limits.maxPeople,
    limit: limits.maxPeople,
    remaining,
  }
}

/** 기록 추가 가능 여부 체크 */
export function canAddEntry(plan: PlanType, currentCount: number): {
  allowed: boolean
  limit: number
  remaining: number
} {
  const limits = getPlanLimits(plan)
  const remaining = limits.maxEntries === Infinity
    ? Infinity
    : Math.max(0, limits.maxEntries - currentCount)
  return {
    allowed: currentCount < limits.maxEntries,
    limit: limits.maxEntries,
    remaining,
  }
}

/** 해당 레이아웃이 현재 플랜에서 사용 가능한지 체크 */
export function isLayoutAvailable(plan: PlanType, layoutId: LayoutId): boolean {
  const limits = getPlanLimits(plan)
  if (limits.shareCardLayouts === 'all') return true
  return limits.shareCardLayouts.includes(layoutId)
}

/** 사용 가능한 레이아웃 목록 가져오기 */
export function getAvailableLayouts(plan: PlanType): LayoutId[] | 'all' {
  return getPlanLimits(plan).shareCardLayouts
}
