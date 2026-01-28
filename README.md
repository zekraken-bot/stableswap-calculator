# StableSwap Calculator

A React application that implements the StableSwap AMM formula to calculate swap amounts and price impact for two-token pools.

**Math Implementation**: Based on Balancer's battle-tested StableMath library, ensuring accuracy and reliability.

## Features

- **Pool Parameters Configuration**: Set token balances, amplification factor (A), and swap fees
- **Price Impact Visualization**: Interactive bar chart showing price impact at 6 different swap sizes (0.5%, 1%, 2%, 3%, 4%, 5% of pool liquidity)
  - Color-coded bars (green: favorable/low, yellow: moderate, red: high impact)
  - Displays resulting pool balances with percentage breakdowns
  - High precision impact percentages (4 decimal places)
  - Always visible for quick pool analysis
- **Price Curve Visualization**: Interactive bonding curve chart comparing different amplification factors
  - Shows curves for A values: 50, 200, 500, 1000, 5000
  - All curves use the same invariant D (from current pool state)
  - Hover over curves to see exact token balances at any point
  - Click legend items to show/hide specific curves
  - Visual highlighting of hovered curves
- **Optional Swap Calculator**: Toggle button to show/hide detailed swap interface
- **Bidirectional Swaps**: Easy toggle between Token A → B and Token B → A
- **Real-time Calculations**: Automatic updates as you adjust inputs
- **Detailed Results**:
  - Output amount received
  - Effective exchange rate
  - Price impact with color-coded warnings
  - Pool state comparison (before/after)

## StableSwap Formula

This calculator implements the StableSwap invariant formula:

```
An^n * Σxi + D = ADn^n + D^(n+1)/(n^n * Πxi)
```

For two tokens (n=2):
```
4A(x + y) + D = 4AD + D³/(4xy)
```

Where:
- `A` = Amplification coefficient
- `x, y` = Token balances
- `D` = Invariant (constant sum)

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation

```bash
cd stableswap-calculator
npm install
```

### Running the App

```bash
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173)

### Building for Production

```bash
npm run build
npm run preview
```

## Usage

1. **Set Pool Parameters**:
   - Enter Token A and Token B balances
   - Set the Amplification Factor (A)
     - Higher A (e.g., 100) = more stable 1:1 pricing (like Curve)
     - Lower A (e.g., 1) = more like Uniswap constant product
   - Set the swap fee percentage (e.g., 0.05 for 0.05%)

2. **Analyze Price Impact** (Always Visible):
   - View the interactive bar chart showing price impact at different swap sizes
   - Each bar represents a swap size as % of total pool liquidity (0.5%, 1%, 2%, 3%, 4%, 5%)
   - Hover over bars for detailed swap information
   - Check resulting pool balances and token distribution percentages
   - Color indicators:
     - 🟢 Green: Favorable rate or low impact
     - 🟡 Yellow: Moderate slippage (0.1-1%)
     - 🔴 Red: High slippage (>1%)

3. **Explore Price Curves** (Always Visible):
   - View bonding curves for different amplification factors (A = 50, 200, 500, 1000, 5000)
   - All curves maintain the same invariant D from your current pool
   - Hover over any curve to see exact Token A and Token B balances at that point
   - Click A values in the legend to show/hide specific curves
   - Current pool position marked with a blue dot (●)
   - Compare how different A values would affect the same pool

4. **Calculate Specific Swaps** (Optional):
   - Click "Show Swap Calculator" to access the detailed swap tool
   - Click the direction button to toggle between A→B or B→A
   - Enter the amount you want to swap
   - View detailed results:
     - Output amount you'll receive
     - Effective exchange rate
     - Precise price impact
     - Pool state comparison (before/after)

## Test Scenarios

Based on the StableSwap paper, try these scenarios:

### Balanced Pool (Low Slippage)
- Token A: 25
- Token B: 25
- Amplification: 4
- Result: Very low price impact even for larger swaps

### Unbalanced Pool (Higher Slippage)
- Token A: 3
- Token B: 50
- Amplification: 3
- Result: Higher price impact due to imbalance

### High Amplification (Stable Pairs)
- Token A: 100
- Token B: 100
- Amplification: 100
- Result: Nearly 1:1 pricing, ideal for stablecoins

### Low Amplification (Uniswap-like)
- Token A: 100
- Token B: 100
- Amplification: 1
- Result: Behaves more like constant product (x*y=k)

## Technical Details

### Implementation

- **React + TypeScript**: Type-safe component architecture
- **Vite**: Fast build tooling and dev server
- **Balancer StableMath**: Ported from Balancer's production-tested implementation
- **Newton's Method**: Iterative calculation for solving the invariant D
- **BigNumber.js**: High-precision arithmetic for 18-decimal scaling
- **Native BigInt**: Arbitrary precision calculations matching on-chain behavior
- **AMP_PRECISION**: Uses 1000 precision factor for amplification calculations
- **Amplification Parameter**: Internally uses A * AMP_PRECISION

### File Structure

```
src/
├── components/
│   ├── PoolParameters.tsx     # Pool configuration inputs
│   ├── PriceImpactChart.tsx   # Interactive price impact visualization
│   ├── PriceCurveChart.tsx    # Bonding curve comparison chart
│   ├── SwapPanel.tsx          # Swap direction and amount
│   └── ResultsDisplay.tsx     # Results with price impact
├── utils/
│   └── stableswap.ts          # Core StableSwap calculations
├── types.ts                   # TypeScript interfaces
├── App.tsx                    # Main application
└── App.css                    # Styling
```

## License

MIT
