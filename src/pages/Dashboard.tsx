
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { useFinance } from '@/context/FinanceContext';
import { CircularProgressIndicator } from '@/components/CircularProgressIndicator';
import { BarChart, Search, Home, Settings, ArrowLeft, DollarSign, ShoppingCart, Car, Utensils, Calendar, TrendingUp, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Dashboard = () => {
  const { currentUser, finances, calculateBalance, logout, getMonthlyExpenseTotal, getFutureTransactions } = useFinance();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('expenses');
  const [futureTransactions, setFutureTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (currentUser) {
      setFutureTransactions(getFutureTransactions());
    }
  }, [currentUser, finances]);

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  const userFinances = finances[currentUser.id];
  const balance = calculateBalance();
  const expenseTotal = getMonthlyExpenseTotal();

  // Get the percentages for the circular indicator
  const percentage = Math.min(Math.max((balance / (balance + expenseTotal)) * 100, 0), 100) || 75;

  // Calculate statistics
  const statistics = {
    balance,
    expenses: expenseTotal,
    remaining: balance - expenseTotal
  };

  // Mock expense categories for demonstration
  const recentExpenses = userFinances.expenses.slice(0, 3).map(expense => ({
    icon: getCategoryIcon(expense.category),
    category: getCategoryName(expense.category),
    amount: expense.amount,
    increase: false,
    description: expense.description,
    date: expense.date
  }));

  function getCategoryIcon(category: string) {
    switch (category) {
      case 'food':
        return <Utensils size={18} />;
      case 'transport':
        return <Car size={18} />;
      case 'shopping':
        return <ShoppingCart size={18} />;
      default:
        return <DollarSign size={18} />;
    }
  }

  function getCategoryName(category: string) {
    switch (category) {
      case 'food':
        return 'Alimentação';
      case 'transport':
        return 'Transporte';
      case 'entertainment':
        return 'Entretenimento';
      case 'bills':
        return 'Contas';
      case 'shopping':
        return 'Compras';
      case 'electronics':
        return 'Eletrônicos';
      case 'appliances':
        return 'Eletrodomésticos';
      case 'furniture':
        return 'Móveis';
      case 'clothing':
        return 'Vestuário';
      default:
        return 'Outros';
    }
  }

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
          <Button variant="ghost" size="icon" className="navbar-icon" onClick={() => navigate('/simulator')}>
            <Settings size={24} className="text-white" />
          </Button>
        </div>

        <div className="flex flex-col items-center">
          <CircularProgressIndicator 
            value={percentage} 
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

        <div className="flex justify-around mt-6 mb-4">
          <div className="text-center">
            <p className="text-gray-400 text-xs">Entradas</p>
            <p className="text-green-400 font-semibold">{formatCurrency(statistics.balance)}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-xs">Gastos</p>
            <p className="text-red-400 font-semibold">{formatCurrency(statistics.expenses)}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-xs">Restante</p>
            <p className={`${statistics.remaining >= 0 ? 'text-green-400' : 'text-red-400'} font-semibold`}>
              {formatCurrency(statistics.remaining)}
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4 mt-6">
        <TabsList className="grid grid-cols-2 bg-finance-dark-lighter">
          <TabsTrigger value="expenses" className="flex items-center gap-2">
            <ShoppingCart size={16} />
            <span>Despesas</span>
          </TabsTrigger>
          <TabsTrigger value="future" className="flex items-center gap-2">
            <Calendar size={16} />
            <span>Agenda</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="expenses">
          {/* Recent expenses */}
          <Card className="finance-card mt-4">
            <h2 className="text-lg font-semibold text-white mb-4">Despesas Recentes</h2>
            {recentExpenses.length > 0 ? (
              <div className="space-y-4">
                {recentExpenses.map((expense, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-finance-dark-lighter flex items-center justify-center">
                        {expense.icon}
                      </div>
                      <div>
                        <p className="text-white">{expense.description}</p>
                        <p className="text-xs text-gray-400">{expense.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-red-400">
                        -R${expense.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {format(new Date(expense.date), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-6">
                <p>Nenhuma despesa registrada</p>
                <Button 
                  className="mt-4 finance-btn"
                  onClick={() => navigate('/expenses')}
                >
                  Adicionar Despesa
                </Button>
              </div>
            )}
            
            {recentExpenses.length > 0 && (
              <Button 
                variant="ghost" 
                className="w-full mt-4 text-finance-blue"
                onClick={() => navigate('/expenses')}
              >
                Ver Todas Despesas
                <ChevronRight size={16} className="ml-1" />
              </Button>
            )}
          </Card>
        </TabsContent>
        
        <TabsContent value="future">
          <Card className="finance-card mt-4">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={20} className="text-finance-blue" />
              <h2 className="text-lg font-semibold text-white">Transações Futuras</h2>
            </div>
            
            {futureTransactions.length > 0 ? (
              <div className="space-y-4">
                {futureTransactions.slice(0, 5).map((transaction, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${transaction.type === 'income' ? 'bg-green-500/20' : 'bg-red-500/20'} flex items-center justify-center`}>
                        {transaction.type === 'income' ? 
                          <DollarSign size={18} className="text-green-400" /> : 
                          <ShoppingCart size={18} className="text-red-400" />
                        }
                      </div>
                      <div>
                        <p className="text-white">{transaction.description}</p>
                        <p className="text-xs text-gray-400">
                          {format(new Date(transaction.date), 'dd/MM/yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={transaction.type === 'income' ? 'text-green-400' : 'text-red-400'}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-6">
                <p>Nenhuma transação futura programada</p>
              </div>
            )}
            
            {futureTransactions.length > 5 && (
              <Button 
                variant="ghost" 
                className="w-full mt-4 text-finance-blue"
              >
                Ver Todas Transações
                <ChevronRight size={16} className="ml-1" />
              </Button>
            )}
          </Card>
        </TabsContent>
      </Tabs>

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
          <TrendingUp size={24} className="text-white" />
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
