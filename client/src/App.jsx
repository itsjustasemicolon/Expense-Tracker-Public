import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AddTransaction from './pages/AddTransaction';
import Dashboard from './pages/Dashboard';
import Savings from './pages/Savings';
import PinScreen from './components/PinScreen';
import './App.css';

function App() {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('isAuthenticated') === 'true';
  });

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
    sessionStorage.setItem('isAuthenticated', 'true');
  };

  if (!isAuthenticated) {
    return <PinScreen onAuthenticated={handleAuthenticated} />;
  }

  return (
    <Router>
      <div className="app-container">
        <Navbar theme={theme} toggleTheme={toggleTheme} />
        <div className="content">
          <Routes>
            <Route path="/" element={<AddTransaction />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/savings" element={<Savings />} />
          </Routes>
        </div>
        <footer className="app-footer">
          Made with <span style={{color: '#e25555'}}>&hearts;</span> by <a href="https://github.com/yourusername" target="_blank" rel="noopener noreferrer">Your Name</a>
          <br />
          &copy; 2025 All rights reserved.
        </footer>
      </div>
    </Router>
  );
}

export default App;

