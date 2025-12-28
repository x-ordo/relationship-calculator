import { useMemo } from 'react'

export interface RadarDataPoint {
  label: string
  value: number // 0-100
}

interface SimpleRadarChartProps {
  data: RadarDataPoint[]
  /** 채우기 색상 (CSS 변수 또는 hex) */
  fillColor?: string
  /** 테두리 색상 */
  strokeColor?: string
  /** 크기 (px) */
  size?: number
}

/**
 * Pure SVG 레이더 차트
 * relationship-audit 스타일 흡수 (의존성 없음)
 */
export function SimpleRadarChart({
  data,
  fillColor = 'var(--colorAuditGold)',
  strokeColor = 'var(--colorAuditGold)',
  size = 300
}: SimpleRadarChartProps) {
  const center = size / 2
  const radius = size * 0.4
  const levels = 4 // 그리드 레벨 수

  // 각 축의 각도 계산
  const angleStep = (2 * Math.PI) / data.length
  const startAngle = -Math.PI / 2 // 12시 방향에서 시작

  // 포인트 좌표 계산
  const getPoint = (index: number, value: number) => {
    const angle = startAngle + index * angleStep
    const r = (value / 100) * radius
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    }
  }

  // 데이터 폴리곤 경로
  const dataPath = useMemo(() => {
    return data
      .map((d, i) => {
        const point = getPoint(i, d.value)
        return `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
      })
      .join(' ') + ' Z'
  }, [data, center, radius])

  // 그리드 레벨 폴리곤
  const gridPaths = useMemo(() => {
    return Array.from({ length: levels }, (_, level) => {
      const levelRadius = ((level + 1) / levels) * 100
      return data
        .map((_, i) => {
          const point = getPoint(i, levelRadius)
          return `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
        })
        .join(' ') + ' Z'
    })
  }, [data.length, center, radius, levels])

  // 축 라인
  const axisLines = useMemo(() => {
    return data.map((_, i) => {
      const endPoint = getPoint(i, 100)
      return { x1: center, y1: center, x2: endPoint.x, y2: endPoint.y }
    })
  }, [data.length, center, radius])

  // 라벨 위치
  const labelPositions = useMemo(() => {
    return data.map((d, i) => {
      const point = getPoint(i, 115) // 축 끝에서 조금 바깥
      return { ...point, label: d.label }
    })
  }, [data, center, radius])

  return (
    <div className="radar-chart-container">
      <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label="레이더 차트">
        {/* 그리드 레벨 */}
        {gridPaths.map((path, i) => (
          <path
            key={`grid-${i}`}
            d={path}
            fill="none"
            stroke="var(--colorNeutralStroke1)"
            strokeWidth="1"
            opacity={0.5}
          />
        ))}

        {/* 축 라인 */}
        {axisLines.map((line, i) => (
          <line
            key={`axis-${i}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="var(--colorNeutralStroke1)"
            strokeWidth="1"
            opacity={0.5}
          />
        ))}

        {/* 데이터 영역 */}
        <path
          d={dataPath}
          fill={fillColor}
          fillOpacity={0.15}
          stroke={strokeColor}
          strokeWidth="2"
        />

        {/* 데이터 포인트 */}
        {data.map((d, i) => {
          const point = getPoint(i, d.value)
          return (
            <circle
              key={`point-${i}`}
              cx={point.x}
              cy={point.y}
              r="4"
              fill={fillColor}
            />
          )
        })}

        {/* 라벨 */}
        {labelPositions.map((pos, i) => (
          <text
            key={`label-${i}`}
            x={pos.x}
            y={pos.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="var(--colorNeutralForeground3)"
            fontSize="10"
            fontWeight="600"
            fontFamily="var(--fontFamilyMonospace)"
          >
            {pos.label}
          </text>
        ))}
      </svg>
    </div>
  )
}
