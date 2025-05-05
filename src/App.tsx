
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { FinanceProvider } from './context/FinanceContext';
import { ConfigProvider } from './context/ConfigContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AddTransaction from './pages/AddTransaction';
import Expenses from './pages/Expenses';
import Transactions from './pages/Transactions';
import AllTransactions from './pages/AllTransactions';
import FutureTransactions from './pages/FutureTransactions';
import Investments from './pages/Investments';
import Settings from './pages/Settings';
import CashFlow from './pages/CashFlow';
import AddIncome from './pages/AddIncome';
import FutureTransactionsGraph from './pages/FutureTransactionsGraph';
import InvestmentReturns from './pages/InvestmentReturns';
import UserComparison from './pages/UserComparison';
import SimulationPage from './pages/SimulationPage';
import Simulator from './pages/Simulator';
import NotFound from './pages/NotFound';
import './App.css';

function App() {
  useEffect(() => {
    document.body.classList.add('bg-finance-dark');
    return () => {
      document.body.classList.remove('bg-finance-dark');
    };
  }, []);

  return (
    <Router>
      <ConfigProvider>
        <FinanceProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/add-transaction" element={<AddTransaction />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/all-transactions" element={<AllTransactions />} />
            <Route path="/future-transactions" element={<FutureTransactions />} />
            <Route path="/future-transactions-graph" element={<FutureTransactionsGraph />} />
            <Route path="/investments" element={<Investments />} />
            <Route path="/investment-returns" element={<InvestmentReturns />} />
            <Route path="/user-comparison" element={<UserComparison />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/cash-flow" element={<CashFlow />} />
            <Route path="/add-income" element={<AddIncome />} />
            <Route path="/simulation" element={<SimulationPage />} />
            <Route path="/simulator" element={<Simulator />} />
            <Route path="/" element={<Navigate replace to="/dashboard" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster position="top-center" />
        </FinanceProvider>
      </ConfigProvider>
    </Router>
  );
}

export default App;
