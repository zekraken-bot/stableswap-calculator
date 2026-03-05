/**
 * StableSwap AMM Calculator
 * Based on Balancer's StableMath implementation
 * Ported from working bigint implementation
 */

import BigNumber from 'bignumber.js';

const MAX_ITERATIONS = 255;
const AMP_PRECISION = 1000n;

// Configure BigNumber for high precision
BigNumber.config({
  EXPONENTIAL_AT: [-100, 100],
  ROUNDING_MODE: BigNumber.ROUND_DOWN,
  DECIMAL_PLACES: 40,
});

/**
 * Compute the invariant D using Newton's method
 * Ported directly from working implementation
 */
function _computeInvariant(amplificationParameter: bigint, balances: bigint[]): bigint {
  let sum = 0n;
  const numTokens = balances.length;

  for (let i = 0; i < numTokens; i++) {
    sum = sum + balances[i];
  }

  if (sum === 0n) {
    return 0n;
  }

  let prevInvariant: bigint;
  let invariant = sum;
  const ampTimesTotal = amplificationParameter * BigInt(numTokens);

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    let D_P = invariant;
    for (let j = 0; j < numTokens; ++j) {
      D_P = (D_P * invariant) / (balances[j] * BigInt(numTokens));
    }

    prevInvariant = invariant;

    invariant =
      (((ampTimesTotal * sum) / AMP_PRECISION + D_P * BigInt(numTokens)) * invariant) /
      (((ampTimesTotal - AMP_PRECISION) * invariant) / AMP_PRECISION +
        (BigInt(numTokens) + 1n) * D_P);

    if (invariant > prevInvariant) {
      if (invariant - prevInvariant <= 1) {
        return invariant;
      }
    } else if (prevInvariant - invariant <= 1) {
      return invariant;
    }
  }

  throw new Error('StableInvariantDidntConverge');
}

/**
 * Compute token balance given invariant and all other balances
 * Ported directly from working implementation
 */
function _computeBalance(
  amplificationParameter: bigint,
  balances: bigint[],
  invariant: bigint,
  tokenIndex: number
): bigint {
  const numTokens = balances.length;
  const ampTimesTotal = amplificationParameter * BigInt(numTokens);

  let sum = balances[0];
  let P_D = balances[0] * BigInt(numTokens);

  for (let j = 1; j < numTokens; ++j) {
    P_D = (P_D * balances[j] * BigInt(numTokens)) / invariant;
    sum = sum + balances[j];
  }
  sum = sum - balances[tokenIndex];

  const inv2 = invariant * invariant;
  // divUp implementation: (a-1)/b + 1
  const c = ((inv2 * AMP_PRECISION - 1n) / (ampTimesTotal * P_D) + 1n) * balances[tokenIndex];
  const b = sum + (invariant * AMP_PRECISION) / ampTimesTotal;

  let prevTokenBalance = 0n;
  // divUp for initial guess
  let tokenBalance = (inv2 + c - 1n) / (invariant + b) + 1n;

  for (let i = 0; i < MAX_ITERATIONS; ++i) {
    prevTokenBalance = tokenBalance;

    // divUp for iteration
    tokenBalance = (tokenBalance * tokenBalance + c - 1n) / (tokenBalance * 2n + b - invariant) + 1n;

    if (tokenBalance > prevTokenBalance) {
      if (tokenBalance - prevTokenBalance <= 1) {
        return tokenBalance;
      }
    } else if (prevTokenBalance - tokenBalance <= 1) {
      return tokenBalance;
    }
  }

  throw new Error('StableGetBalanceDidntConverge');
}

/**
 * Compute output amount given exact input
 * Ported directly from working implementation
 */
function _computeOutGivenExactIn(
  amplificationParameter: bigint,
  balances: bigint[],
  tokenIndexIn: number,
  tokenIndexOut: number,
  tokenAmountIn: bigint,
  invariant: bigint
): bigint {
  balances[tokenIndexIn] += tokenAmountIn;

  const finalBalanceOut = _computeBalance(
    amplificationParameter,
    balances,
    invariant,
    tokenIndexOut
  );

  balances[tokenIndexIn] -= tokenAmountIn;

  return balances[tokenIndexOut] - finalBalanceOut - 1n;
}

/**
 * Calculate the output amount for a swap
 * Matches the pattern from working Balancer V3 implementation
 * Rates scale the balances: rateAdjustedBalance = balance * rate
 * Output is converted back: actualAmountOut = rateAdjustedAmountOut / rateOut
 */
export function getSwapAmount(
  amountIn: number,
  balanceIn: number,
  balanceOut: number,
  A: number,
  fee: number,
  rateIn: number = 1,
  rateOut: number = 1
): number {
  if (amountIn <= 0) {
    return 0;
  }

  if (balanceIn <= 0 || balanceOut <= 0) {
    throw new Error('Pool balances must be greater than 0');
  }

  const effectiveRateIn = rateIn > 0 ? rateIn : 1;
  const effectiveRateOut = rateOut > 0 ? rateOut : 1;

  // Matches Balancer V3 Vault swap flow:
  // 1. Balances: raw * rate = live balances (rate-adjusted)
  // 2. amountIn: raw * rate = scaled amount (enters live-balance space)
  // 3. amountOut: math result / rate = raw tokens out
  const rateAdjustedBalanceIn = balanceIn * effectiveRateIn;
  const rateAdjustedBalanceOut = balanceOut * effectiveRateOut;
  const rateAdjustedAmountIn = amountIn * effectiveRateIn;

  // Scale to 18 decimals using BigNumber to avoid floating point errors
  const SCALE_18 = new BigNumber(10).pow(18);

  const amountInScaled18 = BigInt(new BigNumber(rateAdjustedAmountIn).times(SCALE_18).toFixed(0));
  const balanceInScaled18 = BigInt(new BigNumber(rateAdjustedBalanceIn).times(SCALE_18).toFixed(0));
  const balanceOutScaled18 = BigInt(new BigNumber(rateAdjustedBalanceOut).times(SCALE_18).toFixed(0));

  // A must be multiplied by AMP_PRECISION (1000)
  const amplificationParameter = BigInt(A) * AMP_PRECISION;

  const balances = [balanceInScaled18, balanceOutScaled18];

  // Calculate invariant D before swap
  const invariant = _computeInvariant(amplificationParameter, balances);

  // Calculate output amount in rate-adjusted space
  const amountOutScaled18 = _computeOutGivenExactIn(
    amplificationParameter,
    balances,
    0, // tokenIndexIn
    1, // tokenIndexOut
    amountInScaled18,
    invariant
  );

  // Scale back to normal decimals (still in rate-adjusted space)
  const rateAdjustedAmountOut = Number(amountOutScaled18) / Number(SCALE_18);

  // Convert from rate-adjusted back to actual token B amount
  const amountOutBeforeFee = rateAdjustedAmountOut / effectiveRateOut;

  // Apply swap fee
  const amountOutAfterFee = amountOutBeforeFee * (1 - fee);

  return amountOutAfterFee > 0 ? amountOutAfterFee : 0;
}

/**
 * Calculate the price impact of a swap
 * Positive = favorable (getting more than 1:1)
 * Negative = unfavorable (getting less than 1:1)
 */
export function calculatePriceImpact(
  amountIn: number,
  amountOut: number
): number {
  if (amountIn === 0 || amountOut === 0) {
    return 0;
  }

  const expectedPrice = 1;
  const actualPrice = amountOut / amountIn;
  // Flip the sign: positive when getting more, negative when getting less
  const priceImpact = ((actualPrice - expectedPrice) / expectedPrice) * 100;

  return priceImpact;
}

/**
 * Calculate the effective exchange rate
 */
export function calculateEffectivePrice(amountIn: number, amountOut: number): number {
  if (amountIn === 0) {
    return 0;
  }
  return amountOut / amountIn;
}
