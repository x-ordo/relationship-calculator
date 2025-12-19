# DEPLOY (Cloudflare Pages + Functions)

이 MVP는 **정적 프론트(Preact/Vite)** + **Functions(유료 코치/언락)** 구조다.

## 1) Cloudflare Pages 프로젝트 생성

- 빌드 명령: `pnpm build`
- 출력 폴더: `dist`

## 2) Functions 경로

- `functions/api/ai/coach.ts` → `POST /api/ai/coach`
- `functions/api/billing/unlock.ts` → `POST /api/billing/unlock`

## 3) 환경 변수(필수)

### PRO 코치 (LLM)

| 키 | 설명 | 예시 |
|---|---|---|
| `LLM_BASE_URL` | OpenAI 호환 API base URL | `https://api.openai.com/v1` |
| `LLM_API_KEY` | 서버에서만 보관 | `...` |
| `LLM_MODEL` | 모델명 | `gpt-4o-mini` |
| `PRO_TOKENS` | 허용 토큰 목록(콤마) | `pro_xxx,pro_yyy` |

> `PRO_TOKENS`를 비워두면 MVP는 allow-all로 동작한다(운영에선 반드시 채워라).

### PRO 언락(알파 배포)

| 키 | 설명 | 예시 |
|---|---|---|
| `PRO_UNLOCK_CODES` | 언락 코드 목록(콤마) | `ALPHA-001,ALPHA-002` |
| `PRO_TOKEN_PREFIX` | 발급 토큰 접두어 | `pro` |

## 4) 로컬에서 Functions까지 테스트하고 싶으면

Cloudflare Pages 로컬 에뮬레이터(wrangler)로 묶는 게 정석이지만, 이 레포는 **프론트 중심 MVP**라서:

- 프론트만 먼저 `pnpm dev`로 확인
- Functions는 배포 환경에서 ENV 세팅 후 확인

(다음 단계에서 `wrangler.toml` + 로컬 통합 러너 추가 권장)
