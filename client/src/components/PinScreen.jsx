import React, { useState } from 'react';
import './PinScreen.css';
import { Lock } from 'lucide-react';

const PinScreen = ({ onAuthenticated }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Change this PIN to your desired passcode
    if (pin === '123456') {
      onAuthenticated();
    } else {
      setError(true);
      setPin('');
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    if (/^\d*$/.test(value) && value.length <= 6) {
      setPin(value);
      setError(false);
    }
  };

  return (
    <div className="pin-screen">
      <div className="pin-container">
        <div className="lock-icon">
          <Lock size={48} />
        </div>
        <h2>Enter Passcode</h2>
        <p>Please enter your 6-digit PIN to access the tracker.</p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={pin}
            onChange={handleChange}
            placeholder="••••••"
            className={`pin-input ${error ? 'error' : ''}`}
            autoFocus
          />
          {error && <p className="error-msg">Incorrect PIN</p>}
          <button type="submit" className="unlock-btn" disabled={pin.length !== 6}>
            Unlock
          </button>
        </form>
      </div>
    </div>
  );
};

export default PinScreen;
