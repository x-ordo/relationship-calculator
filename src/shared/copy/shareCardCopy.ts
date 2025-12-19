export type ShareCardCopy = {
  id: string
  tone: '냉정' | '회복' | '유머'
  headline: string
  sub: string
  footer: string
}

export const SHARE_CARD_COPY: ShareCardCopy[] = [
  {
    id: 'c1',
    tone: '냉정',
    headline: '{{windowLabel}}: 손해가 난 사람',
    sub: '이번 달 내 시간/돈/멘탈을 가장 많이 태운 원인: {{topCauseLabel}}',
    footer: '내가 소중해지기 시작했다. 다음 달엔 더 깔끔하게.',
  },
  {
    id: 'c2',
    tone: '냉정',
    headline: '결론: {{topCauseLabel}}는 이제 컷',
    sub: '손실: -₩{{netLossWon}} · 시간: -{{hoursLost}}h · 반복되면 관계가 아니라 소비다.',
    footer: '손절이 아니라, 손해를 멈추는 것.',
  },
  {
    id: 'c3',
    tone: '회복',
    headline: '{{windowLabel}}: 내 편부터 챙기기',
    sub: '손실이 보이면 방향 전환이 가능하다. 1순위 원인: {{topCauseLabel}}',
    footer: '조용히 정리하면 된다. 나는 나를 지킨다.',
  },
  {
    id: 'c4',
    tone: '유머',
    headline: '이번 달 인간관계 결산 완료 ✅',
    sub: '가장 큰 지출: {{topCauseLabel}} · 내 통장은 괜찮은데 멘탈이 탈탈 털림.',
    footer: '다음 달은 “필터링 업데이트” 적용 예정.',
  },

  // --- More options for better shareability ---
  {
    id: 'c5',
    tone: '냉정',
    headline: '정리: {{topPersonLabel}}는 비용센터',
    sub: '이번 달 손실 -₩{{netLossWon}}. 원인 1위는 {{topCauseLabel}}. 반복되면 관계가 아니라 지출이다.',
    footer: '감정이 아니라 숫자로 끊는다.',
  },
  {
    id: 'c6',
    tone: '냉정',
    headline: '나 오늘부터 “무료 제공” 종료',
    sub: '시간 -{{hoursLost}}h · 손실 -₩{{netLossWon}}. {{topCauseLabel}} 한 번 더 터지면 바로 컷.',
    footer: '착한 사람이 아니라, 그냥 호구였던 거다.',
  },
  {
    id: 'c7',
    tone: '회복',
    headline: '내가 과한 게 아니라, 기준이 없던 거',
    sub: '이번 달 내 손해의 핵심은 {{topCauseLabel}}. 이제부터 기준을 문장으로 박아둔다.',
    footer: '기준이 생기면 스트레스가 줄어든다.',
  },
  {
    id: 'c8',
    tone: '회복',
    headline: '관계 정리는 “사라지는 것”이 아니라 “돌려받는 것”',
    sub: '손실 -₩{{netLossWon}} · 시간 -{{hoursLost}}h. 내 삶으로 회수한다. 우선 {{topCauseLabel}}부터.',
    footer: '나는 내 편이다.',
  },
  {
    id: 'c9',
    tone: '유머',
    headline: '관계도 재무제표가 필요함 😇',
    sub: '이번 달 결산: -₩{{netLossWon}} · -{{hoursLost}}h. 내 지갑은 안 털렸는데 내 멘탈이 털림.',
    footer: '다음 달은 예산 삭감 들어갑니다.',
  },
  {
    id: 'c10',
    tone: '유머',
    headline: '내 멘탈에 “감정세”가 붙는 관계',
    sub: '원인 1위: {{topCauseLabel}}. 손실 -₩{{netLossWon}}. 이제 세금 감면(거리두기) 갑니다.',
    footer: '상대는 그대로, 내가 달라진다.',
  },
  {
    id: 'c11',
    tone: '냉정',
    headline: '회피는 무료가 아니다',
    sub: '안 끊어서 생긴 비용: -₩{{netLossWon}} · -{{hoursLost}}h. {{topCauseLabel}}는 “방치 비용”으로 굳는다.',
    footer: '결정 안 하면, 상황이 결정한다.',
  },
  {
    id: 'c12',
    tone: '회복',
    headline: '{{windowLabel}}: 다음 액션 1개만',
    sub: '핵심은 {{topCauseLabel}}. 이번 주엔 "한 문장"으로 막고, 다음 주엔 더 편해진다.',
    footer: '정리하면 살아난다.',
  },

  // --- Extended copy set for better variety ---
  {
    id: 'c13',
    tone: '냉정',
    headline: '{{windowLabel}} 감정 회계 마감',
    sub: '수지 타산이 안 맞는 관계는 정리 대상이다. 1순위: {{topCauseLabel}}',
    footer: '회계는 거짓말을 안 한다.',
  },
  {
    id: 'c14',
    tone: '냉정',
    headline: '적자 관계 청산 리스트',
    sub: '손실 -₩{{netLossWon}} · 원인: {{topCauseLabel}}. 반복되면 더 이상 관계가 아니다.',
    footer: '청산은 배신이 아니라 선택이다.',
  },
  {
    id: 'c15',
    tone: '냉정',
    headline: '"좋은 사람"이라는 빚',
    sub: '{{topCauseLabel}}에 쓴 비용 -₩{{netLossWon}}. 좋은 사람 노릇에도 한도가 있다.',
    footer: '빚을 갚을 필요 없다. 더 이상 빌려주지 않으면 된다.',
  },
  {
    id: 'c16',
    tone: '냉정',
    headline: '{{windowLabel}}: 손절 타이밍',
    sub: '누적 손실 -₩{{netLossWon}} · -{{hoursLost}}h. {{topCauseLabel}}는 지금이 마지막 기회.',
    footer: '타이밍을 놓치면 비용이 된다.',
  },
  {
    id: 'c17',
    tone: '회복',
    headline: '내 에너지는 유한하다',
    sub: '{{topCauseLabel}}에 쓴 시간 -{{hoursLost}}h. 앞으로는 나를 위해 쓴다.',
    footer: '에너지 관리는 자기 방어다.',
  },
  {
    id: 'c18',
    tone: '회복',
    headline: '정리는 끝이 아니라 시작',
    sub: '{{topCauseLabel}} 정리하면 -₩{{netLossWon}}이 0원으로 바뀐다.',
    footer: '손해가 멈추는 순간, 회복이 시작된다.',
  },
  {
    id: 'c19',
    tone: '회복',
    headline: '{{windowLabel}}: 내 기준을 세우는 달',
    sub: '손실 원인 1위 {{topCauseLabel}}. 이번 달엔 "안 돼"를 연습한다.',
    footer: '기준이 생기면 관계가 편해진다.',
  },
  {
    id: 'c20',
    tone: '회복',
    headline: '나는 누군가의 보험이 아니다',
    sub: '{{topCauseLabel}}에게 쓴 비용 -₩{{netLossWon}}. 나도 내 편이 필요하다.',
    footer: '나를 지키는 건 이기적인 게 아니다.',
  },
  {
    id: 'c21',
    tone: '유머',
    headline: '{{windowLabel}} 멘탈 손익계산서',
    sub: '수익: 0원 · 손실: -₩{{netLossWon}}. {{topCauseLabel}} 주식은 이제 팔 때가 됐다.',
    footer: '손절은 타이밍이 생명.',
  },
  {
    id: 'c22',
    tone: '유머',
    headline: '관계에도 "무료 체험" 끝',
    sub: '무료 제공: -{{hoursLost}}h · -₩{{netLossWon}}. {{topCauseLabel}} 구독 해지합니다.',
    footer: '프리미엄 서비스는 유료입니다.',
  },
  {
    id: 'c23',
    tone: '유머',
    headline: '{{topCauseLabel}}와의 거래 종료',
    sub: '투자 대비 수익률: 마이너스. 이번 달 손실 -₩{{netLossWon}}. 포트폴리오에서 제외.',
    footer: '감정도 분산 투자가 필요하다.',
  },
  {
    id: 'c24',
    tone: '유머',
    headline: '{{windowLabel}} 인간관계 KPI 리포트',
    sub: '핵심 지표: {{topCauseLabel}} → 적자 전환. 구조조정 들어갑니다.',
    footer: '성과 없는 관계는 리밸런싱.',
  },
  {
    id: 'c25',
    tone: '냉정',
    headline: '{{windowLabel}}: 계산 끝',
    sub: '시간 -{{hoursLost}}h · 돈 -₩{{netLossWon}} · 원인: {{topCauseLabel}}. 더 계산할 것 없다.',
    footer: '숫자는 감정보다 정확하다.',
  },
  {
    id: 'c26',
    tone: '냉정',
    headline: '관계 적자 보고서',
    sub: '적자 원인: {{topCauseLabel}} · 누적 손실 -₩{{netLossWon}}. 더 이상의 투자는 낭비다.',
    footer: '투자는 회수가 가능할 때만.',
  },
  {
    id: 'c27',
    tone: '회복',
    headline: '내가 먼저 챙기는 {{windowLabel}}',
    sub: '{{topCauseLabel}}에 빼앗긴 -{{hoursLost}}h. 앞으로 그 시간은 나에게 쓴다.',
    footer: '나를 챙기는 건 당연한 일이다.',
  },
  {
    id: 'c28',
    tone: '회복',
    headline: '관계도 정리가 필요하다',
    sub: '{{topCauseLabel}}와의 정리가 끝나면, 내 시간이 돌아온다.',
    footer: '정리 후의 여백이 진짜 자유다.',
  },
  {
    id: 'c29',
    tone: '유머',
    headline: '{{windowLabel}} 에너지 사용 보고서',
    sub: '최다 소비처: {{topCauseLabel}}. 에너지 효율 F등급. 절전 모드 돌입.',
    footer: '에너지 절약은 환경 보호.',
  },
  {
    id: 'c30',
    tone: '유머',
    headline: '나: "{{topCauseLabel}}님, 구독 해지요"',
    sub: '이번 달 청구서: -₩{{netLossWon}} · -{{hoursLost}}h. 자동 결제 해제 완료.',
    footer: '해지 수수료는 없습니다.',
  },
]

export function renderTemplate(tpl: string, vars: Record<string, any>): string {
  return tpl.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, k) => {
    const v = vars?.[k]
    if (v === null || v === undefined) return ''
    return String(v)
  })
}
