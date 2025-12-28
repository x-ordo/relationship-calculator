// Content Loader - YAML 파일에서 콘텐츠를 로드
import type {
  CopyYaml,
  CopyTemplate,
  CopyTone,
  LayoutsYaml,
  LayoutConfig,
  LayoutCategory,
  LayoutCategoryConfig,
} from '../../types/content'

// YAML 임포트
import copyYaml from '../../../content/copy.yaml'
import layoutsYaml from '../../../content/layouts.yaml'

// 타입 캐스팅
const copyData = copyYaml as CopyYaml
const layoutsData = layoutsYaml as LayoutsYaml

// ===== Copy Templates =====

export type ShareCardCopy = CopyTemplate

export const SHARE_CARD_COPY: ShareCardCopy[] = copyData.templates

export function getCopyByTone(tone: CopyTone): ShareCardCopy[] {
  return SHARE_CARD_COPY.filter(c => c.tone === tone)
}

export function getCopyById(id: string): ShareCardCopy | undefined {
  return SHARE_CARD_COPY.find(c => c.id === id)
}

export function renderTemplate(tpl: string, vars: Record<string, unknown>): string {
  return tpl.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, k) => {
    const v = vars?.[k]
    if (v === null || v === undefined) return ''
    return String(v)
  })
}

// ===== Layout Specs =====

// 기존 LayoutSpec 타입과 호환되는 평탄화된 구조
export type LayoutId = LayoutConfig['id']

export interface LayoutSpec {
  id: string
  name: string
  category: LayoutCategory
  bg: string
  fg: string
  accent: string
  sub: string
  border: string
  radius: number
  hSize: number
  subSize: number
  metaSize: number
  showBigNumber: boolean
  showCauseChip: boolean
  showStamp: boolean
  showGrid: boolean
  showFooterBrand: boolean
  brutal: boolean
}

// YAML 구조를 기존 평탄화된 구조로 변환
function flattenLayout(config: LayoutConfig): LayoutSpec {
  return {
    id: config.id,
    name: config.name,
    category: config.category,
    bg: config.colors.bg,
    fg: config.colors.fg,
    accent: config.colors.accent,
    sub: config.colors.sub,
    border: config.colors.border,
    radius: config.typography.radius,
    hSize: config.typography.hSize,
    subSize: config.typography.subSize,
    metaSize: config.typography.metaSize,
    showBigNumber: config.features.showBigNumber,
    showCauseChip: config.features.showCauseChip,
    showStamp: config.features.showStamp,
    showGrid: config.features.showGrid,
    showFooterBrand: config.features.showFooterBrand,
    brutal: config.features.brutal,
  }
}

export const LAYOUT_CATEGORIES: LayoutCategoryConfig[] = layoutsData.categories

export const SHARE_CARD_LAYOUTS: LayoutSpec[] = layoutsData.layouts.map(flattenLayout)

export function getLayout(id: string): LayoutSpec {
  return SHARE_CARD_LAYOUTS.find(x => x.id === id) || SHARE_CARD_LAYOUTS[0]
}

export function getLayoutsByCategory(category: LayoutCategory): LayoutSpec[] {
  return SHARE_CARD_LAYOUTS.filter(x => x.category === category)
}

// 타입 re-export
export type { LayoutCategory, CopyTone }
