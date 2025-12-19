import type { CoachTone, CoachResult } from '../rules/fakeCoach'
import type { Report } from '../domain/report'

export type CoachPayload = {
  tone: CoachTone
  situation: string
  report: {
    windowLabel: string
    totals: {
      minutes: number
      moneyWon: number
      costWon: number
      benefitWon: number
      netLossWon: number
      roiPct: number
    }
    topCauseLabel: string
    topPersonLabel: string
  }
}

export type CoachApiError = {
  status: number
  message: string
}

export function toCoachPayload(args: { report: Report; situation: string; tone: CoachTone }): CoachPayload {
  const { report, situation, tone } = args
  // 개인정보/식별정보를 서버에 보내지 않는다.
  // notes, raw names list, raw entries는 제외.
  return {
    tone,
    situation,
    report: {
      windowLabel: report.windowLabel,
      totals: {
        minutes: report.totals.minutes,
        moneyWon: report.totals.moneyWon,
        costWon: report.totals.costWon,
        benefitWon: report.totals.benefitWon,
        netLossWon: report.totals.netLossWon,
        roiPct: report.totals.roiPct,
      },
      topCauseLabel: report.topCauseLabel,
      topPersonLabel: report.topPersonLabel,
    },
  }
}

export async function callPaidCoach(payload: CoachPayload, token: string): Promise<CoachResult> {
  const res = await fetch('/api/ai/coach', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`
    try {
      const j = await res.json()
      msg = j?.error || j?.message || msg
    } catch {
      // ignore
    }
    const err: CoachApiError = { status: res.status, message: msg }
    throw err
  }

  const data = await res.json()
  // 최소한의 런타임 검증
  if (!data?.title || !data?.diagnosis || !Array.isArray(data?.scripts) || !Array.isArray(data?.next)) {
    throw { status: 500, message: 'Invalid response shape' } satisfies CoachApiError
  }

  return {
    title: String(data.title),
    diagnosis: String(data.diagnosis),
    scripts: data.scripts.map((s: any) => ({ title: String(s.title), text: String(s.text) })),
    next: data.next.map((n: any) => String(n)),
    disclaimer: String(data.disclaimer || ''),
  }
}
