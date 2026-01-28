import React, { useState } from "react";
import { PoolState } from "../types";

interface PriceCurveChartProps {
  poolState: PoolState;
}

const MAX_ITERATIONS = 255;
const AMP_PRECISION = 1000n;

// Calculate invariant D for a given A and balances
function calculateInvariant(A: number, balanceA: number, balanceB: number): number {
  const amp = BigInt(Math.floor(A)) * AMP_PRECISION;
  const scale = 1e6; // Use smaller scale to avoid overflow
  const balA = BigInt(Math.floor(balanceA * scale));
  const balB = BigInt(Math.floor(balanceB * scale));

  let sum = balA + balB;
  if (sum === 0n) return 0;

  let prevInvariant = 0n;
  let invariant = sum;
  const ampTimesTotal = amp * 2n;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    let D_P = invariant;
    D_P = (D_P * invariant) / (balA * 2n);
    D_P = (D_P * invariant) / (balB * 2n);

    prevInvariant = invariant;
    invariant =
      (((ampTimesTotal * sum) / AMP_PRECISION + D_P * 2n) * invariant) /
      (((ampTimesTotal - AMP_PRECISION) * invariant) / AMP_PRECISION + 3n * D_P);

    if (invariant > prevInvariant) {
      if (invariant - prevInvariant <= 1n) break;
    } else if (prevInvariant - invariant <= 1n) break;
  }

  return Number(invariant) / scale;
}

// Calculate y given x, D, and A
function calculateY(x: number, D: number, A: number): number {
  const amp = BigInt(Math.floor(A)) * AMP_PRECISION;
  const scale = 1e6; // Match the scale from calculateInvariant
  const xScaled = BigInt(Math.floor(x * scale));
  const DScaled = BigInt(Math.floor(D * scale));

  const ampTimesTotal = amp * 2n;
  const numTokens = 2n;

  // Calculate c and b for the quadratic equation
  // We're solving for the second token balance given the first
  const sum = xScaled;

  // P_D = x * n^n / D
  let P_D = xScaled * numTokens;
  P_D = (P_D * xScaled * numTokens) / DScaled;

  const inv2 = DScaled * DScaled;
  const c = ((inv2 * AMP_PRECISION - 1n) / (ampTimesTotal * P_D) + 1n) * xScaled;
  const b = sum + (DScaled * AMP_PRECISION) / ampTimesTotal;

  let prevY = 0n;
  let y = (inv2 + c - 1n) / (DScaled + b) + 1n;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    prevY = y;
    y = (y * y + c - 1n) / (y * 2n + b - DScaled) + 1n;

    if (y > prevY) {
      if (y - prevY <= 1n) break;
    } else if (prevY - y <= 1n) break;
  }

  return Number(y) / scale;
}

export const PriceCurveChart: React.FC<PriceCurveChartProps> = ({ poolState }) => {
  const selectedPoints = 200; // Fixed at 200 points for smooth curves
  const [hoveredCurve, setHoveredCurve] = useState<number | null>(null);
  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number } | null>(null);

  // Different A values to compare
  const aValues = [50, 200, 500, 1000, 5000];
  const colors = ["#dc3545", "#fd7e14", "#ffc107", "#28a745", "#007bff"];

  // Track which curves are visible (all visible by default)
  const [visibleCurves, setVisibleCurves] = useState<boolean[]>(
    aValues.map(() => true)
  );

  // Toggle curve visibility
  const toggleCurve = (index: number) => {
    setVisibleCurves(prev => {
      const newVisible = [...prev];
      newVisible[index] = !newVisible[index];
      return newVisible;
    });
  };

  // Calculate invariant D using the CURRENT pool's A value
  // Then show how different A values create different curves with this same D
  const currentD = calculateInvariant(
    poolState.amplificationFactor,
    poolState.balanceA,
    poolState.balanceB,
  );
  console.log("Current pool invariant D:", currentD, "for A:", poolState.amplificationFactor);

  // Chart dimensions
  const width = 800;
  const height = 600;
  const padding = 60;
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;

  // Calculate the total liquidity for scaling
  const totalLiquidity = poolState.balanceA + poolState.balanceB;
  const maxVal = totalLiquidity * 1.5; // Increased range to show more separation

  // Generate curve data for each A value using the SAME D (current pool's D)
  const curves = aValues.map((A, idx) => {
    const D = currentD; // Use the same D for all curves
    const points: Array<{ x: number; y: number }> = [];

    // Generate points along the curve - start from a small value, not 0
    const minX = maxVal * 0.01; // Start from 1% of max
    const step = (maxVal - minX) / selectedPoints;

    for (let i = 0; i <= selectedPoints; i++) {
      const x = minX + i * step;
      try {
        const y = calculateY(x, D, A);
        if (y > 0 && y < maxVal * 3 && !isNaN(y) && isFinite(y)) {
          points.push({ x, y });
        }
      } catch (e) {
        // Skip invalid points
        console.error("Error calculating y:", e);
      }
    }

    console.log(`Curve for A=${A}: ${points.length} points, D=${D}`);

    return {
      A,
      points,
      color: colors[idx],
    };
  });

  // Scale functions
  const scaleX = (x: number) => padding + (x / maxVal) * chartWidth;
  const scaleY = (y: number) => height - padding - (y / maxVal) * chartHeight;

  // Current pool position
  const currentX = scaleX(poolState.balanceA);
  const currentY = scaleY(poolState.balanceB);

  // Handle mouse move over SVG to find closest curve point
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Find the closest curve and point (only consider visible curves)
    let closestCurveIdx = -1;
    let closestPoint: { x: number; y: number } | null = null;
    let minDistance = Infinity;

    curves.forEach((curve, curveIdx) => {
      // Skip hidden curves
      if (!visibleCurves[curveIdx]) return;

      curve.points.forEach((point) => {
        const px = scaleX(point.x);
        const py = scaleY(point.y);
        const distance = Math.sqrt((px - mouseX) ** 2 + (py - mouseY) ** 2);

        if (distance < minDistance && distance < 50) { // 50px threshold
          minDistance = distance;
          closestCurveIdx = curveIdx;
          closestPoint = point;
        }
      });
    });

    if (closestCurveIdx !== -1 && closestPoint) {
      setHoveredCurve(closestCurveIdx);
      setHoverPoint(closestPoint);
    } else {
      setHoveredCurve(null);
      setHoverPoint(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredCurve(null);
    setHoverPoint(null);
  };

  return (
    <div className="price-curve-chart">
      <h3>Price Curves by Amplification Factor</h3>
      <p className="chart-subtitle">
        Comparing bonding curves for different A values with constant invariant D (current pool shown as ●)
      </p>

      <svg
        width={width}
        height={height}
        className="curve-svg"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Axes */}
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#333"
          strokeWidth="2"
        />
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke="#333"
          strokeWidth="2"
        />

        {/* Axis labels */}
        <text x={width / 2} y={height - 10} textAnchor="middle" fill="#333" fontSize="14">
          Token A Balance
        </text>
        <text
          x={20}
          y={height / 2}
          textAnchor="middle"
          fill="#333"
          fontSize="14"
          transform={`rotate(-90, 20, ${height / 2})`}
        >
          Token B Balance
        </text>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
          const x = padding + fraction * chartWidth;
          const y = height - padding - fraction * chartHeight;
          const value = (fraction * maxVal).toFixed(0);

          return (
            <g key={fraction}>
              {/* Vertical grid line */}
              <line
                x1={x}
                y1={padding}
                x2={x}
                y2={height - padding}
                stroke="#ddd"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
              {/* Horizontal grid line */}
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#ddd"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
              {/* X-axis tick label */}
              <text x={x} y={height - padding + 20} textAnchor="middle" fill="#666" fontSize="11">
                {value}
              </text>
              {/* Y-axis tick label */}
              <text x={padding - 10} y={y + 5} textAnchor="end" fill="#666" fontSize="11">
                {value}
              </text>
            </g>
          );
        })}

        {/* Draw curves */}
        {curves.map((curve, idx) => {
          // Skip if curve is hidden
          if (!visibleCurves[idx]) return null;

          if (curve.points.length < 2) {
            console.warn(`Not enough points for A=${curve.A}`);
            return null;
          }

          const pathData = curve.points
            .map((point, i) => {
              const x = scaleX(point.x);
              const y = scaleY(point.y);
              return `${i === 0 ? "M" : "L"} ${x} ${y}`;
            })
            .join(" ");

          const isHovered = hoveredCurve === idx;

          return (
            <path
              key={curve.A}
              d={pathData}
              stroke={curve.color}
              strokeWidth={isHovered ? "4" : "2.5"}
              fill="none"
              opacity={hoveredCurve === null ? "0.8" : isHovered ? "1" : "0.3"}
            />
          );
        })}

        {/* Current pool position */}
        <circle cx={currentX} cy={currentY} r="6" fill="#667eea" stroke="#fff" strokeWidth="2" />

        {/* Hover indicator and tooltip */}
        {hoverPoint && hoveredCurve !== null && (() => {
          const tooltipWidth = 140;
          const tooltipHeight = 55;
          const pointX = scaleX(hoverPoint.x);
          const pointY = scaleY(hoverPoint.y);

          // Position tooltip to the right by default, but flip left if too close to right edge
          const tooltipX = pointX + 15 + tooltipWidth > width - padding
            ? pointX - tooltipWidth - 15
            : pointX + 15;

          // Position tooltip above the point, but flip below if too close to top edge
          const tooltipY = pointY - 60 < padding
            ? pointY + 15
            : pointY - 60;

          const textX = tooltipX + 10;
          const textYBase = tooltipY + 20;

          return (
            <>
              {/* Hover point circle */}
              <circle
                cx={pointX}
                cy={pointY}
                r="5"
                fill={curves[hoveredCurve].color}
                stroke="#fff"
                strokeWidth="2"
              />

              {/* Tooltip background */}
              <rect
                x={tooltipX}
                y={tooltipY}
                width={tooltipWidth}
                height={tooltipHeight}
                fill="rgba(0, 0, 0, 0.85)"
                stroke="#fff"
                strokeWidth="1"
                rx="4"
              />

              {/* Tooltip text */}
              <text
                x={textX}
                y={textYBase}
                fill="#fff"
                fontSize="12"
                fontWeight="bold"
              >
                A = {curves[hoveredCurve].A}
              </text>
              <text
                x={textX}
                y={textYBase + 15}
                fill="#fff"
                fontSize="11"
              >
                Token A: {hoverPoint.x.toFixed(2)}
              </text>
              <text
                x={textX}
                y={textYBase + 30}
                fill="#fff"
                fontSize="11"
              >
                Token B: {hoverPoint.y.toFixed(2)}
              </text>
            </>
          );
        })()}
      </svg>

      <div className="curve-legend">
        {curves.map((curve, idx) => (
          <div
            key={curve.A}
            className={`legend-item legend-item-clickable ${!visibleCurves[idx] ? 'legend-item-disabled' : ''}`}
            onClick={() => toggleCurve(idx)}
            title={`Click to ${visibleCurves[idx] ? 'hide' : 'show'} curve`}
          >
            <span className="legend-line" style={{ backgroundColor: curve.color }}></span>
            <span>A = {curve.A}</span>
          </div>
        ))}
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: "#667eea" }}></span>
          <span>Current Pool</span>
        </div>
      </div>
    </div>
  );
};
