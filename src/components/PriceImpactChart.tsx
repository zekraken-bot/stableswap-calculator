import React from 'react';
import { PoolState, SwapDirection } from '../types';
import { getSwapAmount, calculatePriceImpact } from '../utils/stableswap';

interface PriceImpactChartProps {
  poolState: PoolState;
  direction: SwapDirection;
  showUnderlyingPrice: boolean;
}

export const PriceImpactChart: React.FC<PriceImpactChartProps> = ({
  poolState,
  direction,
  showUnderlyingPrice,
}) => {
  // Use live (rate-adjusted) balances for liquidity scaling
  const liveBalanceA = poolState.balanceA * poolState.rateA;
  const liveBalanceB = poolState.balanceB * poolState.rateB;
  const totalLiveLiquidity = liveBalanceA + liveBalanceB;

  // Swap sizes as percentages of total live liquidity
  const swapSizes = [
    { label: '0.5%', percentage: 0.005 },
    { label: '1%', percentage: 0.01 },
    { label: '2%', percentage: 0.02 },
    { label: '3%', percentage: 0.03 },
    { label: '4%', percentage: 0.04 },
    { label: '5%', percentage: 0.05 },
  ];

  // Calculate price impact for each swap size
  const calculateImpactForSize = (percentage: number) => {
    const balanceIn = direction === 'AtoB' ? poolState.balanceA : poolState.balanceB;
    const balanceOut = direction === 'AtoB' ? poolState.balanceB : poolState.balanceA;
    const rateIn = direction === 'AtoB' ? poolState.rateA : poolState.rateB;
    const rateOut = direction === 'AtoB' ? poolState.rateB : poolState.rateA;
    const feeDecimal = poolState.swapFee / 100;

    // Swap size as a percentage of live liquidity, converted to raw input token units
    const swapAmountLive = totalLiveLiquidity * percentage;
    const swapAmount = swapAmountLive / rateIn;

    try {
      const rawAmountOut = getSwapAmount(
        swapAmount,
        balanceIn,
        balanceOut,
        poolState.amplificationFactor,
        feeDecimal,
        rateIn,
        rateOut
      );

      // Apply normalization if showing underlying (WETH) prices
      const normalizationFactor = showUnderlyingPrice
        ? (direction === 'AtoB' ? 1 / poolState.rateA : poolState.rateA)
        : 1;

      const amountOut = rawAmountOut * normalizationFactor;

      // Price impact in live space: compare (amountOut * rateOut) vs (swapAmount * rateIn)
      // This normalizes for the rate difference so fair price = 1:1 in live space
      const liveAmountOut = amountOut * rateOut;
      const liveAmountIn = swapAmount * rateIn;
      const priceImpact = calculatePriceImpact(liveAmountIn, liveAmountOut);

      // Calculate new balances after swap
      const newBalanceIn = balanceIn + swapAmount;
      const newBalanceOut = balanceOut - amountOut;
      const newTotalLiquidity = newBalanceIn + newBalanceOut;

      const newBalanceA = direction === 'AtoB' ? newBalanceIn : newBalanceOut;
      const newBalanceB = direction === 'AtoB' ? newBalanceOut : newBalanceIn;

      const percentageA = (newBalanceA / newTotalLiquidity) * 100;
      const percentageB = (newBalanceB / newTotalLiquidity) * 100;

      return {
        swapAmount,
        amountOut,
        priceImpact,
        newBalanceA,
        newBalanceB,
        percentageA,
        percentageB,
      };
    } catch (error) {
      return null;
    }
  };

  const impacts = swapSizes.map((size) => ({
    ...size,
    data: calculateImpactForSize(size.percentage),
  }));

  const getBarColor = (impact: number): string => {
    const absImpact = Math.abs(impact);
    if (absImpact < 0.1) return '#28a745'; // green
    if (impact > 0) return '#28a745'; // positive is green
    if (absImpact < 1) return '#ffc107'; // yellow
    return '#dc3545'; // red
  };

  const maxAbsImpact = Math.max(
    ...impacts
      .filter((i) => i.data !== null)
      .map((i) => Math.abs(i.data!.priceImpact))
  );

  return (
    <div className="price-impact-chart">
      <h3>Price Impact by Swap Size</h3>
      <p className="chart-subtitle">
        Based on total live liquidity: {totalLiveLiquidity.toFixed(4)} (swap sizes are % of live pool value)
      </p>

      <div className="chart-container">
        {impacts.map((impact) => {
          if (!impact.data) return null;

          const { swapAmount, amountOut, priceImpact, newBalanceA, newBalanceB, percentageA, percentageB } = impact.data;
          const barHeight = (Math.abs(priceImpact) / maxAbsImpact) * 100;
          const isPositive = priceImpact >= 0;

          return (
            <div key={impact.label} className="chart-bar-wrapper">
              <div className="chart-bar-container">
                <div className="bar-value-above">
                  {isPositive ? '+' : ''}
                  {priceImpact.toFixed(4)}%
                </div>
                <div
                  className="chart-bar"
                  style={{
                    height: `${Math.max(barHeight, 2)}%`,
                    backgroundColor: getBarColor(priceImpact),
                  }}
                  title={`Swap ${swapAmount.toFixed(2)} tokens → ${amountOut.toFixed(6)} tokens`}
                >
                </div>
              </div>
              <div className="chart-label">{impact.label}</div>
              <div className="chart-details">
                <div>In: {swapAmount.toFixed(4)}</div>
                <div>Out: {amountOut.toFixed(4)}</div>
                <div>A: {newBalanceA.toFixed(2)} ({percentageA.toFixed(2)}%)</div>
                <div>B: {newBalanceB.toFixed(2)} ({percentageB.toFixed(2)}%)</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="chart-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#28a745' }}></span>
          <span>Favorable / Low impact</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#ffc107' }}></span>
          <span>Moderate impact</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#dc3545' }}></span>
          <span>High impact</span>
        </div>
      </div>
    </div>
  );
};
