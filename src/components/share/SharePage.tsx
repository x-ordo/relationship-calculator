import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Card, Badge, Dialog, DialogSurface, DialogBody } from '@fluentui/react-components'
import type { AppState as DomainState } from '../../shared/storage/state'
import type { AppEvent } from '../../state/events'
import { buildReport, calcReceiptLines } from '../../shared/domain/report'
import { SHARE_CARD_COPY, renderTemplate } from '../../shared/copy/shareCardCopy'
import { SHARE_CARD_LAYOUTS, LAYOUT_CATEGORIES, type LayoutId, type LayoutCategory } from '../../shared/ui/shareCardLayouts'
import { exportShareCardPng } from '../../shared/utils/exportShareCard'
import { buildAliasMap, anonymizeName, anonymizeText } from '../../shared/utils/anonymize'
import { buildShareSafetyReport, formatFinding, SHARE_CHECKLIST } from '../../shared/privacy/shareSafety'
import { isLayoutAvailable, FREE_LAYOUTS } from '../../shared/domain/limits'
import { UpgradeModal } from '../upgrade/UpgradeModal'

export function SharePage({ domain, dispatch }: { domain: DomainState, dispatch: (e: AppEvent) => void }) {
  const report = useMemo(() => buildReport(domain), [domain])
  const [layoutId, setLayoutId] = useState<LayoutId>('L01_CLEAN')
  const [copyId, setCopyId] = useState('c1')
const [toneFilter, setToneFilter] = useState<'ALL' | '냉정' | '회복' | '유머'>('ALL')
  const [layoutCategoryFilter, setLayoutCategoryFilter] = useState<'ALL' | LayoutCategory>('ALL')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [exportMode, setExportMode] = useState<'download' | 'share'>('download')
  const [animKey, setAnimKey] = useState(0)
  const bumpAnim = () => setAnimKey((k) => k + 1)
  const [checked, setChecked] = useState<Record<string, boolean>>(() => Object.fromEntries(SHARE_CHECKLIST.map(i => [i.id, !i.must])))
  const [introOpen, setIntroOpen] = useState(() => !domain.settings.shareSafetyIntroSeen)
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)


  const filteredCopyList = useMemo(() => {
    if (toneFilter === 'ALL') return SHARE_CARD_COPY
    return SHARE_CARD_COPY.filter(c => c.tone === toneFilter)
  }, [toneFilter])

  const filteredLayoutList = useMemo(() => {
    if (layoutCategoryFilter === 'ALL') return SHARE_CARD_LAYOUTS
    return SHARE_CARD_LAYOUTS.filter(l => l.category === layoutCategoryFilter)
  }, [layoutCategoryFilter])

  useEffect(() => {
    if (!filteredCopyList.find(c => c.id === copyId)) {
      setCopyId(filteredCopyList[0]?.id ?? 'c1')
    }
  }, [toneFilter, filteredCopyList, copyId])

  useEffect(() => {
    if (!filteredLayoutList.find(l => l.id === layoutId)) {
      setLayoutId(filteredLayoutList[0]?.id ?? 'L01_CLEAN')
    }
  }, [layoutCategoryFilter, filteredLayoutList, layoutId])
  const layout = useMemo(() => SHARE_CARD_LAYOUTS.find(l => l.id === layoutId)!, [layoutId])
  const copy = useMemo(() => SHARE_CARD_COPY.find(c => c.id === copyId)!, [copyId])

  const aliasMap = useMemo(() => {
    const names = report.people.map(p => p.personName)
    return buildAliasMap(names)
  }, [report])

  const topPersonLabel = domain.settings.anonymizeOnShare
    ? anonymizeName(report.topPersonLabel, aliasMap)
    : report.topPersonLabel

  const vars = useMemo(() => {
    const hoursLost = Math.round((report.totals.minutes / 60) * 10) / 10
    const netLossWon = report.totals.netLossWon.toLocaleString()
    return {
      windowLabel: report.windowLabel,
      topCauseLabel: report.topCauseLabel,
      topPersonLabel,
      netLossWon,
      hoursLost,
      roiPct: report.totals.roiPct,
    }
  }, [report, topPersonLabel])

  const headline = useMemo(() => renderTemplate(copy.headline, vars), [copy, vars])
  const sub = useMemo(() => renderTemplate(copy.sub, vars), [copy, vars])
  const footer = useMemo(() => renderTemplate(copy.footer, vars), [copy, vars])

  // 영수증 레이아웃용 breakdown 라인
  const receiptLines = useMemo(() => {
    if (layout.category !== '영수증') return []
    return calcReceiptLines(report, domain.settings.hourlyRateWon)
  }, [layout.category, report, domain.settings.hourlyRateWon])

  const cardRef = useRef<HTMLDivElement>(null)

  const safety = useMemo(() => {
    const notes = domain.entries.slice(0, 50).map(e => e.note).filter(Boolean)
    const sources = [headline, sub, footer, report.topPersonLabel, ...notes]
    const src = domain.settings.anonymizeOnShare ? sources.map(s => anonymizeText(s, aliasMap)) : sources
    return buildShareSafetyReport(src)
  }, [headline, sub, footer, report.topPersonLabel, domain.entries, domain.settings.anonymizeOnShare, aliasMap])

  const canProceed = useMemo(() => {
    for (const item of SHARE_CHECKLIST) {
      if (item.must && !checked[item.id]) return false
    }
    return true
  }, [checked])

  const onExport = async (mode: 'download' | 'share') => {
    setExportMode(mode)
    setConfirmOpen(true)
  }

  const doExport = async () => {
    if (!cardRef.current) return
    await exportShareCardPng(cardRef.current, 'relationship-roi-story.png', { mode: exportMode })
    setConfirmOpen(false)
  }



  const randomizeCopy = (silent = false) => {
    const list = filteredCopyList
    if (!list.length) return
    if (list.length === 1) {
      setCopyId(list[0].id)
      if (!silent) bumpAnim()
      return
    }
    const currentIdx = list.findIndex(c => c.id === copyId)
    let next = list[Math.floor(Math.random() * list.length)].id
    if (next === copyId) {
      next = list[(currentIdx + 1) % list.length].id
    }
    setCopyId(next)
    if (!silent) bumpAnim()
  }

  const randomizeLayout = (silent = false) => {
    const list = filteredLayoutList
    if (!list.length) return
    if (list.length === 1) {
      setLayoutId(list[0].id)
      if (!silent) bumpAnim()
      return
    }
    const currentIdx = list.findIndex(l => l.id === layoutId)
    let next = list[Math.floor(Math.random() * list.length)].id
    if (next === layoutId) {
      next = list[(currentIdx + 1) % list.length].id
    }
    setLayoutId(next)
    if (!silent) bumpAnim()
  }

  const randomizeAll = () => {
    randomizeLayout(true)
    randomizeCopy(true)
    bumpAnim()
  }

  return (
    <div className="panel">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <div className="h1">공유</div>
          <div className="hint">인스타 스토리 1080×1920. 익명화 + PII 스캔 + 체크리스트로 사고 방지.</div>
        </div>
        <div className="row">
          <Badge>{domain.plan === 'pro' ? 'PRO' : domain.plan === 'plus' ? 'PLUS' : 'FREE'}</Badge>
        </div>
      </div>

      <Dialog open={introOpen} onOpenChange={(_, data) => !data.open && setIntroOpen(false)}>
        <DialogSurface className="modal" style={{ maxWidth: 480 }}>
          <DialogBody style={{ display: 'block' }}>
            <div className="h2">첫 방문 안전 안내</div>
            <div className="hint" style={{ marginTop: 4 }}>공유는 "한 번" 삐끗하면 끝. 여기서 기준을 박고 간다.</div>

            <div className="callout danger" style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 950 }}>필수 룰</div>
              <ul style={{ marginTop: 8, paddingLeft: 18, margin: 0 }}>
                <li className="hint" style={{ marginBottom: 4 }}>실명/회사명/학교/연락처/카톡ID/계좌 같은 식별정보는 절대 올리지 마.</li>
                <li className="hint" style={{ marginBottom: 4 }}>'상대 익명화(A/B/C)'는 기본 ON 추천.</li>
                <li className="hint">저장 버튼 누르면 체크리스트를 강제로 통과해야 저장됨.</li>
              </ul>
            </div>

            <div className="h2" style={{ marginTop: 14 }}>체크리스트(예시)</div>
            <div className="hint">아래 "필수"는 저장할 때도 다시 체크한다.</div>
            <div style={{ marginTop: 10 }}>
              {SHARE_CHECKLIST.slice(0, 6).map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div className={`pill ${item.must ? 'danger' : ''}`}>{item.must ? '필수' : '권장'}</div>
                  <div style={{ fontWeight: item.must ? 950 : 700 }}>{item.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 14 }}>
              <Button
                appearance="primary"
                onClick={() => {
                  setIntroOpen(false)
                  dispatch({ type: 'SETTINGS_PATCH', patch: { shareSafetyIntroSeen: true } })
                }}
              >
                확인했음
              </Button>
            </div>
          </DialogBody>
        </DialogSurface>
      </Dialog>


      <div className="grid cols-2" style={{ marginTop: 14 }}>
        <Card className="card">
          <div className="h2">설정</div>

          <div className="h3" style={{ marginTop: 10 }}>레이아웃</div>
          <div className="row" style={{ marginTop: 6, gap: 6, flexWrap: 'wrap' }}>
            <button className={`tab ${layoutCategoryFilter === 'ALL' ? 'active' : ''}`} onClick={() => setLayoutCategoryFilter('ALL')}>전체</button>
            {LAYOUT_CATEGORIES.map(c => (
              <button key={c.value} className={`tab ${layoutCategoryFilter === c.value ? 'active' : ''}`} onClick={() => setLayoutCategoryFilter(c.value)}>{c.label}</button>
            ))}
            <Badge>레이아웃 {filteredLayoutList.length}/{SHARE_CARD_LAYOUTS.length}</Badge>
          </div>

          <div className="h3" style={{ marginTop: 10 }}>카피 톤</div>
          <div className="row" style={{ marginTop: 6, gap: 6, flexWrap: 'wrap' }}>
            <button className={`tab ${toneFilter === 'ALL' ? 'active' : ''}`} onClick={() => setToneFilter('ALL')}>전체</button>
            <button className={`tab ${toneFilter === '냉정' ? 'active' : ''}`} onClick={() => setToneFilter('냉정')}>냉정</button>
            <button className={`tab ${toneFilter === '회복' ? 'active' : ''}`} onClick={() => setToneFilter('회복')}>회복</button>
            <button className={`tab ${toneFilter === '유머' ? 'active' : ''}`} onClick={() => setToneFilter('유머')}>유머</button>
            <Badge>카피 {filteredCopyList.length}/{SHARE_CARD_COPY.length}</Badge>
          </div>

          <div className="row" style={{ marginTop: 10, flexWrap: 'wrap', gap: 8 }}>
            <label className="pill">
              레이아웃
              <select
                value={layoutId}
                onChange={(e) => {
                  const newId = e.currentTarget.value as LayoutId
                  if (!isLayoutAvailable(domain.plan, newId)) {
                    setUpgradeModalOpen(true)
                    return
                  }
                  setLayoutId(newId)
                }}
              >
                {filteredLayoutList.map(l => {
                  const locked = !isLayoutAvailable(domain.plan, l.id)
                  return (
                    <option key={l.id} value={l.id}>
                      {locked ? '🔒 ' : ''}{l.category} · {l.name}
                    </option>
                  )
                })}
              </select>
            </label>

            <label className="pill">
              카피
              <select value={copyId} onChange={(e) => setCopyId(e.currentTarget.value)}>
                {filteredCopyList.map(c => {
                  const clean = c.headline.replace(/\{\{[^}]+\}\}/g, '').replace(/\s+/g, ' ').trim()
                  return <option key={c.id} value={c.id}>{c.tone} · {clean.slice(0, 22) || c.id}</option>
                })}
              </select>
            </label>
          </div>

          <div className="row" style={{ marginTop: 8, gap: 8 }}>
            <Button onClick={() => randomizeLayout()}>랜덤 레이아웃</Button>
            <Button onClick={() => randomizeCopy()}>랜덤 카피</Button>
            <Button onClick={randomizeAll}>랜덤 전체</Button>
          </div>

          <div className="row" style={{ marginTop: 10 }}>
            <label className="row" style={{ gap: 8 }}>
              <input
                type="checkbox"
                checked={domain.settings.anonymizeOnShare}
                onChange={(e) =>
                  dispatch({
                    type: 'SETTINGS_PATCH',
                    patch: { anonymizeOnShare: e.currentTarget.checked },
                  })
                }
              />
              <span style={{ fontWeight: 900 }}>상대 익명화(A/B/C)</span>
            </label>
          </div>

          <div className={`callout ${safety.level === 'DANGER' ? 'danger' : safety.level === 'WARN' ? '' : 'ok'}`} style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 900 }}>공유 위험도: {safety.level} (score {safety.score})</div>
            <div className="hint">{safety.summary}</div>
            {safety.findings.length > 0 && (
              <ul style={{ marginTop: 8, paddingLeft: 18 }}>
                {safety.findings.slice(0, 5).map((f, i) => <li key={i} className="hint">{formatFinding(f)}</li>)}
              </ul>
            )}
          </div>

          <div className="h2" style={{ marginTop: 14 }}>공유 문구</div>
          <div className="note" style={{ whiteSpace: 'pre-wrap' }}>{
            domain.settings.anonymizeOnShare
              ? anonymizeText(`${headline}\n${sub}\n— ${footer}`, aliasMap)
              : `${headline}\n${sub}\n— ${footer}`
          }</div>

          <div className="row" style={{ marginTop: 10 }}>
            <Button onClick={() => navigator.clipboard.writeText(domain.settings.anonymizeOnShare ? anonymizeText(`${headline}\n${sub}\n— ${footer}`, aliasMap) : `${headline}\n${sub}\n— ${footer}`)}>
              문구 복사
            </Button>
            <Button appearance="primary" onClick={() => onExport('download')}>스토리 PNG 저장</Button>
            <Button onClick={() => onExport('share')}>바로 공유(모바일)</Button>
          </div>

          <div className="hint" style={{ marginTop: 10 }}>
            "손해"를 공유하면 공감은 빨리 오지만, 식별정보 섞이면 지옥문 열린다. 체크리스트는 강제로.
          </div>
        </Card>

        <Card className="card">
          <div className="h2">미리보기 (1080×1920)</div>
          <div className="hint">브라우저 화면이 작아도 저장 PNG는 2배 해상도로 뽑힘.</div>

          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}>
            <div
              key={animKey}
              className="rr-pop"
              ref={cardRef}
              style={{
                width: 360,
                height: 640,
                borderRadius: layout.radius,
                border: `1px solid ${layout.border}`,
                background: layout.bg,
                color: layout.fg,
                overflow: 'hidden',
                position: 'relative',
                boxShadow: '0 20px 80px rgba(0,0,0,0.45)'
              }}
            >
              {layout.showGrid && (
                <div style={{ position: 'absolute', inset: 0, opacity: 0.08, backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
              )}

              <div style={{ padding: 22, position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 900, letterSpacing: '-0.3px' }}>Relationship ROI</div>
                  <div style={{ fontSize: 12, color: layout.sub }}>{domain.plan.toUpperCase()} · {report.windowLabel}</div>
                </div>

                <div style={{ marginTop: 18, fontSize: layout.hSize * 0.55, lineHeight: 1.12, fontWeight: 950 }}>
                  {domain.settings.anonymizeOnShare ? anonymizeText(headline, aliasMap) : headline}
                </div>

                <div style={{ marginTop: 10, fontSize: layout.subSize * 0.85, color: layout.sub, lineHeight: 1.35 }}>
                  {domain.settings.anonymizeOnShare ? anonymizeText(sub, aliasMap) : sub}
                </div>

                {layout.category === '영수증' && receiptLines.length > 0 ? (
                  <div style={{
                    marginTop: 14,
                    padding: '12px 14px',
                    borderRadius: 8,
                    border: `1px dashed ${layout.border}`,
                    background: 'rgba(255,255,255,0.02)',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    fontSize: 13,
                  }}>
                    <div style={{ fontSize: 11, color: layout.sub, marginBottom: 8, letterSpacing: '0.5px' }}>
                      ─────── 비용 명세 ───────
                    </div>
                    {receiptLines.map((line) => (
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '3px 0',
                        borderTop: line.isSubtotal || line.isTotal ? `1px dashed ${layout.border}` : 'none',
                        marginTop: line.isSubtotal || line.isTotal ? 6 : 0,
                        paddingTop: line.isSubtotal || line.isTotal ? 6 : 3,
                        fontWeight: line.isTotal ? 900 : 400,
                        fontSize: line.isTotal ? 15 : 13,
                        color: line.highlight ? layout.accent : layout.fg,
                      }}>
                        <span>{line.label}</span>
                        <span>{line.amount >= 0 ? '-' : '+'}₩{Math.abs(line.amount).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ) : layout.showBigNumber && (
                  <div style={{ marginTop: 18, padding: 14, borderRadius: 18, border: `1px solid ${layout.border}`, background: 'rgba(255,255,255,0.04)' }}>
                    <div style={{ fontSize: 12, color: layout.sub }}>총 손실</div>
                    <div style={{ fontSize: 34, fontWeight: 950, color: layout.brutal ? layout.accent : 'var(--danger)' }}>-₩{report.totals.netLossWon.toLocaleString()}</div>
                    <div className="row" style={{ justifyContent: 'space-between', marginTop: 8 }}>
                      <div style={{ fontSize: 12, color: layout.sub }}>원인 1위</div>
                      <div style={{ fontSize: 12, fontWeight: 900, color: layout.accent }}>{report.topCauseLabel}</div>
                    </div>
                  </div>
                )}

                {layout.showCauseChip && (
                  <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ padding: '8px 10px', borderRadius: 999, border: `1px solid ${layout.border}`, background: 'rgba(0,0,0,0.25)', fontSize: 12, color: layout.sub }}>
                      손해 1위: <span style={{ color: layout.fg, fontWeight: 900 }}>{topPersonLabel}</span>
                    </div>
                    <div style={{ padding: '8px 10px', borderRadius: 999, border: `1px solid ${layout.border}`, background: 'rgba(0,0,0,0.25)', fontSize: 12, color: layout.sub }}>
                      ROI: <span style={{ color: layout.fg, fontWeight: 900 }}>{report.totals.roiPct}%</span>
                    </div>
                  </div>
                )}

                <div style={{ flex: 1 }} />

                {layout.showStamp && (
                  <div style={{ position: 'absolute', right: 18, top: 120, transform: 'rotate(12deg)', border: `2px solid ${layout.accent}`, color: layout.accent, padding: '8px 12px', borderRadius: 16, fontWeight: 950, letterSpacing: '0.6px' }}>
                    CUT
                  </div>
                )}

                <div style={{ marginTop: 14, fontSize: layout.metaSize, color: layout.sub, lineHeight: 1.35 }}>
                  — {domain.settings.anonymizeOnShare ? anonymizeText(footer, aliasMap) : footer}
                </div>

                {layout.showFooterBrand && (
                  <div style={{ marginTop: 10, fontSize: 12, color: layout.sub, opacity: 0.9 }}>
                    "감정"을 "숫자"로 바꾸면, 선택이 쉬워진다.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="hint" style={{ marginTop: 12 }}>
            저장 PNG는 실제로 1080×1920 비율로 export됨. (미리보기는 축소)
          </div>
        </Card>
      </div>

      <Dialog open={confirmOpen} onOpenChange={(_, data) => !data.open && setConfirmOpen(false)}>
        <DialogSurface className="modal">
          <DialogBody>
            <div className="h2">공유 전 마지막 확인</div>
            <div className="hint">여기서 실수하면, 너만 손해 본다.</div>

            <div className="callout" style={{ marginTop: 10 }}>
              <div style={{ fontWeight: 900 }}>PII 스캔 결과: {safety.level} (score {safety.score})</div>
              {safety.findings.length > 0 && (
                <ul style={{ marginTop: 8, paddingLeft: 18 }}>
                  {safety.findings.slice(0, 8).map((f, i) => <li key={i} className="hint">{formatFinding(f)}</li>)}
                </ul>
              )}
            </div>

            <div style={{ marginTop: 14 }}>
              {SHARE_CHECKLIST.map(item => (
                <label key={item.id} className="row" style={{ gap: 10, marginBottom: 8 }}>
                  <input type="checkbox" checked={checked[item.id]} onChange={(e) => setChecked({ ...checked, [item.id]: e.currentTarget.checked })} />
                  <span style={{ fontWeight: item.must ? 950 : 700 }}>{item.label}{item.must ? ' (필수)' : ''}</span>
                </label>
              ))}
            </div>

            <div className="row" style={{ justifyContent: 'flex-end', marginTop: 14 }}>
              <Button onClick={() => setConfirmOpen(false)}>취소</Button>
              <Button appearance="primary" disabled={!canProceed} onClick={doExport}>저장 진행</Button>
            </div>

            {!canProceed && <div className="hint" style={{ marginTop: 10 }}>필수 항목 체크해야 저장 가능.</div>}
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* 업그레이드 모달 */}
      {upgradeModalOpen && (
        <UpgradeModal
          reason="layout_locked"
          onClose={() => setUpgradeModalOpen(false)}
          dispatch={dispatch}
        />
      )}
    </div>
  )
}
