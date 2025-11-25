import React from 'react';
import SavingsGoals from '../components/SavingsGoals';
import './Savings.css';

const Savings = () => {
  return (
    <div className="savings-page-container">
      <div className="savings-header">
        <h1>Savings Goals</h1>
        <p>Track your progress towards your financial targets</p>
      </div>
      <SavingsGoals />
    </div>
  );
};

export default Savings;
