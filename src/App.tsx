import { useState, useEffect } from 'react';
import { PoolParameters } from './components/PoolParameters';
import { SwapPanel } from './components/SwapPanel';
import { ResultsDisplay } from './components/ResultsDisplay';
import { PriceImpactChart } from './components/PriceImpactChart';
import { PriceCurveChart } from './components/PriceCurveChart';
import { PoolState, SwapState, SwapDirection } from './types';
import {
  getSwapAmount,
  calculatePriceImpact,
  calculateEffectivePrice,
} from './utils/stableswap';
import './App.css';

function App() {
  const [poolState, setPoolState] = useState<PoolState>({
    balanceA: 100,
    balanceB: 100,
    amplificationFactor: 100,
    swapFee: 0.05,
    rateA: 1,
    rateB: 1,
  });

  const [direction, setDirection] = useState<SwapDirection>('AtoB');
  const [amountIn, setAmountIn] = useState<number>(0);
  const [showSwapSection, setShowSwapSection] = useState<boolean>(false);
  const [showUnderlyingPrice, setShowUnderlyingPrice] = useState<boolean>(false);

  const [swapState, setSwapState] = useState<SwapState>({
    direction: 'AtoB',
    amountIn: 0,
    amountOut: 0,
    effectivePrice: 0,
    priceImpact: 0,
  });

  // Calculate swap results whenever inputs change
  useEffect(() => {
    if (
      amountIn <= 0 ||
      poolState.balanceA <= 0 ||
      poolState.balanceB <= 0 ||
      poolState.amplificationFactor <= 0
    ) {
      setSwapState({
        direction,
        amountIn: 0,
        amountOut: 0,
        effectivePrice: 0,
        priceImpact: 0,
      });
      return;
    }

    try {
      const balanceIn = direction === 'AtoB' ? poolState.balanceA : poolState.balanceB;
      const balanceOut = direction === 'AtoB' ? poolState.balanceB : poolState.balanceA;
      const feeDecimal = poolState.swapFee / 100;

      // Calculate output amount
      const rateIn = direction === 'AtoB' ? poolState.rateA : poolState.rateB;
      const rateOut = direction === 'AtoB' ? poolState.rateB : poolState.rateA;

      const rawAmountOut = getSwapAmount(
        amountIn,
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

      // Calculate effective price
      const effectivePrice = calculateEffectivePrice(amountIn, amountOut);

      // Price impact in live space: normalize both sides by rate so fair price = 1:1
      const priceImpact = calculatePriceImpact(amountIn * rateIn, rawAmountOut * rateOut);

      setSwapState({
        direction,
        amountIn,
        amountOut,
        effectivePrice,
        priceImpact,
      });
    } catch (error) {
      console.error('Error calculating swap:', error);
      setSwapState({
        direction,
        amountIn: 0,
        amountOut: 0,
        effectivePrice: 0,
        priceImpact: 0,
      });
    }
  }, [amountIn, direction, poolState, showUnderlyingPrice]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>StableSwap Calculator</h1>
        <p className="subtitle">
          Calculate swap amounts and price impact for StableSwap AMM pools
        </p>
      </header>

      <main className="app-main">
        <div className="card">
          <PoolParameters
            poolState={poolState}
            onPoolStateChange={setPoolState}
            showUnderlyingPrice={showUnderlyingPrice}
            onShowUnderlyingPriceChange={setShowUnderlyingPrice}
          />
        </div>

        <div className="charts-row">
          <div className="card">
            <PriceImpactChart
              poolState={poolState}
              direction={direction}
              showUnderlyingPrice={showUnderlyingPrice}
            />
          </div>

          <div className="card">
            <PriceCurveChart poolState={poolState} />
          </div>
        </div>

        <div className="toggle-section">
          <button
            className="toggle-btn"
            onClick={() => setShowSwapSection(!showSwapSection)}
          >
            {showSwapSection ? 'Hide' : 'Show'} Swap Calculator
          </button>
        </div>

        {showSwapSection && (
          <>
            <div className="card">
              <SwapPanel
                direction={direction}
                amountIn={amountIn}
                onDirectionChange={setDirection}
                onAmountChange={setAmountIn}
              />
            </div>

            <div className="card results-card">
              <ResultsDisplay swapState={swapState} poolState={poolState} />
            </div>
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>
          Based on the StableSwap invariant formula: An<sup>n</sup> ∑x<sub>i</sub> + D =
          ADn<sup>n</sup> + D<sup>n+1</sup>/(n<sup>n</sup> ∏x<sub>i</sub>)
        </p>
      </footer>
    </div>
  );
}

export default App;
