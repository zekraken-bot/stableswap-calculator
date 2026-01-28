import React from 'react';
import { PoolState } from '../types';

interface PoolParametersProps {
  poolState: PoolState;
  onPoolStateChange: (poolState: PoolState) => void;
}

export const PoolParameters: React.FC<PoolParametersProps> = ({
  poolState,
  onPoolStateChange,
}) => {
  const handleChange = (field: keyof PoolState) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseFloat(e.target.value) || 0;
    onPoolStateChange({
      ...poolState,
      [field]: value,
    });
  };

  return (
    <div className="pool-parameters">
      <h2>Pool Parameters</h2>
      <div className="input-grid">
        <div className="input-group">
          <label htmlFor="balanceA" style={{ marginTop: '1.5rem' }}>Token A Balance:</label>
          <input
            id="balanceA"
            type="number"
            min="0"
            step="any"
            value={poolState.balanceA}
            onChange={handleChange('balanceA')}
            placeholder="Enter balance"
          />
        </div>

        <div className="input-group">
          <label htmlFor="balanceB" style={{ marginTop: '1.5rem' }}>Token B Balance:</label>
          <input
            id="balanceB"
            type="number"
            min="0"
            step="any"
            value={poolState.balanceB}
            onChange={handleChange('balanceB')}
            placeholder="Enter balance"
          />
        </div>

        <div className="input-group">
          <label htmlFor="amplificationFactor">
            Amplification Factor (A):
            <span className="help-text">Higher A = more stable pricing</span>
          </label>
          <input
            id="amplificationFactor"
            type="number"
            min="1"
            step="any"
            value={poolState.amplificationFactor}
            onChange={handleChange('amplificationFactor')}
            placeholder="e.g., 100"
          />
        </div>

        <div className="input-group">
          <label htmlFor="swapFee">
            Swap Fee (%):
            <span className="help-text">e.g., 0.05 for 0.05%</span>
          </label>
          <input
            id="swapFee"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={poolState.swapFee}
            onChange={handleChange('swapFee')}
            placeholder="e.g., 0.05"
          />
        </div>
      </div>
    </div>
  );
};
