import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import '../App.css';
import './AddTransaction.css';

function AddTransaction() {
  const [formData, setFormData] = useState({
    type: 'Expense',
    category: '',
    description: '',
    amount: '',
    paymentMode: 'UPI',
    date: new Date().toISOString().split('T')[0],
    remarks: ''
  });

  const [status, setStatus] = useState({ type: '', message: '' });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/expenses');
      const result = await response.json();
      if (result.success) {
        // Sort by date descending and take top 10
        const sorted = result.data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setRecentTransactions(sorted);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;

    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        // If response is not JSON (likely an error page), throw text
        const text = await response.text();
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        fetchTransactions(); // Refresh list
        setStatus({ type: 'success', message: 'Transaction deleted successfully' });
        setTimeout(() => setStatus({ type: '', message: '' }), 3000);
      } else {
        setStatus({ type: 'error', message: 'Failed to delete: ' + result.message });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Error: ' + error.message });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: 'loading', message: 'Submitting...' });
    
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setStatus({ type: 'success', message: 'Transaction added successfully!' });
        setFormData({
          type: 'Expense',
          category: '',
          description: '',
          amount: '',
          paymentMode: 'UPI',
          date: new Date().toISOString().split('T')[0],
          remarks: ''
        });
        fetchTransactions(); // Refresh list
        setTimeout(() => setStatus({ type: '', message: '' }), 3000);
      } else {
        setStatus({ type: 'error', message: 'Error: ' + result.message });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Error: ' + error.message });
    }
  };

  return (
    <div className="manage-container">
      <div className="container">
        <h1>Manage Transactions</h1>
        <form onSubmit={handleSubmit} className="expense-form">
          <div className="form-row">
            <div className="form-group">
              <label>Type</label>
              <select name="type" value={formData.type} onChange={handleChange}>
                <option value="Expense">Expense</option>
                <option value="Income">Income</option>
              </select>
            </div>

            <div className="form-group">
              <label>Date</label>
              <input 
                type="date" 
                name="date" 
                value={formData.date} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label>Category</label>
            <input 
              type="text" 
              name="category" 
              value={formData.category} 
              onChange={handleChange} 
              placeholder="e.g. Food, Rent, Salary"
              required 
              list="categories"
            />
            <datalist id="categories">
              <option value="Food" />
              <option value="Travel" />
              <option value="Rent" />
              <option value="Utilities" />
              <option value="Salary" />
              <option value="Shopping" />
            </datalist>
          </div>

          <div className="form-group">
            <label>Description</label>
            <input 
              type="text" 
              name="description" 
              value={formData.description} 
              onChange={handleChange} 
              placeholder={formData.type === 'Income' ? "Optional" : "Details"}
              required={formData.type === 'Expense'}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Amount (₹)</label>
              <input 
                type="number" 
                name="amount" 
                value={formData.amount} 
                onChange={handleChange} 
                placeholder="0.00"
                required 
              />
            </div>

            <div className="form-group">
              <label>Payment Mode</label>
              <select name="paymentMode" value={formData.paymentMode} onChange={handleChange}>
                <option value="UPI">UPI</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Cash">Cash</option>
                <option value="Net Banking">Net Banking</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Remarks</label>
            <input 
              type="text" 
              name="remarks" 
              value={formData.remarks} 
              onChange={handleChange} 
              placeholder="Optional"
            />
          </div>

          <button type="submit" className="submit-btn" disabled={status.type === 'loading'}>
            {status.type === 'loading' ? 'Adding...' : 'Add Transaction'}
          </button>
        </form>
        {status.message && (
          <p className={`status-message ${status.type}`}>
            {status.message}
          </p>
        )}
      </div>

      <div className="recent-list-container">
        <h2>Recent Transactions</h2>
        <div className="recent-list">
          {loading ? (
            <p className="loading-text">Loading transactions...</p>
          ) : recentTransactions.length > 0 ? (
            recentTransactions.map((t) => (
              <div key={t.id} className="recent-item">
                <div className="recent-details">
                  <div className="recent-row-top">
                    <span className="recent-category">{t.category}</span>
                    <span className={`recent-amount ${t.type.toLowerCase()}`}>
                      {t.type === 'Income' ? '+' : '-'}₹{t.amount}
                    </span>
                  </div>
                  <div className="recent-row-bottom">
                    <span className="recent-description">{t.description || '-'}</span>
                    <div className="recent-meta-group">
                      <span className="recent-payment">{t.paymentMode}</span>
                      <span className="recent-separator">•</span>
                      <span className="recent-date">{t.date}</span>
                    </div>
                  </div>
                </div>
                <button 
                  className="delete-btn" 
                  onClick={() => handleDelete(t.id)}
                  aria-label="Delete transaction"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          ) : (
            <p className="no-data">No transactions found</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AddTransaction;
