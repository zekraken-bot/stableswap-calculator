import React from 'react';
import { SwapState, PoolState } from '../types';

interface ResultsDisplayProps {
  swapState: SwapState;
  poolState: PoolState;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  swapState,
  poolState,
}) => {
  const { direction, amountIn, amountOut, effectivePrice, priceImpact } = swapState;

  const getPriceImpactColor = (impact: number): string => {
    const absImpact = Math.abs(impact);
    if (absImpact < 0.1) return 'green';
    // Positive impact (favorable) = green, negative (unfavorable) = yellow/red
    if (absImpact < 1) return impact > 0 ? 'green' : 'yellow';
    return impact > 0 ? 'green' : 'red';
  };

  const formatNumber = (num: number, decimals: number = 6): string => {
    if (num === 0) return '0';
    return num.toFixed(decimals);
  };

  // Calculate new pool state after swap
  const getNewPoolState = () => {
    if (direction === 'AtoB') {
      return {
        balanceA: poolState.balanceA + amountIn * (1 - poolState.swapFee / 100),
        balanceB: poolState.balanceB - amountOut,
      };
    } else {
      return {
        balanceA: poolState.balanceA - amountOut,
        balanceB: poolState.balanceB + amountIn * (1 - poolState.swapFee / 100),
      };
    }
  };

  const newPoolState = getNewPoolState();

  return (
    <div className="results-display">
      <h2>Results</h2>

      {amountIn > 0 ? (
        <div className="results-grid">
          <div className="result-card">
            <div className="result-label">You will receive:</div>
            <div className="result-value large">
              {formatNumber(amountOut)} {direction === 'AtoB' ? 'Token B' : 'Token A'}
            </div>
          </div>

          <div className="result-card">
            <div className="result-label">Effective Price:</div>
            <div className="result-value">
              1 {direction === 'AtoB' ? 'Token A' : 'Token B'} ={' '}
              {formatNumber(effectivePrice, 8)} {direction === 'AtoB' ? 'Token B' : 'Token A'}
            </div>
          </div>

          <div className="result-card">
            <div className="result-label">Price Impact:</div>
            <div className={`result-value impact-${getPriceImpactColor(priceImpact)}`}>
              {formatNumber(priceImpact, 4)}%
            </div>
            <div className="impact-description">
              {Math.abs(priceImpact) < 0.1 && '✓ Excellent - Very low slippage'}
              {Math.abs(priceImpact) >= 0.1 && Math.abs(priceImpact) < 1 && priceImpact > 0 && '✓ Favorable rate'}
              {Math.abs(priceImpact) >= 0.1 && Math.abs(priceImpact) < 1 && priceImpact < 0 && '⚠ Moderate slippage'}
              {Math.abs(priceImpact) >= 1 && priceImpact < 0 && '⚠ High slippage'}
              {priceImpact >= 1 && '✓ Very favorable rate'}
            </div>
          </div>

          <div className="result-card pool-state">
            <div className="result-label">Pool State:</div>
            <div className="pool-comparison">
              <div className="pool-before">
                <div className="state-title">Before:</div>
                <div>Token A: {formatNumber(poolState.balanceA, 2)}</div>
                <div>Token B: {formatNumber(poolState.balanceB, 2)}</div>
              </div>
              <div className="arrow">→</div>
              <div className="pool-after">
                <div className="state-title">After:</div>
                <div>Token A: {formatNumber(newPoolState.balanceA, 2)}</div>
                <div>Token B: {formatNumber(newPoolState.balanceB, 2)}</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="no-results">
          <p>Enter a swap amount to see results</p>
        </div>
      )}
    </div>
  );
};
