# DESIGN

목표: **스트레스를 해소하려는 사람**이 "생각"을 덜 하고 "결정"을 더 하게 만드는 화면.

## 핵심 심리 원칙과 적용

1) **손실회피(Loss Aversion)**
- 돈/시간/멘탈을 "손실"로 표기하면 행동이 빨라진다.
- UI: `-₩` 같은 명확한 부호, 붉은 강조.

2) **인지부하 최소화(Cognitive Load)**
- 입력은 최대 6개 필드.
- 기본값을 공격적으로 제공.

3) **기록 = 처벌이 아니라 해방**
- “기록하면 더 우울해질까봐”를 먼저 차단.
- 카피: "숫자화하면 선택이 쉬워진다".

4) **사회적 증거(Social Proof) + 익명성**
- 공유는 바이럴 핵심이지만, 식별정보 노출은 리스크.
- 해결: 익명화(A/B/C) + PII 스캔 + 필수 체크리스트.

## 디자인 톤
- 다크 UI 기본(피로 낮추고, 감정 과열을 줄임)
- 카드(Panel) 중심, 넓은 여백
- 결과 페이지는 "판결문" 느낌: 짧고 단호한 문장 + 숫자

---

## Fluent 2 디자인 시스템

Microsoft Fluent 2 디자인 시스템 기반. 다크 테마 전용.

### Color Tokens

#### Neutral (배경/전경)
| 토큰 | 값 | 용도 |
|------|-----|------|
| `--colorNeutralBackground1` | #292929 | Elevated surface |
| `--colorNeutralBackground2` | #1f1f1f | Card, Panel |
| `--colorNeutralBackground3` | #141414 | Page background |
| `--colorNeutralBackground4` | #0a0a0a | Deepest layer |
| `--colorNeutralForeground1` | #ffffff | Primary text |
| `--colorNeutralForeground2` | #d6d6d6 | Secondary text |
| `--colorNeutralForeground3` | #adadad | Muted text |
| `--colorNeutralStroke1` | #3d3d3d | Border |

#### Brand (액센트)
| 토큰 | 값 | 용도 |
|------|-----|------|
| `--colorBrandBackground` | #2899f5 | Primary action |
| `--colorBrandBackgroundHover` | #3aa0f3 | Hover state |
| `--colorBrandForeground1` | #82c7ff | Active text |

#### Status (상태)
| 토큰 | 값 | 용도 |
|------|-----|------|
| `--colorStatusDangerForeground` | #dc626d | Error, 손실 |
| `--colorStatusSuccessForeground` | #54b054 | Success, 흑자 |
| `--colorStatusWarningForeground` | #fde68a | Warning |

### Border Radius

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--borderRadiusSmall` | 2px | Subtle rounding |
| `--borderRadiusMedium` | 4px | Input, Button |
| `--borderRadiusLarge` | 6px | Card, Panel |
| `--borderRadiusXLarge` | 8px | Modal, Sheet |
| `--borderRadiusCircular` | 9999px | Pill, Badge |

### Spacing (4px base)

| 토큰 | 값 |
|------|-----|
| `--spacingHorizontalXXS` | 2px |
| `--spacingHorizontalXS` | 4px |
| `--spacingHorizontalS` | 8px |
| `--spacingHorizontalM` | 12px |
| `--spacingHorizontalL` | 16px |
| `--spacingHorizontalXL` | 20px |
| `--spacingHorizontalXXL` | 24px |

### Typography

| 토큰 | 값 |
|------|-----|
| `--fontFamilyBase` | 'Segoe UI', -apple-system, system-ui |
| `--fontSizeBase200` | 12px |
| `--fontSizeBase300` | 14px (기본) |
| `--fontSizeBase400` | 16px |
| `--fontSizeBase500` | 20px |
| `--fontSizeBase600` | 24px |
| `--fontWeightRegular` | 400 |
| `--fontWeightSemibold` | 600 |
| `--fontWeightBold` | 700 |

### Shadow

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--shadow4` | 0 2px 4px rgba(0,0,0,0.14) | Card |
| `--shadow8` | 0 4px 8px rgba(0,0,0,0.14) | Elevated |
| `--shadow16` | 0 8px 16px rgba(0,0,0,0.14) | FAB |
| `--shadow28` | 0 14px 28px rgba(0,0,0,0.24) | Modal |

### 레거시 호환 변수

기존 코드 호환을 위해 별칭 유지:
```css
--bg: var(--colorNeutralBackground3);
--panel: var(--colorNeutralBackground2);
--border: var(--colorNeutralStroke1);
--text: var(--colorNeutralForeground1);
--muted: var(--colorNeutralForeground3);
--accent: var(--colorBrandBackground);
--danger: var(--colorStatusDangerForeground);
--ok: var(--colorStatusSuccessForeground);
```

### 참고 자료
- [Fluent 2 Design System](https://fluent2.microsoft.design/)
- [Fluent UI React Tokens](https://react.fluentui.dev/)
- [@fluentui/tokens](https://github.com/microsoft/fluentui/tree/master/packages/tokens)

---

## 한국어 마이크로카피 가이드(독하게)

- 입력 유도
  - "지금 감정이 아니라, 비용만 적어."
  - "상대 얘기 말고, 네 손해부터."

- 결과
  - "손실이 숫자로 찍혔다. 이제 선택만 남았다."
  - "경계 없는 친절은 공짜 노동이다."

- 공유
  - "식별정보 섞이면 지옥문 열린다. 익명화 켜라."

## 다음 단계(전문가 협업 확장)
- 심리 상담/정신의학 연계는 "치료"가 아니라 **기록 기반 자기관리**로 포지셔닝.
- 전문가용 기능은 별도 테넌트(B2B)로 분리(윤리/법무/로그/권한).

---

## PRO 결제/전환 UI 원칙 (알파 → 구독)

- **문제 인식 → 수치화 → 해결** 3단.
  - “지금 손해가 숫자로 찍힌다” → “그래서 오늘 뭘 하면 된다” → “PRO가 그걸 문장으로 만들어준다”.
- **스트레스 해소형 결제**는 ‘감정’을 자극하되, 버튼은 단순해야 함.
  - 1 CTA: `지금 PRO로 끝내기`.
- **불안(회피) 완화 장치**
  - “언제든 FREE로 돌아갈 수 있음” 문구를 CTA 근처에.
- **심리적 안전장치**
  - 의료/치료로 오인될 만한 문구 금지.
  - 위급/안전 이슈는 전문 도움 우선.
