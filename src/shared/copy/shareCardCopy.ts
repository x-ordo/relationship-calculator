// 후방 호환성을 위한 re-export
// 실제 콘텐츠는 content/copy.yaml에서 로드됨
export {
  SHARE_CARD_COPY,
  getCopyByTone,
  getCopyById,
  renderTemplate,
} from '../content'

export type { ShareCardCopy, CopyTone } from '../content'
