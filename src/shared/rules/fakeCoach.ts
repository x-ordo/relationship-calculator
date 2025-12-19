import type { Report } from '../domain/report'

export type CoachTone = '냉정' | '정중' | '유머'

export type CoachResult = {
  title: string
  diagnosis: string
  scripts: { title: string, text: string }[]
  next: string[]
  disclaimer: string
}

function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function fakeCoach({ report, situation, tone }: { report: Report, situation: string, tone: CoachTone }): CoachResult {
  const cause = report.topCauseLabel
  const loss = report.totals.netLossWon

  const baseDiagnosis = (
    loss > 0
      ? `손실이 숫자로 찍혔으면 그 관계는 이미 “감정”이 아니라 “비용”이다. 원인 1위는 ${cause}.`
      : `이번 달은 큰 손실이 없다. 다만 원인 1위는 ${cause}. 방심하면 다음 달에 뒤통수 맞는다.`
  )

  const diagAdd = pickOne([
    '계속 참고 있으면, 상대는 그걸 “허용”으로 해석한다.',
    '상호성 없는 친절은 그냥 공짜 노동이다.',
    '네가 바쁜 건 핑계가 아니라 사실이다. 우선순위를 네가 정해.',
    '경계가 없는 사람은 결국 “쓰는 사람”을 만나게 된다.',
  ])

  const t = tone

  const script1 = t === '정중'
    ? '지금 일정이 빡빡해서, 이번 건은 어렵습니다. 필요하면 다음 주에 다시 이야기해요.'
    : t === '유머'
      ? '이번 달 예산이 이미 터져서요. 다음 달에 할인 들어오면 연락드릴게요 😅'
      : '이번 건은 못합니다. 더는 내 시간/멘탈을 여기 쓰지 않겠습니다.'

  const script2 = t === '정중'
    ? '서로 편하게 하려면, 요청 범위를 정해두면 좋겠습니다. 이 선을 넘는 건 어렵습니다.'
    : t === '유머'
      ? '나 지금 ‘경계선 업데이트’ 중이라, 그 요청은 패치 대상이에요. 미안 😄'
      : '요청 범위가 과합니다. 다음부터는 선을 지켜주세요.'

  const script3 = t === '정중'
    ? '지금은 제가 도와드리기 어렵고, 다른 방법을 추천드릴게요.'
    : t === '유머'
      ? '그건 제 직무 범위가 아니고요…(웃음) 다른 루트가 빠를 듯요.'
      : '그건 당신 일이에요. 제 몫으로 넘기지 마세요.'

  return {
    title: `코치 결과 · 원인: ${cause}`,
    diagnosis: `${baseDiagnosis} ${diagAdd}`,
    scripts: [
      { title: '단호한 거절', text: script1 },
      { title: '경계선 공지', text: script2 },
      { title: '대안 제시', text: script3 },
    ],
    next: [
      '1) 다음 요청이 오면 “즉답 금지” → 10분 뒤 답장.',
      '2) 요청/시간/비용을 한 줄로 숫자화해서 기록.',
      '3) 상호성 낮은 상대는 “도움 → 정보만 전달”로 다운그레이드.',
      '4) 경계침해가 반복되면: 대화 빈도 자체를 낮춰라.',
    ],
    disclaimer: '무료 모드는 로컬 규칙 기반(진짜 AI 호출 없음). 유료 모드는 서버에서 LLM 연결하는 구조로 확장 가능.',
  }
}
