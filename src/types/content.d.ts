// YAML 모듈 타입 선언
declare module '*.yaml' {
  const content: unknown
  export default content
}

declare module '*.yml' {
  const content: unknown
  export default content
}

// 콘텐츠 타입 정의
export type CopyTone = '냉정' | '회복' | '유머'

export interface CopyTemplate {
  id: string
  tone: CopyTone
  headline: string
  sub: string
  footer: string
}

export interface CopyYaml {
  templates: CopyTemplate[]
}

export type LayoutCategory = '기본' | '강렬' | '영수증'

export interface LayoutColors {
  bg: string
  fg: string
  accent: string
  sub: string
  border: string
}

export interface LayoutTypography {
  radius: number
  hSize: number
  subSize: number
  metaSize: number
}

export interface LayoutFeatures {
  showBigNumber: boolean
  showCauseChip: boolean
  showStamp: boolean
  showGrid: boolean
  showFooterBrand: boolean
  brutal: boolean
}

export interface LayoutConfig {
  id: string
  name: string
  category: LayoutCategory
  colors: LayoutColors
  typography: LayoutTypography
  features: LayoutFeatures
}

export interface LayoutCategoryConfig {
  value: LayoutCategory
  label: string
}

export interface LayoutsYaml {
  categories: LayoutCategoryConfig[]
  layouts: LayoutConfig[]
}
