// 후방 호환성을 위한 re-export
// 실제 콘텐츠는 content/layouts.yaml에서 로드됨
export {
  SHARE_CARD_LAYOUTS,
  LAYOUT_CATEGORIES,
  getLayout,
  getLayoutsByCategory,
} from '../content'

export type { LayoutSpec, LayoutId, LayoutCategory } from '../content'
