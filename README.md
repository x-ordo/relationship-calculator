# Relationship ROI (Preact MVP)

"인간관계 손익계산서" — **시간/돈/멘탈**을 기록 → 사람별 손익을 계산 → **스토리 공유 카드**로 뽑아내는 MVP.

## 실행

```bash
corepack enable
pnpm i
pnpm dev
```

## 포함된 기능 (MVP v0.7.0)

- 사람 추가/삭제
- 관계 이벤트 기록 (분/원/기분변화/상호성/경계침해/메모)
- **오늘 10초 기록(퀵바)**: 숫자만 찍고 즉시 저장 (대시보드 상단)
- **주간 요약 카드**: 지난 7일 손실/시간/원인 TOP + 이전 7일 대비 변화
- 월간 리포트: 사람별 손익 + ROI + 원인 TOP
- **공유 카드**: 1080×1920 비율, 레이아웃 프리셋 + 카피(12종) + PNG 저장
- **모바일 공유(웹쉐어)**: 지원되는 브라우저에서는 저장 대신 “바로 공유”
- **공유 안전장치**: PII 스캔(전화/이메일/URL/주민번호 패턴 등) + 체크리스트
- **코치 FREE**: 로컬 규칙 기반(“AI인 척”, API 호출 없음)
- **코치 PRO**: `/api/ai/coach`로 서버 LLM 호출(키 숨김, 최소 데이터)
- **PRO 언락(알파)**: `/api/billing/unlock`로 토큰 발급(결제 전 단계)

## 문서

- `docs/PRODUCT.md` : 제품/범위/IA
- `docs/BUSINESS.md` : BM/가격/비용 가정
- `docs/DESIGN.md` : “스트레스 해소 + 결제 유도” UI 원칙/카피
- `docs/DEV.md` : 개발 규칙/폴더 구조/루틴
- `docs/DEPLOY.md` : Cloudflare Pages + Functions 배포/ENV
- `CLAUDE.md` : Claude Code 작업 지시용 규칙

## 주의

- 이 앱은 **의료/심리 치료 도구가 아닙니다.**
- 공유 기능은 "신상 노출"로 번지기 쉬우니, 익명화/체크리스트를 강제합니다.

## License

Copyright (c) 2025 x-ordo. All Rights Reserved.

This is proprietary software. Unauthorized copying, modification, or distribution is strictly prohibited.

For licensing inquiries: parkdavid31@gmail.com
