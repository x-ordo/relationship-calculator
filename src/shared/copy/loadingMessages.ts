/**
 * 동적 로딩 메시지 - relationship-audit에서 흡수
 * 2초 간격으로 순환하며 표시
 */

export const LOADING_MESSAGES = [
  '관계 데이터 분석 중...',
  '손실 패턴 스캔 중...',
  '시간 비용 계산 중...',
  '상호성 지표 검증 중...',
  '감정세 산정 중...',
  '리포트 생성 중...',
  '최종 검토 중...',
  '거의 완료...'
]

export const COACH_LOADING_MESSAGES = [
  '상황 분석 중...',
  '판례 검토 중...',
  '심리 패턴 분석 중...',
  '최적 전략 수립 중...',
  '판결문 작성 중...',
  '이행 조항 정리 중...',
  '최종 검토 중...'
]

/**
 * 랜덤 메시지 선택
 */
export function getRandomMessage(messages: string[] = LOADING_MESSAGES): string {
  return messages[Math.floor(Math.random() * messages.length)]
}
