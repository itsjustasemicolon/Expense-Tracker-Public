import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Sector } from 'recharts';
import { format, parseISO, startOfMonth, isWithinInterval, startOfDay, endOfDay, subMonths } from 'date-fns';
import { Settings, TrendingUp, AlertCircle, Download, TrendingDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Dashboard.css';
import './DashboardControls.css';

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6'];

const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 8}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
    </g>
  );
};

const Dashboard = () => {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [budget, setBudget] = useState(() => {
    return Number(localStorage.getItem('monthlyBudget')) || 1500;
  });
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [newBudget, setNewBudget] = useState(budget);
  const [activeIndex, setActiveIndex] = useState(null);
  
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });

  const [sortBy, setSortBy] = useState('date');
  const [filterCategory, setFilterCategory] = useState('All');

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    filterExpensesByDateRange();
  }, [expenses, dateRange]);

  const handleSaveBudget = () => {
    localStorage.setItem('monthlyBudget', newBudget);
    setBudget(Number(newBudget));
    setIsEditingBudget(false);
  };

  const fetchExpenses = async () => {
    try {
      const response = await fetch('/api/expenses');
      const result = await response.json();
      if (result.success) {
        setExpenses(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterExpensesByDateRange = () => {
    if (!dateRange.start || !dateRange.end) return;
    
    const startDate = startOfDay(parseISO(dateRange.start));
    const endDate = endOfDay(parseISO(dateRange.end));

    const filtered = expenses.filter(expense => {
      const expenseDate = parseISO(expense.date);
      return isWithinInterval(expenseDate, { start: startDate, end: endDate });
    });

    setFilteredExpenses(filtered);
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleExport = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Expense Report', 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Date Range: ${dateRange.start} to ${dateRange.end}`, 14, 30);
    
    const tableColumn = ["Date", "Type", "Category", "Amount", "Description", "Payment Mode"];
    const tableRows = [];

    filteredExpenses.forEach(expense => {
      const expenseData = [
        format(parseISO(expense.date), 'dd MMM yyyy'),
        expense.type,
        expense.category,
        `Rs. ${expense.amount}`,
        expense.description || '-',
        expense.paymentMode
      ];
      tableRows.push(expenseData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [99, 102, 241] } // Primary color
    });

    doc.save(`expenses_${dateRange.start}_to_${dateRange.end}.pdf`);
  };

  if (loading) return <div className="loading">Loading analytics...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  // Process Data based on filteredExpenses
  const income = filteredExpenses.filter(e => e.type === 'Income').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const expense = filteredExpenses.filter(e => e.type === 'Expense').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const balance = income - expense;

  // Previous Month Comparison
  const prevStart = startOfDay(subMonths(parseISO(dateRange.start), 1));
  const prevEnd = endOfDay(subMonths(parseISO(dateRange.end), 1));
  
  const prevExpenses = expenses.filter(e => {
    const d = parseISO(e.date);
    return isWithinInterval(d, { start: prevStart, end: prevEnd }) && e.type === 'Expense';
  }).reduce((acc, curr) => acc + Number(curr.amount), 0);

  const expenseDiff = expense - prevExpenses;
  const expensePercent = prevExpenses > 0 ? ((expenseDiff / prevExpenses) * 100).toFixed(1) : 0;

  // Budget Calculations
  const budgetProgress = budget > 0 ? (expense / budget) * 100 : 0;
  const isOverBudget = expense > budget && budget > 0;
  const remainingBudget = budget - expense;

  // Category Data for Pie Chart
  const categoryData = filteredExpenses
    .filter(e => e.type === 'Expense')
    .reduce((acc, curr) => {
      const existing = acc.find(item => item.name === curr.category);
      if (existing) {
        existing.value += Number(curr.amount);
      } else {
        acc.push({ name: curr.category, value: Number(curr.amount) });
      }
      return acc;
    }, []);

  // Daily Spending Data for Line Chart
  const dailyData = filteredExpenses
    .filter(e => e.type === 'Expense')
    .reduce((acc, curr) => {
      const date = format(parseISO(curr.date), 'MMM dd');
      const existing = acc.find(item => item.date === date);
      if (existing) {
        existing.amount += Number(curr.amount);
      } else {
        acc.push({ date, amount: Number(curr.amount), fullDate: curr.date });
      }
      return acc;
    }, [])
    .sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));

  // Unique categories for filter
  const uniqueCategories = ['All', ...new Set(filteredExpenses.map(item => item.category))];

  // Process transactions for list (filter & sort)
  const transactions = [...filteredExpenses]
    .filter(item => filterCategory === 'All' || item.category === filterCategory)
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.date) - new Date(a.date);
      } else if (sortBy === 'amount') {
        return Number(b.amount) - Number(a.amount);
      }
      return 0;
    });

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Analytics</h1>
        <div className="header-actions">
          <button className="export-btn" onClick={handleExport} title="Export to CSV">
            <Download size={20} />
            <span>Export</span>
          </button>
          <div className="date-range-selector">
            <input 
              type="date" 
              name="start"
              value={dateRange.start} 
              onChange={handleDateChange} 
              className="date-input"
            />
            <span className="date-separator">to</span>
            <input 
              type="date" 
              name="end"
              value={dateRange.end} 
              onChange={handleDateChange} 
              className="date-input"
            />
          </div>
        </div>
      </div>

      {/* Budget Section */}
      <div className="budget-section">
        <div className="budget-header">
          <div className="budget-title">
            <TrendingUp size={20} className="text-primary" />
            <h2>Monthly Budget</h2>
          </div>
          <button 
            className="edit-budget-btn"
            onClick={() => setIsEditingBudget(!isEditingBudget)}
          >
            <Settings size={16} />
            {isEditingBudget ? 'Cancel' : 'Set Budget'}
          </button>
        </div>

        {isEditingBudget && (
          <div className="budget-input-container">
            <input
              type="number"
              value={newBudget}
              onChange={(e) => setNewBudget(e.target.value)}
              placeholder="Enter monthly budget"
              className="budget-input"
            />
            <button onClick={handleSaveBudget} className="save-budget-btn">Save</button>
          </div>
        )}

        {budget > 0 ? (
          <div className="budget-progress-container">
            <div className="budget-info">
              <span className="budget-spent">Spent: ₹{expense.toFixed(0)}</span>
              <span className="budget-total">Budget: ₹{budget.toFixed(0)}</span>
            </div>
            <div className="progress-bar-bg">
              <div 
                className={`progress-bar-fill ${isOverBudget ? 'over-budget' : ''}`}
                style={{ width: `${Math.min(budgetProgress, 100)}%` }}
              ></div>
            </div>
            <div className="budget-status">
              {isOverBudget ? (
                <span className="status-text danger">
                  <AlertCircle size={14} />
                  Over budget by ₹{Math.abs(remainingBudget).toFixed(0)}
                </span>
              ) : (
                <span className="status-text success">
                  ₹{remainingBudget.toFixed(0)} remaining
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="no-budget">
            <p>Set a budget to track your spending goals.</p>
          </div>
        )}
      </div>

      <div className="summary-cards">
        <div className="card income">
          <h3>Total Income</h3>
          <p>₹{income.toFixed(2)}</p>
        </div>
        <div className="card expense">
          <h3>Total Expense</h3>
          <p>₹{expense.toFixed(2)}</p>
          {prevExpenses > 0 && (
            <div className={`comparison ${expenseDiff > 0 ? 'increase' : 'decrease'}`}>
              {expenseDiff > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{Math.abs(expensePercent)}% {expenseDiff > 0 ? 'more' : 'less'} than last month</span>
            </div>
          )}
        </div>
        <div className="card balance">
          <h3>Balance</h3>
          <p>₹{balance.toFixed(2)}</p>
        </div>
      </div>

      <div className="charts-section">
        <div className="chart-container">
          <h2>Expense by Category</h2>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                  <tspan x="50%" dy="-25" fontSize="14" fill="var(--secondary-text)">
                    {activeIndex !== null && categoryData[activeIndex] ? categoryData[activeIndex].name : 'Total'}
                  </tspan>
                  <tspan x="50%" dy="26" fontSize="24" fontWeight="bold" fill="var(--text-color)">
                    ₹{activeIndex !== null && categoryData[activeIndex] ? categoryData[activeIndex].value : expense.toFixed(0)}
                  </tspan>
                </text>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="no-data">No expense data for this period</p>
          )}
        </div>

        <div className="chart-container">
          <h2>Daily Spending Trend</h2>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis 
                  dataKey="date" 
                  tick={{fill: 'var(--secondary-text)', fontSize: 12}}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  tick={{fill: 'var(--secondary-text)', fontSize: 12}}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'var(--card-bg)', 
                    borderRadius: '12px', 
                    border: '1px solid var(--border-color)',
                    boxShadow: '0 4px 12px var(--shadow-color)',
                    color: 'var(--text-color)'
                  }}
                  itemStyle={{ color: 'var(--primary-color)' }}
                  formatter={(value) => [`₹${value}`, 'Spent']}
                  labelStyle={{ color: 'var(--secondary-text)', marginBottom: '0.5rem' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="var(--primary-color)" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorAmount)" 
                  activeDot={{r: 6, strokeWidth: 0}}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="no-data">No spending data for this period</p>
          )}
        </div>
      </div>

      <div className="recent-transactions">
        <div className="transactions-header">
          <h2>Transactions ({format(parseISO(dateRange.start), 'dd MMM')} - {format(parseISO(dateRange.end), 'dd MMM')})</h2>
          <div className="transaction-controls">
            <select 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)}
              className="control-select"
            >
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="control-select"
            >
              <option value="date">Sort by Date</option>
              <option value="amount">Sort by Amount</option>
            </select>
          </div>
        </div>
        <div className="transaction-list">
          {transactions.length > 0 ? (
            transactions.map((t, index) => (
              <div key={index} className="transaction-item">
                <div className="t-details">
                  <div className="t-row-top">
                    <span className="t-category">{t.category}</span>
                    <span className={`t-amount ${t.type.toLowerCase()}`}>
                      {t.type === 'Income' ? '+' : '-'}₹{t.amount}
                    </span>
                  </div>
                  <div className="t-row-bottom">
                    <span className="t-description">{t.description || '-'}</span>
                    <div className="t-meta-group">
                      <span className="t-payment">{t.paymentMode}</span>
                      <span className="t-separator">•</span>
                      <span className="t-date">{format(parseISO(t.date), 'dd MMM yyyy')}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="no-data">No transactions found for this period</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
