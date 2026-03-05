import React from "react";
import { PoolState } from "../types";

interface PoolParametersProps {
  poolState: PoolState;
  onPoolStateChange: (poolState: PoolState) => void;
  showUnderlyingPrice: boolean;
  onShowUnderlyingPriceChange: (show: boolean) => void;
}

export const PoolParameters: React.FC<PoolParametersProps> = ({
  poolState,
  onPoolStateChange,
  showUnderlyingPrice,
  onShowUnderlyingPriceChange,
}) => {
  const handleChange = (field: keyof PoolState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    onPoolStateChange({
      ...poolState,
      [field]: value,
    });
  };

  return (
    <div className="pool-parameters">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0 }}>Pool Parameters</h2>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showUnderlyingPrice}
            onChange={(e) => onShowUnderlyingPriceChange(e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          <span>Price in Underlying (WETH)</span>
        </label>
      </div>
      <div className="input-grid">
        <div className="token-input-group">
          <div className="input-group">
            <span className="help-text">&nbsp;</span>
            <label htmlFor="balanceA">Token A Balance:</label>
            <input
              id="balanceA"
              type="number"
              min="0"
              step="any"
              value={poolState.balanceA}
              onChange={handleChange("balanceA")}
              placeholder="Enter balance"
            />
          </div>
          <div className="input-group">
            <label htmlFor="rateA">
              <span className="help-text">Rate provider rate, default 1.0</span>
            </label>
            <input
              id="rateA"
              type="number"
              min="0"
              step="any"
              value={poolState.rateA}
              onChange={handleChange("rateA")}
              placeholder="e.g., 1.0"
            />
          </div>
          <div className="live-balance">
            Live balance: <strong>{(poolState.balanceA * poolState.rateA).toLocaleString(undefined, { maximumFractionDigits: 6 })}</strong>
          </div>
        </div>

        <div className="token-input-group">
          <div className="input-group">
            <span className="help-text">&nbsp;</span>
            <label htmlFor="balanceB">Token B Balance:</label>
            <input
              id="balanceB"
              type="number"
              min="0"
              step="any"
              value={poolState.balanceB}
              onChange={handleChange("balanceB")}
              placeholder="Enter balance"
            />
          </div>
          <div className="input-group">
            <label htmlFor="rateB">
              <span className="help-text">Rate provider rate, default 1.0</span>
            </label>
            <input
              id="rateB"
              type="number"
              min="0"
              step="any"
              value={poolState.rateB}
              onChange={handleChange("rateB")}
              placeholder="e.g., 1.0"
            />
          </div>
          <div className="live-balance">
            Live balance: <strong>{(poolState.balanceB * poolState.rateB).toLocaleString(undefined, { maximumFractionDigits: 6 })}</strong>
          </div>
        </div>

        <div className="input-group">
          <span className="help-text">&nbsp;</span>
          <label htmlFor="amplificationFactor">Amplification Factor (A):</label>
          <input
            id="amplificationFactor"
            type="number"
            min="1"
            step="any"
            value={poolState.amplificationFactor}
            onChange={handleChange("amplificationFactor")}
            placeholder="e.g., 100"
          />
          <span className="help-text">Higher A = more stable pricing</span>
        </div>

        <div className="input-group">
          <span className="help-text">&nbsp;</span>
          <label htmlFor="swapFee">Swap Fee (%):</label>
          <input
            id="swapFee"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={poolState.swapFee}
            onChange={handleChange("swapFee")}
            placeholder="e.g., 0.05"
          />
          <span className="help-text">e.g., 0.05 for 0.05%</span>
        </div>
      </div>
    </div>
  );
};
