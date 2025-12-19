/**
 * Input validation utilities
 */

export type ValidationResult = {
  valid: boolean
  error?: string
}

/**
 * Validates person name
 * - 1-30 characters
 * - No leading/trailing whitespace (will be trimmed)
 */
export function validatePersonName(name: string): ValidationResult {
  const trimmed = name.trim()
  if (!trimmed) {
    return { valid: false, error: '이름을 입력하세요' }
  }
  if (trimmed.length > 30) {
    return { valid: false, error: '이름은 30자 이내로 입력하세요' }
  }
  return { valid: true }
}

/**
 * Validates date format (YYYY-MM-DD)
 */
export function validateDate(date: string): ValidationResult {
  if (!date) {
    return { valid: false, error: '날짜를 선택하세요' }
  }
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(date)) {
    return { valid: false, error: '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)' }
  }
  const d = new Date(date)
  if (isNaN(d.getTime())) {
    return { valid: false, error: '유효하지 않은 날짜입니다' }
  }
  // No future dates beyond 1 day (timezone buffer)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (d > tomorrow) {
    return { valid: false, error: '미래 날짜는 입력할 수 없습니다' }
  }
  return { valid: true }
}

/**
 * Validates minutes (0-1440, i.e., 0-24 hours)
 */
export function validateMinutes(minutes: number): ValidationResult {
  if (isNaN(minutes) || minutes < 0) {
    return { valid: false, error: '시간은 0 이상이어야 합니다' }
  }
  if (minutes > 1440) {
    return { valid: false, error: '하루 최대 1440분(24시간)까지 입력 가능합니다' }
  }
  return { valid: true }
}

/**
 * Validates money amount in Won (0-100,000,000)
 */
export function validateMoneyWon(amount: number): ValidationResult {
  if (isNaN(amount) || amount < 0) {
    return { valid: false, error: '금액은 0 이상이어야 합니다' }
  }
  if (amount > 100_000_000) {
    return { valid: false, error: '금액은 1억원 이하로 입력하세요' }
  }
  return { valid: true }
}

/**
 * Validates note length (max 1000 characters)
 */
export function validateNote(note: string): ValidationResult {
  if (note.length > 1000) {
    return { valid: false, error: '메모는 1000자 이내로 입력하세요' }
  }
  return { valid: true }
}

/**
 * Validates month format (YYYY-MM)
 */
export function validateMonth(month: string): ValidationResult {
  if (!month) {
    return { valid: true } // Empty is allowed (means "all")
  }
  const regex = /^\d{4}-\d{2}$/
  if (!regex.test(month)) {
    return { valid: false, error: '월 형식이 올바르지 않습니다 (YYYY-MM)' }
  }
  const [year, monthNum] = month.split('-').map(Number)
  if (monthNum < 1 || monthNum > 12) {
    return { valid: false, error: '월은 01-12 사이여야 합니다' }
  }
  if (year < 2020 || year > 2100) {
    return { valid: false, error: '연도는 2020-2100 사이여야 합니다' }
  }
  return { valid: true }
}

/**
 * Validates all entry fields at once
 */
export function validateEntry(entry: {
  personId: string
  date: string
  minutes: number
  moneyWon: number
  note: string
}): ValidationResult {
  if (!entry.personId) {
    return { valid: false, error: '사람을 선택하세요' }
  }

  const dateResult = validateDate(entry.date)
  if (!dateResult.valid) return dateResult

  const minutesResult = validateMinutes(entry.minutes)
  if (!minutesResult.valid) return minutesResult

  const moneyResult = validateMoneyWon(entry.moneyWon)
  if (!moneyResult.valid) return moneyResult

  const noteResult = validateNote(entry.note)
  if (!noteResult.valid) return noteResult

  return { valid: true }
}
