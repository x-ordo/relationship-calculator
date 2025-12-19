import { toBlob as htmlToBlob, toPng } from 'html-to-image'
import html2canvas from 'html2canvas'

export type ExportMode = 'auto' | 'download' | 'share'

// 시스템 폰트 스택 (export 시 명시적으로 사용)
const SYSTEM_FONT_STACK = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Apple SD Gothic Neo", "Noto Sans KR", "Helvetica Neue", Arial, sans-serif'

function isIOS() {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
}

/**
 * 저사양 기기 감지
 */
function isLowEndDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  const deviceMemory = (navigator as any).deviceMemory
  const cores = navigator.hardwareConcurrency
  // 4GB 미만 메모리 또는 4코어 미만
  return (deviceMemory && deviceMemory < 4) || (cores && cores < 4)
}

/**
 * 최적의 pixelRatio 계산 (OOM 방지)
 */
function getOptimalPixelRatio(): number {
  if (isIOS() || isLowEndDevice()) return 1.5
  return 2
}

/**
 * Web Share API로 PNG 파일 공유 가능 여부 확인
 * PNG 타입으로 정확히 테스트
 */
function canWebShareFile() {
  const nav: any = navigator as any
  if (!nav?.share) return false
  if (!nav?.canShare) return false
  try {
    // PNG 타입으로 정확히 테스트
    const testBlob = new Blob([new Uint8Array(8)], { type: 'image/png' })
    const testFile = new File([testBlob], 'test.png', { type: 'image/png' })
    return nav.canShare({ files: [testFile] })
  } catch {
    return false
  }
}

async function blobFromHtmlToImage(el: HTMLElement, backgroundColor = '#0B0F19'): Promise<Blob | null> {
  // Safari/iOS에서 foreignObject 문제가 종종 터진다.
  // 일단 시도하고, 실패하면 html2canvas로 폴백.
  try {
    const pixelRatio = getOptimalPixelRatio()
    const blob = await htmlToBlob(el, {
      cacheBust: true,
      pixelRatio,
      backgroundColor,
      // 폰트 인라인 스타일 강제
      style: {
        fontFamily: SYSTEM_FONT_STACK,
      },
      skipFonts: false,
    })
    return blob
  } catch {
    return null
  }
}

async function blobFromHtml2Canvas(el: HTMLElement, backgroundColor = '#0B0F19'): Promise<Blob> {
  const scale = getOptimalPixelRatio()
  const canvas = await html2canvas(el, {
    backgroundColor,
    scale,
    useCORS: true,
    allowTaint: false, // CORS 안전 모드 (tainted canvas 방지)
    logging: false,
  })
  return await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('canvas.toBlob failed'))), 'image/png', 1)
  })
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  // iOS는 revoke를 너무 빨리하면 다운로드 실패하는 케이스가 있어서 지연
  setTimeout(() => URL.revokeObjectURL(url), 2500)
}

async function shareBlob(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: 'image/png' })
  const nav: any = navigator as any
  await nav.share({
    files: [file],
    title: 'Relationship ROI',
    text: '스토리로 공유',
  })
}

export async function exportShareCardPng(
  el: HTMLElement,
  filename = 'relationship-roi-story.png',
  opts: { mode?: ExportMode; backgroundColor?: string } = {}
) {
  const mode = opts.mode ?? 'auto'
  const bg = opts.backgroundColor ?? '#0B0F19'

  // 1) html-to-image 먼저 시도
  let blob = await blobFromHtmlToImage(el, bg)

  // 2) 실패 시 html2canvas 폴백 (iOS는 html2canvas가 더 안정적)
  if (!blob || isIOS()) {
    try {
      blob = await blobFromHtml2Canvas(el, bg)
    } catch {
      // 마지막 안전망: 데이터URL 다운로드(품질/호환성 떨어질 수 있음)
      const pixelRatio = getOptimalPixelRatio()
      const dataUrl = await toPng(el, { cacheBust: true, pixelRatio, backgroundColor: bg })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      return
    }
  }

  // 3) share vs download
  if (mode === 'share' || (mode === 'auto' && canWebShareFile())) {
    try {
      await shareBlob(blob, filename)
      return
    } catch {
      // 공유 실패 시 다운로드
      downloadBlob(blob, filename)
      return
    }
  }

  downloadBlob(blob, filename)
}
