import { useState, useEffect } from 'react';
import { Plus, Trash2, Target, Trophy, Edit2, Minus, Calendar } from 'lucide-react';
import confetti from 'canvas-confetti';
import { differenceInMonths, differenceInDays, parseISO } from 'date-fns';
import './SavingsGoals.css';

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`}>
      {message}
    </div>
  );
};

const SavingsGoals = () => {
  const [goals, setGoals] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newGoal, setNewGoal] = useState({ name: '', target: '', current: '', targetDate: '' });
  const [addAmounts, setAddAmounts] = useState({});
  const [editingGoal, setEditingGoal] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchGoals();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/savings');
      const result = await response.json();
      if (result.success) {
        setGoals(result.data);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
      showToast('Failed to fetch goals', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!newGoal.name || !newGoal.target) return;
    
    const goal = { 
      id: Date.now(), 
      name: newGoal.name, 
      target: Number(newGoal.target), 
      current: Number(newGoal.current) || 0,
      targetDate: newGoal.targetDate
    };

    try {
      const response = await fetch('/api/savings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goal)
      });
      
      if (response.ok) {
        fetchGoals();
        setNewGoal({ name: '', target: '', current: '', targetDate: '' });
        setIsAdding(false);
        showToast('Goal added successfully!');
      } else {
        showToast('Failed to save goal', 'error');
      }
    } catch (error) {
      console.error('Error adding goal:', error);
      showToast('Error adding goal', 'error');
    }
  };

  const handleUpdateGoal = async (e) => {
    e.preventDefault();
    if (!editingGoal.name || !editingGoal.target) return;

    try {
      const response = await fetch(`/api/savings/${editingGoal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingGoal)
      });

      if (response.ok) {
        fetchGoals();
        setEditingGoal(null);
        showToast('Goal updated successfully!');
      } else {
        showToast('Failed to update goal', 'error');
      }
    } catch (error) {
      showToast('Error updating goal', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this goal?')) return;
    try {
      const response = await fetch(`/api/savings/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchGoals();
        showToast('Goal deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
      showToast('Error deleting goal', 'error');
    }
  };

  const updateProgress = async (id, amount) => {
    if (!amount || isNaN(amount)) return;
    
    const goal = goals.find(g => g.id === id);
    if (!goal) return;

    const newCurrent = Math.min(goal.target, Math.max(0, goal.current + amount));
    
    try {
      const response = await fetch(`/api/savings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...goal, current: newCurrent })
      });
      if (response.ok) {
        fetchGoals();
        setAddAmounts(prev => ({ ...prev, [id]: '' }));
        showToast(amount > 0 ? 'Savings added!' : 'Amount withdrawn!');
        
        if (newCurrent >= goal.target && goal.current < goal.target) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
          showToast('Goal Reached! 🎉');
        }
      }
    } catch (error) {
      console.error('Error updating goal:', error);
      showToast('Error updating progress', 'error');
    }
  };

  const getProgressColor = (percent) => {
    if (percent >= 100) return '#15803d'; // Darker Green
    if (percent >= 75) return '#4ade80'; // Light Green
    if (percent >= 50) return '#facc15'; // Yellow
    if (percent >= 25) return '#fb923c'; // Orange
    return '#ef4444'; // Red
  };

  const getInsight = (goal) => {
    if (!goal.targetDate || goal.current >= goal.target) return null;
    
    const target = parseISO(goal.targetDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Normalize to midnight
    
    const daysLeft = differenceInDays(target, now);
    
    if (daysLeft < 0) return 'Target date passed';
    if (daysLeft === 0) return 'Goal due today!';
    
    const remaining = goal.target - goal.current;

    if (daysLeft <= 45) { // Show daily for short term (< 1.5 months)
         const daily = Math.ceil(remaining / daysLeft);
         return `Save ₹${daily}/day to reach by ${target.toLocaleDateString()}`;
    }
    
    // For longer term, show monthly
    // We use floating point months for calculation to be accurate on "rate"
    const months = daysLeft / 30.44;
    const monthly = Math.ceil(remaining / months);
    
    return `Save ₹${monthly}/mo to reach by ${target.toLocaleDateString()}`;
  };

  if (loading) return <div className="loading-goals">Loading savings goals...</div>;

  return (
    <div className="goals-section">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="goals-header">
        <div className="goals-title">
          <Target size={20} className="text-primary" />
          <h2>Savings Goals</h2>
        </div>
        <button 
          className="add-goal-btn"
          onClick={() => setIsAdding(!isAdding)}
        >
          <Plus size={16} />
          {isAdding ? 'Cancel' : 'Add Goal'}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddGoal} className="add-goal-form">
          <input
            type="text"
            placeholder="Goal Name (e.g. New Laptop)"
            value={newGoal.name}
            onChange={e => setNewGoal({...newGoal, name: e.target.value})}
            className="goal-input"
            required
          />
          <div className="input-row">
            <input
              type="number"
              placeholder="Target Amount"
              value={newGoal.target}
              onChange={e => setNewGoal({...newGoal, target: e.target.value})}
              className="goal-input"
              required
            />
            <input
              type="date"
              value={newGoal.targetDate}
              onChange={e => setNewGoal({...newGoal, targetDate: e.target.value})}
              className="goal-input"
            />
          </div>
          <input
            type="number"
            placeholder="Current Savings"
            value={newGoal.current}
            onChange={e => setNewGoal({...newGoal, current: e.target.value})}
            className="goal-input"
          />
          <button type="submit" className="save-goal-btn">Save Goal</button>
        </form>
      )}

      {editingGoal && (
        <div className="modal-overlay">
          <form onSubmit={handleUpdateGoal} className="edit-goal-form">
            <h3>Edit Goal</h3>
            <input
              type="text"
              value={editingGoal.name}
              onChange={e => setEditingGoal({...editingGoal, name: e.target.value})}
              className="goal-input"
              required
            />
            <input
              type="number"
              value={editingGoal.target}
              onChange={e => setEditingGoal({...editingGoal, target: e.target.value})}
              className="goal-input"
              required
            />
            <input
              type="date"
              value={editingGoal.targetDate || ''}
              onChange={e => setEditingGoal({...editingGoal, targetDate: e.target.value})}
              className="goal-input"
            />
            <div className="modal-actions">
              <button type="button" onClick={() => setEditingGoal(null)} className="cancel-btn">Cancel</button>
              <button type="submit" className="save-goal-btn">Update</button>
            </div>
          </form>
        </div>
      )}

      <div className="goals-grid">
        {goals.length > 0 ? (
          goals.map(goal => {
            const percent = Math.min(100, (goal.current / goal.target) * 100);
            const color = getProgressColor(percent);
            const insight = getInsight(goal);

            return (
              <div key={goal.id} className="goal-card">
                <div className="goal-info">
                  <h3>{goal.name}</h3>
                  <div className="goal-actions-top">
                    <button onClick={() => setEditingGoal(goal)} className="icon-btn">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(goal.id)} className="icon-btn delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                
                <div className="goal-progress-ring" style={{ '--percent': percent, '--color': color }}>
                  <svg viewBox="0 0 36 36" className="circular-chart">
                    <path className="circle-bg"
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path className="circle"
                      strokeDasharray={`${percent}, 100`}
                      stroke={color}
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <text x="18" y="20.35" className="percentage">{Math.round(percent)}%</text>
                  </svg>
                </div>

                <div className="goal-details">
                  <span className="amount">₹{goal.current} / ₹{goal.target}</span>
                  {goal.targetDate && (
                    <span className="target-date">
                      <Calendar size={12} />
                      {new Date(goal.targetDate).toLocaleDateString()}
                    </span>
                  )}
                  {insight && <div className="insight-badge">{insight}</div>}
                </div>

                <div className="goal-actions custom-amount">
                  <input 
                    type="number" 
                    placeholder="Amount" 
                    value={addAmounts[goal.id] || ''}
                    onChange={(e) => setAddAmounts(prev => ({ ...prev, [goal.id]: e.target.value }))}
                    className="amount-input"
                  />
                  <div className="action-buttons">
                    <button 
                      onClick={() => updateProgress(goal.id, Number(addAmounts[goal.id]))}
                      className="add-btn"
                      title="Add Savings"
                    >
                      <Plus size={16} />
                    </button>
                    <button 
                      onClick={() => updateProgress(goal.id, -Number(addAmounts[goal.id]))}
                      className="withdraw-btn"
                      title="Withdraw"
                    >
                      <Minus size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="no-goals">
            <Trophy size={48} strokeWidth={1} />
            <p>Set a goal to start saving!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavingsGoals;
