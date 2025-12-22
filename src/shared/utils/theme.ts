export type Theme = 'dark' | 'light' | 'system'

const STORAGE_KEY = 'theme'

/** 현재 시스템 테마 감지 */
function getSystemTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

/** 저장된 테마 설정 로드 */
export function loadTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'dark' || saved === 'light' || saved === 'system') {
      return saved
    }
  } catch {}
  return 'dark' // 기본값: 다크 모드
}

/** 테마 설정 저장 */
export function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {}
}

/** 실제 적용할 테마 계산 */
function resolveTheme(theme: Theme): 'dark' | 'light' {
  if (theme === 'system') return getSystemTheme()
  return theme
}

/** DOM에 테마 적용 */
export function applyTheme(theme: Theme): void {
  const resolved = resolveTheme(theme)
  if (resolved === 'light') {
    document.documentElement.setAttribute('data-theme', 'light')
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
}

/** 초기화: 저장된 테마 로드 및 적용 */
export function initTheme(): Theme {
  const theme = loadTheme()
  applyTheme(theme)

  // 시스템 테마 변경 감지
  if (typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
      if (loadTheme() === 'system') {
        applyTheme('system')
      }
    })
  }

  return theme
}

/** 다음 테마로 순환 */
export function cycleTheme(current: Theme): Theme {
  const order: Theme[] = ['dark', 'light', 'system']
  const idx = order.indexOf(current)
  return order[(idx + 1) % order.length]
}

/** 테마 라벨 */
export function themeLabel(theme: Theme): string {
  switch (theme) {
    case 'dark': return '다크'
    case 'light': return '라이트'
    case 'system': return '시스템'
  }
}

/** 테마 아이콘 */
export function themeIcon(theme: Theme): string {
  switch (theme) {
    case 'dark': return '🌙'
    case 'light': return '☀️'
    case 'system': return '💻'
  }
}
