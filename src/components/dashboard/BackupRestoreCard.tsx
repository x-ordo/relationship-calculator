/** @jsxImportSource preact */
import { useRef, useState } from 'preact/hooks'
import type { AppState as DomainState } from '../../shared/storage/state'
import type { AppEvent } from '../../state/events'
import { exportToJson, exportToCsv, importFromJson, downloadFile } from '../../shared/utils/backup'

type Props = {
  domain: DomainState
  dispatch: (e: AppEvent) => void
}

export function BackupRestoreCard({ domain, dispatch }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleExportJson = () => {
    const json = exportToJson(domain)
    const filename = `relationship-backup-${new Date().toISOString().slice(0, 10)}.json`
    downloadFile(json, filename, 'application/json')
    setStatus('success')
    setMessage('JSON 백업 완료')
    setTimeout(() => setStatus('idle'), 2000)
  }

  const handleExportCsv = () => {
    const csv = exportToCsv(domain)
    const filename = `relationship-entries-${new Date().toISOString().slice(0, 10)}.csv`
    downloadFile(csv, filename, 'text/csv')
    setStatus('success')
    setMessage('CSV 내보내기 완료')
    setTimeout(() => setStatus('idle'), 2000)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = importFromJson(text)
      if (!data) {
        setStatus('error')
        setMessage('잘못된 백업 파일 형식')
        return
      }

      dispatch({
        type: 'BACKUP_RESTORE',
        settings: data.settings,
        people: data.people,
        entries: data.entries,
      })
      setStatus('success')
      setMessage(`복원 완료: ${data.people.length}명, ${data.entries.length}개 기록`)
    } catch {
      setStatus('error')
      setMessage('파일 읽기 실패')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  return (
    <div class="card" style={{ marginTop: 14 }}>
      <div class="h2">데이터 백업/복원</div>
      <div class="hint">JSON으로 전체 백업하거나, CSV로 기록만 내보낼 수 있습니다.</div>

      <div class="row" style={{ marginTop: 12, gap: 8 }}>
        <button class="btn primary" onClick={handleExportJson}>JSON 백업</button>
        <button class="btn" onClick={handleExportCsv}>CSV 내보내기</button>
        <button class="btn" onClick={handleImportClick}>JSON 복원</button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      {status !== 'idle' && (
        <div class={`callout ${status === 'success' ? '' : 'danger'}`} style={{ marginTop: 10, padding: '8px 12px' }}>
          {message}
        </div>
      )}

      <div class="hint" style={{ marginTop: 10 }}>
        현재: {domain.people.length}명, {domain.entries.length}개 기록
      </div>
    </div>
  )
}
