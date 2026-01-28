import React from 'react';
import { SwapDirection } from '../types';

interface SwapPanelProps {
  direction: SwapDirection;
  amountIn: number;
  onDirectionChange: (direction: SwapDirection) => void;
  onAmountChange: (amount: number) => void;
}

export const SwapPanel: React.FC<SwapPanelProps> = ({
  direction,
  amountIn,
  onDirectionChange,
  onAmountChange,
}) => {
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    onAmountChange(value);
  };

  const toggleDirection = () => {
    onDirectionChange(direction === 'AtoB' ? 'BtoA' : 'AtoB');
  };

  return (
    <div className="swap-panel">
      <h2>Swap</h2>
      <div className="swap-container">
        <div className="swap-direction">
          <button className="direction-btn" onClick={toggleDirection}>
            <div className="token-labels">
              <span className={direction === 'AtoB' ? 'active' : ''}>Token A</span>
              <span className="arrow">→</span>
              <span className={direction === 'BtoA' ? 'active' : ''}>Token B</span>
            </div>
            <div className="toggle-hint">Click to swap direction</div>
          </button>
        </div>

        <div className="input-group">
          <label htmlFor="amountIn">
            Amount to swap ({direction === 'AtoB' ? 'Token A' : 'Token B'}):
          </label>
          <input
            id="amountIn"
            type="number"
            min="0"
            step="any"
            value={amountIn}
            onChange={handleAmountChange}
            placeholder="Enter amount"
          />
        </div>
      </div>
    </div>
  );
};
