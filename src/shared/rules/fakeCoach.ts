import type { Report } from '../domain/report'

export type CoachTone = '냉정' | '정중' | '유머'

/** B2B/B2C 분류 */
export type CoachContext = 'personal' | 'client'

export type CoachResult = {
  title: string
  /** 판결 요약 (1문장) */
  verdict: string
  /** 판결 이유 */
  reasoning: string
  /** 선고 문구 (복붙용) */
  sentences: { label: string; text: string }[]
  /** 이행 조항 */
  actions: string[]
  /** 판결 등급 */
  grade: 'GUILTY' | 'WARNING' | 'PROBATION' | 'INNOCENT'
  disclaimer: string
}

function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function determineGrade(loss: number, roiPct: number): CoachResult['grade'] {
  if (loss >= 100000 || roiPct <= -50) return 'GUILTY'
  if (loss >= 30000 || roiPct <= -20) return 'WARNING'
  if (loss > 0) return 'PROBATION'
  return 'INNOCENT'
}

const GRADE_LABELS = {
  GUILTY: '유죄 (즉시 손절)',
  WARNING: '경고 (비중 축소)',
  PROBATION: '집행유예 (관찰)',
  INNOCENT: '무죄 (유지)',
}

export function fakeCoach({ report, situation, tone, context = 'personal' }: {
  report: Report
  situation: string
  tone: CoachTone
  context?: CoachContext
}): CoachResult {
  const cause = report.topCauseLabel
  const loss = report.totals.netLossWon
  const person = report.topPersonLabel
  const grade = determineGrade(loss, report.totals.roiPct)
  const isClient = context === 'client'

  // 판결 요약
  const verdictPersonal = pickOne([
    `피고 ${person}은(는) 원고에게 총 ₩${loss.toLocaleString()}의 손해를 입혔으므로, "${GRADE_LABELS[grade]}" 판결을 선고한다.`,
    `본 건의 피고는 원고의 시간/멘탈 자원을 부당하게 소진하였으므로, ${GRADE_LABELS[grade]} 판정한다.`,
    `심리 결과, 해당 관계는 "투자 대비 손실" 상태로 확인됨. ${GRADE_LABELS[grade]}.`,
  ])

  const verdictClient = pickOne([
    `클라이언트 ${person}은(는) 프로젝트 수익성을 저해하여 총 ₩${loss.toLocaleString()} 손실을 야기하였으므로, "${GRADE_LABELS[grade]}" 판정한다.`,
    `해당 거래처는 ROI ${report.totals.roiPct}%로 수익성 기준 미달. ${GRADE_LABELS[grade]} 권고.`,
    `B2B 감사 결과: 해당 클라이언트는 비용 센터로 분류됨. ${GRADE_LABELS[grade]}.`,
  ])

  // 판결 이유
  const reasoningBase = isClient
    ? `본 클라이언트와의 거래에서 주요 손실 원인은 "${cause}"로 확인됨. 투입 시간 대비 수익률이 저조하며, 지속적인 추가 요청이 원가 상승을 초래함.`
    : `본 관계에서 주요 손실 원인은 "${cause}"로 확인됨. 원고의 시간/감정 자원이 일방적으로 소진되었으며, 상호성이 부재함.`

  const reasoningAdd = pickOne([
    '이는 명백한 자원 낭비이며, 즉각적인 시정 조치가 필요하다.',
    '계속 방치 시 손실이 누적될 것으로 예상된다.',
    '합리적인 경영/생활 판단으로는 수용 불가한 수준이다.',
    '관계 비용이 관계 혜택을 현저히 초과한 상태이다.',
  ])

  const t = tone

  // 선고 문구 (B2C)
  const sentencesPersonal = [
    {
      label: '손절 선언',
      text: t === '정중'
        ? '앞으로는 서로 부담되지 않는 선에서만 연락하면 좋겠습니다.'
        : t === '유머'
          ? '나 지금부터 "셀프 구조조정" 들어갑니다. 관계 포트폴리오에서 비중 축소요 😅'
          : '이 관계는 여기서 정리합니다. 더 이상의 시간/감정 투자는 없습니다.',
    },
    {
      label: '경계 설정',
      text: t === '정중'
        ? '제 사정상 이 범위를 넘는 부탁은 어렵습니다. 양해 부탁드립니다.'
        : t === '유머'
          ? '내 "도움 API" 호출 한도가 이번 달 초과됐어요. 다음 달 리셋되면 연락줘요.'
          : '선을 넘는 요청은 거절합니다. 예외 없습니다.',
    },
    {
      label: '거래 종료',
      text: t === '정중'
        ? '지금까지 감사했습니다. 앞으로는 각자의 길을 가는 게 좋겠습니다.'
        : t === '유머'
          ? '우리 관계 "서비스 종료" 안내드립니다. 그동안 이용해주셔서 감사했습니다 🙏'
          : '끝입니다. 연락하지 마세요.',
    },
  ]

  // 선고 문구 (B2B)
  const sentencesClient = [
    {
      label: '단가 인상 통보',
      text: t === '정중'
        ? '프로젝트 범위와 투입 시간을 고려하여, 다음 프로젝트부터 단가 조정이 필요합니다.'
        : t === '유머'
          ? '저희 서비스에 "프리미엄 요금제"가 신설되었습니다. 기존 고객 할인 적용해드릴게요 😇'
          : '현재 단가로는 수익성 확보가 불가합니다. 단가 인상 또는 거래 종료 중 선택해주세요.',
    },
    {
      label: '업무 범위 명시',
      text: t === '정중'
        ? '계약 범위 외 요청은 별도 견적이 필요합니다. 사전에 조율 부탁드립니다.'
        : t === '유머'
          ? '그건 "확장팩" 범위예요. 기본 패키지에 미포함입니다 📦'
          : '계약 외 업무는 추가 비용이 발생합니다. 무료 서비스가 아닙니다.',
    },
    {
      label: '거래 종료 통보',
      text: t === '정중'
        ? '내부 검토 결과, 해당 프로젝트는 더 이상 진행이 어렵습니다. 양해 부탁드립니다.'
        : t === '유머'
          ? '저희 회사 "블랙리스트 시스템" 업데이트로 해당 건은 처리가 어렵습니다 🚫'
          : '거래 종료합니다. 미수금 정산 후 연락 끊겠습니다.',
    },
  ]

  // 이행 조항
  const actionsPersonal = [
    '1) 해당 인물의 연락에 "즉답 금지" → 최소 30분 후 답변.',
    '2) 다음 요청 시 "이번엔 어렵다"로 첫 거절 연습.',
    '3) 2주간 접촉 빈도 50% 감소 시행.',
    '4) 손실이 반복되면 "음소거/차단"으로 전환.',
  ]

  const actionsClient = [
    '1) 다음 견적부터 최소 20% 할증 적용.',
    '2) 추가 요청은 모두 "별도 견적" 처리.',
    '3) 결제 조건을 선불 또는 착수금 50%로 변경.',
    '4) 3회 연속 손실 시 "거래처 블랙리스트" 등록.',
  ]

  return {
    title: `판결문 제${Date.now().toString().slice(-6)}호`,
    verdict: isClient ? verdictClient : verdictPersonal,
    reasoning: `${reasoningBase} ${reasoningAdd}`,
    sentences: isClient ? sentencesClient : sentencesPersonal,
    actions: isClient ? actionsClient : actionsPersonal,
    grade,
    disclaimer: '본 판결은 자기관리 보조 목적이며, 법적 효력이 없습니다. 무료 모드는 로컬 규칙 기반입니다.',
  }
}
