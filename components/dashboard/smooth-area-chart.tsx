'use client'

import React, { useState } from 'react'

export interface ChartSeries {
  id: string
  name: string
  color: string
  fillGradientId: string
  gradientColor: string
  data: number[]
  unit?: string
  formatValue?: (val: number) => string
}

interface SmoothAreaChartProps {
  labels: string[]
  series: ChartSeries[]
  height?: number
  className?: string
  emptyMessage?: string
}

/**
 * Fritsch-Carlson Monotone Cubic Spline to Bezier curve.
 * Guarantees zero overshoot/undershoot (never dips below 0 or above maximum).
 */
function getMonotoneSplinePath(
  points: { x: number; y: number }[],
  baselineY: number,
  paddingTop: number,
): string {
  const n = points.length
  if (n === 0) return ''
  if (n === 1) return `M ${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`

  // 1. Calculate secants (slopes of secant lines between successive points)
  const dxs: number[] = []
  const dys: number[] = []
  const slopes: number[] = []

  for (let i = 0; i < n - 1; i++) {
    const dx = points[i + 1].x - points[i].x
    const dy = points[i + 1].y - points[i].y
    dxs.push(dx)
    dys.push(dy)
    slopes.push(dx !== 0 ? dy / dx : 0)
  }

  // 2. Calculate initial tangents
  const m: number[] = new Array(n).fill(0)
  m[0] = slopes[0]
  m[n - 1] = slopes[n - 2]

  for (let i = 1; i < n - 1; i++) {
    if (slopes[i - 1] * slopes[i] <= 0) {
      m[i] = 0 // local extremum
    } else {
      m[i] = (slopes[i - 1] + slopes[i]) / 2
    }
  }

  // 3. Fritsch-Carlson step to guarantee monotonicity
  for (let i = 0; i < n - 1; i++) {
    if (slopes[i] === 0) {
      m[i] = 0
      m[i + 1] = 0
    } else {
      const alpha = m[i] / slopes[i]
      const beta = m[i + 1] / slopes[i]
      if (alpha < 0) m[i] = 0
      if (beta < 0) m[i + 1] = 0
      const dist = alpha * alpha + beta * beta
      if (dist > 9) {
        const tau = 3 / Math.sqrt(dist)
        m[i] = tau * alpha * slopes[i]
        m[i + 1] = tau * beta * slopes[i]
      }
    }
  }

  // 4. Build SVG Bezier Path
  let path = `M ${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`

  for (let i = 0; i < n - 1; i++) {
    const p1 = points[i]
    const p2 = points[i + 1]
    const dx = dxs[i]

    let cp1x = p1.x + dx / 3
    let cp1y = p1.y + (m[i] * dx) / 3

    let cp2x = p2.x - dx / 3
    let cp2y = p2.y - (m[i + 1] * dx) / 3

    // Strict clamping to prevent dipping below baseline (0 line) or exceeding top
    cp1y = Math.min(Math.max(cp1y, paddingTop), baselineY)
    cp2y = Math.min(Math.max(cp2y, paddingTop), baselineY)

    path += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`
  }

  return path
}

function getAreaPath(
  points: { x: number; y: number }[],
  baselineY: number,
  paddingTop: number,
): string {
  if (points.length === 0) return ''
  const spline = getMonotoneSplinePath(points, baselineY, paddingTop)
  const firstX = points[0].x.toFixed(2)
  const lastX = points[points.length - 1].x.toFixed(2)
  return `${spline} L ${lastX},${baselineY.toFixed(2)} L ${firstX},${baselineY.toFixed(2)} Z`
}

export function SmoothAreaChart({
  labels,
  series,
  height = 300,
  className = '',
  emptyMessage = 'No data available',
}: SmoothAreaChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const width = 800
  const paddingLeft = 55
  const paddingRight = 30
  const paddingTop = 25
  const paddingBottom = 40

  const plotWidth = width - paddingLeft - paddingRight
  const plotHeight = height - paddingTop - paddingBottom
  const baselineY = paddingTop + plotHeight

  // Find max value across all series
  const allValues = series.flatMap((s) => s.data)
  const rawMax = Math.max(...allValues, 10)
  // Round up max to nice step
  const maxVal = Math.ceil(rawMax * 1.15)

  const numLabels = labels.length
  const stepX = numLabels > 1 ? plotWidth / (numLabels - 1) : plotWidth

  // Grid steps (4 horizontal lines)
  const gridSteps = [0, 0.25, 0.5, 0.75, 1]

  // Compute (x, y) points for each series
  const seriesPoints = series.map((s) => {
    return s.data.map((val, idx) => {
      const x = paddingLeft + idx * stepX
      const normalizedVal = maxVal > 0 ? Math.max(val, 0) / maxVal : 0
      const y = Math.min(Math.max(baselineY - normalizedVal * plotHeight, paddingTop), baselineY)
      return { x, y, val }
    })
  })

  return (
    <div className={`relative w-full select-none ${className}`}>
      {/* SVG Canvas */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[600px] overflow-visible font-sans"
        >
          <defs>
            {series.map((s) => (
              <linearGradient
                key={s.fillGradientId}
                id={s.fillGradientId}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={s.gradientColor} stopOpacity="0.4" />
                <stop offset="40%" stopColor={s.gradientColor} stopOpacity="0.2" />
                <stop offset="90%" stopColor={s.gradientColor} stopOpacity="0.03" />
                <stop offset="100%" stopColor={s.gradientColor} stopOpacity="0.0" />
              </linearGradient>
            ))}
          </defs>

          {/* Horizontal Grid Lines & Y-axis Labels */}
          {gridSteps.map((fraction, i) => {
            const y = baselineY - fraction * plotHeight
            const val = Math.round(fraction * maxVal)

            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity={i === 0 ? '0.25' : '0.08'}
                  strokeDasharray={i === 0 ? 'none' : '4 4'}
                  className="text-border"
                />
                <text
                  x={paddingLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="currentColor"
                  className="text-muted-foreground font-mono"
                >
                  {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                </text>
              </g>
            )
          })}

          {/* Month Vertical Grid Lines & Labels along X-Axis */}
          {labels.map((lbl, idx) => {
            const x = paddingLeft + idx * stepX

            return (
              <g key={idx}>
                <line
                  x1={x}
                  y1={paddingTop}
                  x2={x}
                  y2={baselineY}
                  stroke="currentColor"
                  strokeOpacity="0.06"
                  className="text-border"
                />
                <text
                  x={x}
                  y={height - 12}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight={hoverIndex === idx ? 'bold' : 'normal'}
                  fill="currentColor"
                  className={
                    hoverIndex === idx
                      ? 'text-foreground font-semibold'
                      : 'text-muted-foreground'
                  }
                >
                  {lbl}
                </text>
              </g>
            )
          })}

          {/* Render Area Fills & Smooth Curves */}
          {series.map((s, sIdx) => {
            const points = seriesPoints[sIdx]
            const splinePath = getMonotoneSplinePath(points, baselineY, paddingTop)
            const areaPath = getAreaPath(points, baselineY, paddingTop)

            return (
              <g key={s.id}>
                {/* Translucent Area Fill */}
                <path
                  d={areaPath}
                  fill={`url(#${s.fillGradientId})`}
                  className="transition-all duration-300"
                />

                {/* Smooth Curve Stroke Line */}
                <path
                  d={splinePath}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-300 drop-shadow-xs"
                />
              </g>
            )
          })}

          {/* Active Hover Guide & Points */}
          {hoverIndex !== null && (
            <g>
              {/* Vertical Crosshair Line */}
              <line
                x1={paddingLeft + hoverIndex * stepX}
                y1={paddingTop}
                x2={paddingLeft + hoverIndex * stepX}
                y2={baselineY}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                className="text-primary/70"
              />

              {/* Data Points for each series */}
              {series.map((s, sIdx) => {
                const pt = seriesPoints[sIdx][hoverIndex]
                if (!pt) return null

                return (
                  <g key={s.id}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="6"
                      fill={s.color}
                      className="transition-all duration-150 shadow-md"
                    />
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="9"
                      fill={s.color}
                      fillOpacity="0.25"
                    />
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="2.5"
                      fill="#ffffff"
                    />
                  </g>
                )
              })}
            </g>
          )}

          {/* Interactive Mouse Hover Columns */}
          {labels.map((_, idx) => {
            const x = paddingLeft + idx * stepX - stepX / 2
            const colWidth = stepX

            return (
              <rect
                key={idx}
                x={Math.max(x, paddingLeft)}
                y={paddingTop}
                width={colWidth}
                height={plotHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoverIndex(idx)}
                onMouseLeave={() => setHoverIndex(null)}
              />
            )
          })}
        </svg>
      </div>

      {/* Floating Tooltip when hovering over a month */}
      {hoverIndex !== null && (
        <div
          className="absolute z-20 top-2 transform -translate-x-1/2 bg-popover/95 backdrop-blur-md text-popover-foreground rounded-2xl border border-border p-3 shadow-xl text-xs space-y-1.5 pointer-events-none transition-all"
          style={{
            left: `${((paddingLeft + hoverIndex * stepX) / width) * 100}%`,
          }}
        >
          <div className="font-bold border-b border-border pb-1 text-foreground flex items-center justify-between gap-4">
            <span>{labels[hoverIndex]}</span>
            <span className="text-[10px] text-muted-foreground font-mono">Monthly Stats</span>
          </div>

          <div className="space-y-1">
            {series.map((s) => {
              const val = s.data[hoverIndex] ?? 0
              const formatted = s.formatValue ? s.formatValue(val) : `${val.toLocaleString()} ${s.unit || ''}`

              return (
                <div key={s.id} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="size-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="text-muted-foreground text-[11px]">{s.name}:</span>
                  </div>
                  <span className="font-bold font-mono text-foreground text-[11px]">
                    {formatted}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
