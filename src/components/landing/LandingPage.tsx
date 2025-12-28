import { Button } from '@fluentui/react-components'

interface LandingPageProps {
  onStart: () => void
}

const FEATURES = [
  {
    icon: '📊',
    title: '손익 자동 계산',
    desc: '시간, 돈, 감정 비용을 자동으로 환산하여 관계의 ROI를 계산합니다.'
  },
  {
    icon: '⚖️',
    title: 'AI 판사',
    desc: '법원 판결문 스타일로 관계를 심판하고 실행 가능한 조언을 제공합니다.'
  },
  {
    icon: '🔒',
    title: '완전한 프라이버시',
    desc: '모든 데이터는 브라우저에만 저장됩니다. 서버 전송 없음.'
  },
  {
    icon: '📤',
    title: '바이럴 공유 카드',
    desc: '익명화된 공유 카드로 SNS에서 안전하게 공유하세요.'
  }
]

export function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div className="landing">
      <section className="landing-hero">
        <div className="landing-hero-content animate-page-enter">
          <div className="landing-badge">MVP v0.6</div>
          <h1 className="landing-title">
            인간관계<br />
            <span className="landing-title-accent">손익 계산기</span>
          </h1>
          <p className="landing-subtitle">
            감정 빼고, 손익만 정리한다.<br />
            시간 · 돈 · 감정 비용을 계산하고,<br />
            관계를 객관적으로 심판받으세요.
          </p>
          <div className="landing-cta-group">
            <Button appearance="primary" size="large" onClick={onStart} className="landing-cta">
              무료로 시작하기
            </Button>
            <div className="landing-cta-hint">가입 없이 바로 사용</div>
          </div>
        </div>

        <div className="landing-hero-visual animate-page-enter" style={{ animationDelay: '0.2s' }}>
          <div className="landing-preview-card">
            <div className="landing-preview-header">
              <span className="hint mono-font">현재까지 총 손실</span>
              <div className="hero-stamp animate-stamp" style={{ position: 'static', transform: 'rotate(-8deg)' }}>
                <div className="audit-stamp">손실 경고</div>
              </div>
            </div>
            <div className="landing-preview-value">-₩847,000</div>
            <div className="landing-preview-meta">
              <span>시간 42.5h</span>
              <span>·</span>
              <span>ROI -127%</span>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-features">
        <h2 className="landing-section-title">핵심 기능</h2>
        <div className="landing-features-grid">
          {FEATURES.map((f, i) => (
            <div
              className="landing-feature-card"
              key={i}
              style={{ animationDelay: `${0.1 * i}s` }}
            >
              <div className="landing-feature-icon">{f.icon}</div>
              <h3 className="landing-feature-title">{f.title}</h3>
              <p className="landing-feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-how">
        <h2 className="landing-section-title">사용 방법</h2>
        <div className="landing-steps">
          <div className="landing-step">
            <div className="landing-step-number">1</div>
            <div className="landing-step-content">
              <h3>사람 추가</h3>
              <p>관계를 정리하고 싶은 사람을 등록합니다.</p>
            </div>
          </div>
          <div className="landing-step">
            <div className="landing-step-number">2</div>
            <div className="landing-step-content">
              <h3>상황 기록</h3>
              <p>시간, 비용, 기분, 상호성을 기록합니다.</p>
            </div>
          </div>
          <div className="landing-step">
            <div className="landing-step-number">3</div>
            <div className="landing-step-content">
              <h3>판결 받기</h3>
              <p>AI 판사가 관계를 심판하고 조언합니다.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-final-cta">
        <h2>감정 소모 그만,<br />이제 계산하세요.</h2>
        <Button appearance="primary" size="large" onClick={onStart} className="landing-cta">
          지금 시작하기
        </Button>
        <p className="hint" style={{ marginTop: 12 }}>
          가입 없음 · 무료 · 데이터 로컬 저장
        </p>
      </section>

      <footer className="landing-footer">
        <div className="hint">Relationship ROI · MVP v0.6.0</div>
        <div className="hint">데이터는 브라우저에만 저장됩니다.</div>
      </footer>
    </div>
  )
}
