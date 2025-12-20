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

#### Neutral Background
| 토큰 | 값 | 용도 |
|------|-----|------|
| `--colorNeutralBackground1` | #292929 | Elevated surface |
| `--colorNeutralBackground1Hover` | #3d3d3d | Hover state |
| `--colorNeutralBackground1Pressed` | #1f1f1f | Pressed state |
| `--colorNeutralBackground2` | #1f1f1f | Card, Panel |
| `--colorNeutralBackground3` | #141414 | Page background |
| `--colorNeutralBackground4` | #0a0a0a | Deepest layer |
| `--colorNeutralBackgroundDisabled` | #141414 | Disabled state |

#### Neutral Foreground
| 토큰 | 값 | 용도 |
|------|-----|------|
| `--colorNeutralForeground1` | #ffffff | Primary text |
| `--colorNeutralForeground2` | #d6d6d6 | Secondary text |
| `--colorNeutralForeground3` | #adadad | Muted text |
| `--colorNeutralForeground4` | #999999 | Placeholder |
| `--colorNeutralForegroundDisabled` | #5c5c5c | Disabled text |

#### Neutral Stroke
| 토큰 | 값 | 용도 |
|------|-----|------|
| `--colorNeutralStroke1` | #3d3d3d | Default border |
| `--colorNeutralStroke1Hover` | #525252 | Hover border |
| `--colorNeutralStroke1Pressed` | #3d3d3d | Pressed border |
| `--colorNeutralStroke2` | #525252 | Secondary border |
| `--colorNeutralStrokeDisabled` | #2e2e2e | Disabled border |

#### Brand (액센트)
| 토큰 | 값 | 용도 |
|------|-----|------|
| `--colorBrandBackground` | #2899f5 | Primary action |
| `--colorBrandBackgroundHover` | #3aa0f3 | Hover state |
| `--colorBrandBackgroundPressed` | #1890f1 | Pressed state |
| `--colorBrandBackgroundSelected` | #1890f1 | Selected state |
| `--colorBrandForeground1` | #82c7ff | Active text |
| `--colorBrandForeground2` | #c7e0f4 | Hover text |
| `--colorBrandStroke1` | #2899f5 | Brand border |

#### Subtle (Secondary)
| 토큰 | 값 | 용도 |
|------|-----|------|
| `--colorSubtleBackground` | transparent | Default |
| `--colorSubtleBackgroundHover` | rgba(255,255,255,0.06) | Hover |
| `--colorSubtleBackgroundPressed` | rgba(255,255,255,0.04) | Pressed |
| `--colorSubtleBackgroundSelected` | rgba(255,255,255,0.08) | Selected |

#### Status (상태)
| 토큰 | 값 | 용도 |
|------|-----|------|
| `--colorStatusDangerBackground1` | rgba(196,49,75,0.15) | Error bg light |
| `--colorStatusDangerBackground2` | rgba(196,49,75,0.25) | Error bg heavy |
| `--colorStatusDangerForeground1` | #dc626d | Error text |
| `--colorStatusDangerForeground2` | #f87c7c | Error text bright |
| `--colorStatusSuccessBackground1` | rgba(16,124,16,0.15) | Success bg light |
| `--colorStatusSuccessBackground2` | rgba(16,124,16,0.25) | Success bg heavy |
| `--colorStatusSuccessForeground1` | #54b054 | Success text |
| `--colorStatusSuccessForeground2` | #92d992 | Success text bright |
| `--colorStatusWarningBackground1` | rgba(234,179,8,0.12) | Warning bg |
| `--colorStatusWarningForeground1` | #fde68a | Warning text |

### Border Radius

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--borderRadiusNone` | 0 | No rounding |
| `--borderRadiusSmall` | 2px | Subtle rounding |
| `--borderRadiusMedium` | 4px | Input, Button |
| `--borderRadiusLarge` | 6px | Card, Panel |
| `--borderRadiusXLarge` | 8px | Modal, Sheet |
| `--borderRadiusCircular` | 10000px | Pill, Badge |

### Stroke Width

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--strokeWidthThin` | 1px | Default border |
| `--strokeWidthThick` | 2px | Focus ring |
| `--strokeWidthThicker` | 3px | Heavy emphasis |
| `--strokeWidthThickest` | 4px | Maximum |

### Spacing (4px base)

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--spacingNone` | 0 | No spacing |
| `--spacingXXS` | 2px | Minimal |
| `--spacingXS` | 4px | Tight |
| `--spacingSNudge` | 6px | Small nudge |
| `--spacingS` | 8px | Small |
| `--spacingMNudge` | 10px | Medium nudge |
| `--spacingM` | 12px | Medium |
| `--spacingL` | 16px | Large |
| `--spacingXL` | 20px | Extra large |
| `--spacingXXL` | 24px | Spacious |
| `--spacingXXXL` | 32px | Maximum |

### Typography

#### Font Family
| 토큰 | 값 |
|------|-----|
| `--fontFamilyBase` | 'Segoe UI Variable', 'Segoe UI', -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif |
| `--fontFamilyMonospace` | 'Cascadia Code', 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace |

#### Font Size
| 토큰 | 값 | 용도 |
|------|-----|------|
| `--fontSizeBase100` | 10px | Caption2 |
| `--fontSizeBase200` | 12px | Caption1 |
| `--fontSizeBase300` | 14px | Body1 (기본) |
| `--fontSizeBase400` | 16px | Body2 |
| `--fontSizeBase500` | 20px | Subtitle1 |
| `--fontSizeBase600` | 24px | Title3 |
| `--fontSizeHero700` | 28px | Title2 |
| `--fontSizeHero800` | 32px | Title1 |
| `--fontSizeHero900` | 40px | LargeTitle |
| `--fontSizeHero1000` | 68px | Display |

#### Line Height
| 토큰 | 값 |
|------|-----|
| `--lineHeightBase100` | 14px |
| `--lineHeightBase200` | 16px |
| `--lineHeightBase300` | 20px |
| `--lineHeightBase400` | 22px |
| `--lineHeightBase500` | 26px |
| `--lineHeightBase600` | 32px |
| `--lineHeightHero700` | 36px |
| `--lineHeightHero800` | 40px |
| `--lineHeightHero900` | 52px |

#### Font Weight
| 토큰 | 값 |
|------|-----|
| `--fontWeightRegular` | 400 |
| `--fontWeightSemibold` | 600 |
| `--fontWeightBold` | 700 |

### Shadow

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--shadow2` | 0 1px 2px rgba(0,0,0,0.24) | Subtle |
| `--shadow4` | 0 2px 4px rgba(0,0,0,0.28) | Card |
| `--shadow8` | 0 4px 8px rgba(0,0,0,0.28) | Elevated |
| `--shadow16` | 0 8px 16px rgba(0,0,0,0.28) | FAB |
| `--shadow28` | 0 14px 28px rgba(0,0,0,0.32) | Modal |
| `--shadow64` | 0 32px 64px rgba(0,0,0,0.40) | Overlay |

### Motion - Duration

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--durationUltraFast` | 50ms | Instant feedback |
| `--durationFaster` | 100ms | Quick response |
| `--durationFast` | 150ms | Standard hover |
| `--durationNormal` | 200ms | Default transition |
| `--durationGentle` | 250ms | Smooth transition |
| `--durationSlow` | 300ms | Deliberate motion |
| `--durationSlower` | 400ms | Complex animation |
| `--durationUltraSlow` | 500ms | Large movement |

### Motion - Easing

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--curveAccelerateMax` | cubic-bezier(0.9,0.1,1,0.2) | Fast exit |
| `--curveAccelerateMid` | cubic-bezier(1,0,1,1) | Medium exit |
| `--curveAccelerateMin` | cubic-bezier(0.8,0,0.78,1) | Gentle exit |
| `--curveDecelerateMax` | cubic-bezier(0.1,0.9,0.2,1) | Fast enter |
| `--curveDecelerateMid` | cubic-bezier(0,0,0,1) | Medium enter |
| `--curveDecelerateMin` | cubic-bezier(0.33,0,0.1,1) | Gentle enter |
| `--curveEasyEaseMax` | cubic-bezier(0.8,0,0.2,1) | Symmetric |
| `--curveEasyEase` | cubic-bezier(0.33,0,0.67,1) | Default |
| `--curveLinear` | cubic-bezier(0,0,1,1) | Linear |

### Focus Ring

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--focusStrokeOuter` | #ffffff | Outer focus ring |
| `--focusStrokeInner` | #000000 | Inner focus ring |

### 레거시 호환 변수

기존 코드 호환을 위해 별칭 유지:
```css
--bg: var(--colorNeutralBackground3);
--panel: var(--colorNeutralBackground2);
--border: var(--colorNeutralStroke1);
--text: var(--colorNeutralForeground1);
--muted: var(--colorNeutralForeground3);
--accent: var(--colorBrandBackground);
--danger: var(--colorStatusDangerForeground1);
--ok: var(--colorStatusSuccessForeground1);
```

### 접근성 (Accessibility)

```css
/* 포커스 링 */
:focus-visible {
  outline: var(--strokeWidthThick) solid var(--focusStrokeOuter);
  outline-offset: var(--strokeWidthThin);
}

/* 모션 감소 선호 */
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
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
