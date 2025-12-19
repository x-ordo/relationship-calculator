const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export function buildAliasMap(namesInOrder: string[]) {
  const map = new Map<string, string>()
  let idx = 0
  for (const name of namesInOrder) {
    if (!name) continue
    if (map.has(name)) continue
    const alias = LETTERS[idx] ? LETTERS[idx] : `P${idx + 1}`
    map.set(name, alias)
    idx += 1
  }
  return map
}

export function anonymizeName(name: string, aliasMap: Map<string, string>): string {
  return aliasMap.get(name) || name
}

export function anonymizeText(text: string, aliasMap: Map<string, string>): string {
  if (!text) return text
  let out = text
  // 긴 이름부터 치환 (짧은 이름이 긴 이름 안에 포함되는 케이스 방지)
  const keys = [...aliasMap.keys()].sort((a, b) => b.length - a.length)
  for (const k of keys) {
    const alias = aliasMap.get(k)!
    // 단순 replace. MVP 기준.
    out = out.split(k).join(alias)
  }
  return out
}
