export interface PoolState {
  balanceA: number;
  balanceB: number;
  amplificationFactor: number;
  swapFee: number; // as percentage, e.g., 0.3 for 0.3%
  rateA: number; // rate provider rate for token A, default 1.0
  rateB: number; // rate provider rate for token B, default 1.0
}

export interface SwapState {
  direction: 'AtoB' | 'BtoA';
  amountIn: number;
  amountOut: number;
  effectivePrice: number;
  priceImpact: number;
}

export type SwapDirection = 'AtoB' | 'BtoA';
