/** @jsxImportSource preact */
import { useMemo } from 'preact/hooks'
import type { AppState as DomainState } from '../../shared/storage/state'
import { buildReport, calcReceiptLines } from '../../shared/domain/report'

type Props = {
  domain: DomainState
  /** 특정 인물만 보여주기 */
  personId?: string
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

function formatDate(d: Date) {
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function formatTime() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

const VIRAL_FOOTERS = [
  '이 영수증은 감정 결제 내역입니다.',
  '호구 인증서가 필요하신가요?',
  '다음 달엔 손절이 최선입니다.',
  '인생 구조조정의 시작.',
  '관계 적자, 더 이상은 NO.',
  '감정 결산 완료. 정리 시작.',
]

export function ReceiptCard({ domain, personId }: Props) {
  const { report, dateRange, receiptNo } = useMemo(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 6)

    const weekRange = { start: isoDate(start), end: isoDate(end), label: '지난 7일' }
    const r = buildReport(domain, { range: weekRange })

    // 특정 인물 필터
    const filtered = personId
      ? { ...r, people: r.people.filter(p => p.personId === personId) }
      : r

    return {
      report: filtered,
      dateRange: `${formatDate(start)} ~ ${formatDate(end)}`,
      receiptNo: `R${Date.now().toString(36).toUpperCase().slice(-6)}`,
    }
  }, [domain, personId])

  const hourlyRate = domain.settings.hourlyRateWon
  const lines = calcReceiptLines(report, hourlyRate)
  const hasData = report.totals.entries > 0
  const viralFooter = VIRAL_FOOTERS[Math.floor(Math.random() * VIRAL_FOOTERS.length)]

  const totalMinutes = report.totals.minutes
  const hours = Math.floor(totalMinutes / 60)
  const mins = Math.round(totalMinutes % 60)

  return (
    <div class="receipt-card">
      {/* 영수증 헤더 */}
      <div class="receipt-header">
        <div class="receipt-store">관계 감사 리포트</div>
        <div class="receipt-subtitle">Relationship Audit</div>
      </div>

      <div class="receipt-divider dashed" />

      {/* 메타 정보 */}
      <div class="receipt-meta">
        <div class="receipt-row">
          <span>영수증 번호</span>
          <span>{receiptNo}</span>
        </div>
        <div class="receipt-row">
          <span>기간</span>
          <span>{dateRange}</span>
        </div>
        <div class="receipt-row">
          <span>발행일시</span>
          <span>{formatDate(new Date())} {formatTime()}</span>
        </div>
        <div class="receipt-row">
          <span>기록 건수</span>
          <span>{report.totals.entries}건</span>
        </div>
        <div class="receipt-row">
          <span>총 시간</span>
          <span>{hours}시간 {mins}분</span>
        </div>
      </div>

      <div class="receipt-divider solid" />

      {!hasData ? (
        <div class="receipt-empty">
          <div class="receipt-empty-title">기록 없음</div>
          <div class="receipt-empty-hint">이번 주 기록이 없습니다.</div>
          <div class="receipt-empty-hint">오늘 10초 기록 1건만 남겨보세요.</div>
        </div>
      ) : (
        <>
          {/* 비용 항목 */}
          <div class="receipt-items">
            <div class="receipt-row header">
              <span>항목</span>
              <span>금액</span>
            </div>
            {lines.map((line, i) => (
              <div
                key={i}
                class={`receipt-row ${line.isSubtotal ? 'subtotal' : ''} ${line.isTotal ? 'total' : ''} ${line.highlight ? 'highlight' : ''}`}
              >
                <span>{line.label}</span>
                <span>{line.amount < 0 ? '' : '-'}₩{Math.abs(line.amount).toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div class="receipt-divider dashed" />

          {/* 손해 원인 */}
          <div class="receipt-cause">
            <div class="receipt-row">
              <span>손해 1위</span>
              <span class="accent">{report.topPersonLabel}</span>
            </div>
            <div class="receipt-row">
              <span>주요 원인</span>
              <span class="accent">{report.topCauseLabel}</span>
            </div>
          </div>

          <div class="receipt-divider solid" />

          {/* 바이럴 푸터 */}
          <div class="receipt-footer">
            <div class="receipt-verdict">{viralFooter}</div>
            <div class="receipt-brand">relationship-audit.app</div>
          </div>

          {/* 영수증 하단 패턴 */}
          <div class="receipt-tear" />
        </>
      )}
    </div>
  )
}
