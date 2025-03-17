
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { useFinance } from '@/context/FinanceContext';
import { CircularProgressIndicator } from '@/components/CircularProgressIndicator';
import { BarChart, Search, Home, Settings, ArrowLeft, DollarSign, ShoppingCart, Car, Utensils } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const Dashboard = () => {
  const { currentUser, finances, calculateBalance, logout } = useFinance();
  const navigate = useNavigate();

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  const userFinances = finances[currentUser.id];
  const balance = calculateBalance();

  // Mock expense categories for demonstration
  const recentExpenses = [
    { icon: <ShoppingCart size={18} />, category: 'Compras', amount: 20.45, increase: true },
    { icon: <Car size={18} />, category: 'Transporte', amount: 16.43, increase: true },
    { icon: <Utensils size={18} />, category: 'Restaurante', amount: 56.76, increase: true },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-finance-dark pb-20">
      {/* Header */}
      <div className="finance-card rounded-b-xl">
        <div className="flex justify-between items-center mb-8">
          <Button variant="ghost" size="icon" className="navbar-icon" onClick={handleLogout}>
            <ArrowLeft size={24} className="text-white" />
          </Button>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <Button variant="ghost" size="icon" className="navbar-icon">
            <Settings size={24} className="text-white" />
          </Button>
        </div>

        <div className="flex flex-col items-center">
          <CircularProgressIndicator 
            value={75} 
            size={150} 
            strokeWidth={10}
            centerContent={
              <div className="text-center">
                <span className="text-2xl font-bold text-white">{formatCurrency(balance)}</span>
                <span className="block text-sm text-gray-400">Saldo</span>
              </div>
            }
          />
        </div>

        <div className="flex justify-around mt-6">
          <button className="navbar-icon">
            <Search size={24} className="text-white" />
          </button>
          <button className="navbar-icon">
            <BarChart size={24} className="text-white" />
          </button>
          <button className="navbar-icon">
            <Settings size={24} className="text-white" />
          </button>
        </div>
      </div>

      {/* Recent expenses */}
      <Card className="mx-4 mt-6 finance-card">
        <h2 className="text-lg font-semibold text-white mb-4">Despesas Recentes</h2>
        <div className="space-y-4">
          {recentExpenses.map((expense, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-finance-dark-lighter flex items-center justify-center">
                  {expense.icon}
                </div>
                <div>
                  <p className="text-white">{expense.category}</p>
                  <p className="text-xs text-gray-400">Compra</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-${expense.increase ? 'green' : 'red'}-400`}>
                  {expense.increase ? '+' : '-'}R${expense.amount.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-finance-dark-card py-3 flex justify-around items-center">
        <button className="navbar-icon" onClick={() => navigate('/dashboard')}>
          <Home size={24} className="text-finance-blue" />
        </button>
        <button className="navbar-icon" onClick={() => navigate('/expenses')}>
          <ShoppingCart size={24} className="text-white" />
        </button>
        <div className="-mt-8">
          <button 
            className="w-12 h-12 rounded-full bg-finance-blue flex items-center justify-center"
            onClick={() => navigate('/add-income')}
          >
            <DollarSign size={24} className="text-white" />
          </button>
        </div>
        <button className="navbar-icon" onClick={() => navigate('/investments')}>
          <BarChart size={24} className="text-white" />
        </button>
        <button className="navbar-icon" onClick={() => navigate('/simulator')}>
          <Settings size={24} className="text-white" />
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
