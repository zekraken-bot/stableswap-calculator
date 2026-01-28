export interface PoolState {
  balanceA: number;
  balanceB: number;
  amplificationFactor: number;
  swapFee: number; // as percentage, e.g., 0.3 for 0.3%
}

export interface SwapState {
  direction: 'AtoB' | 'BtoA';
  amountIn: number;
  amountOut: number;
  effectivePrice: number;
  priceImpact: number;
}

export type SwapDirection = 'AtoB' | 'BtoA';
