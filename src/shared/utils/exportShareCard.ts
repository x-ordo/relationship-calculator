import { toBlob as htmlToBlob, toPng } from 'html-to-image'
import html2canvas from 'html2canvas'

export type ExportMode = 'auto' | 'download' | 'share'

function isIOS() {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
}

function canWebShareFile() {
  const nav: any = navigator as any
  if (!nav?.share) return false
  if (!nav?.canShare) return false
  try {
    return nav.canShare({ files: [new File([new Blob(['x'])], 'x.txt', { type: 'text/plain' })] })
  } catch {
    return false
  }
}

async function blobFromHtmlToImage(el: HTMLElement, backgroundColor = '#0B0F19'): Promise<Blob | null> {
  // Safari/iOS에서 foreignObject 문제가 종종 터진다.
  // 일단 시도하고, 실패하면 html2canvas로 폴백.
  try {
    const blob = await htmlToBlob(el, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor,
    })
    return blob
  } catch {
    return null
  }
}

async function blobFromHtml2Canvas(el: HTMLElement, backgroundColor = '#0B0F19'): Promise<Blob> {
  const canvas = await html2canvas(el, {
    backgroundColor,
    scale: 2,
    useCORS: true,
    allowTaint: true,
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

  // 1) html-to-image 먼저
  let blob = await blobFromHtmlToImage(el, bg)

  // 2) iOS / 실패 시 html2canvas 폴백
  if (!blob || isIOS()) {
    try {
      blob = await blobFromHtml2Canvas(el, bg)
    } catch {
      // 마지막 안전망: 데이터URL 다운로드(품질/호환성 떨어질 수 있음)
      const dataUrl = await toPng(el, { cacheBust: true, pixelRatio: 2, backgroundColor: bg })
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
