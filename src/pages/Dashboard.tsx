
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { useFinance } from '@/context/FinanceContext';
import { CircularProgressIndicator } from '@/components/CircularProgressIndicator';
import { BarChart, Search, Home, Settings, ArrowLeft, DollarSign, ShoppingCart, Car, Utensils, Calendar, TrendingUp, ChevronRight, PieChart, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getCategoryColor } from '@/utils/chartUtils';

const Dashboard = () => {
  const { 
    currentUser, 
    finances, 
    calculateBalance, 
    logout, 
    getMonthlyExpenseTotal, 
    getFutureTransactions,
    getRealIncome,
    getTotalInvestments,
    deleteTransaction
  } = useFinance();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('expenses');
  const [futureTransactions, setFutureTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (currentUser) {
      setFutureTransactions(getFutureTransactions());
    } else {
      navigate('/login');
    }
  }, [currentUser, finances, getFutureTransactions, navigate]);

  if (!currentUser) {
    return null;
  }

  const userFinances = finances[currentUser.id] || { 
    incomes: [], 
    expenses: [], 
    investments: [], 
    balance: 0 
  };
  
  const balance = calculateBalance();
  const expenseTotal = getMonthlyExpenseTotal();
  const realIncome = getRealIncome();
  const totalInvestments = getTotalInvestments();

  // Calculate percentage based on available balance vs total income
  const percentage = realIncome > 0 ? Math.min(Math.max((balance / realIncome) * 100, 0), 100) : 0;

  const statistics = {
    income: realIncome,
    expenses: expenseTotal,
    balance: balance,
    investments: totalInvestments
  };

  const recentExpenses = userFinances.expenses.slice(0, 3).map(expense => ({
    id: expense.id,
    icon: getCategoryIcon(expense.category),
    category: getCategoryName(expense.category),
    amount: expense.amount,
    color: getCategoryColor(expense.category),
    description: expense.description,
    date: expense.date
  }));

  const recentIncomes = userFinances.incomes.slice(0, 3).map(income => ({
    id: income.id,
    description: income.description,
    amount: income.amount,
    category: income.category,
    date: income.date
  }));

  function getCategoryIcon(category: string) {
    switch (category) {
      case 'food':
        return <Utensils className="w-4 h-4" style={{ color: getCategoryColor(category) }} />;
      case 'transport':
        return <Car className="w-4 h-4" style={{ color: getCategoryColor(category) }} />;
      case 'shopping':
        return <ShoppingCart className="w-4 h-4" style={{ color: getCategoryColor(category) }} />;
      default:
        return <DollarSign className="w-4 h-4" style={{ color: getCategoryColor(category) }} />;
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

  const handleDeleteExpense = async (id: string) => {
    try {
      await deleteTransaction(id);
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  return (
    <div className="min-h-screen bg-finance-dark pb-20">
      <div className="finance-card rounded-b-xl">
        <div className="flex justify-between items-center mb-8">
          <Button variant="ghost" size="icon" className="navbar-icon" onClick={handleLogout}>
            <ArrowLeft className="w-6 h-6 text-white" />
          </Button>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <Button variant="ghost" size="icon" className="navbar-icon" onClick={() => navigate('/settings')}>
            <Settings className="w-6 h-6 text-white" />
          </Button>
        </div>

        <div className="flex flex-col items-center">
          {/* Display user avatar if available */}
          {currentUser.avatarUrl && (
            <div className="w-16 h-16 rounded-full overflow-hidden mb-2 border-2 border-finance-blue">
              <img 
                src={currentUser.avatarUrl} 
                alt="User avatar" 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {/* User name */}
          <p className="text-white mb-3">Olá, {currentUser.name}</p>
          
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
            <p className="text-green-400 font-semibold">{formatCurrency(statistics.income)}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-xs">Gastos</p>
            <p className="text-red-400 font-semibold">{formatCurrency(statistics.expenses)}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-xs">Investido</p>
            <p className="text-amber-400 font-semibold">{formatCurrency(statistics.investments)}</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4 mt-6">
        <TabsList className="grid grid-cols-3 bg-finance-dark-lighter">
          <TabsTrigger value="expenses" className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            <span>Despesas</span>
          </TabsTrigger>
          <TabsTrigger value="incomes" className="flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            <span>Entradas</span>
          </TabsTrigger>
          <TabsTrigger value="future" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Agenda</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="expenses">
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
                        <p className="text-xs" style={{ color: expense.color }}>{expense.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="text-right mr-3">
                        <p className="text-red-400">
                          -{formatCurrency(expense.amount)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {format(new Date(expense.date), 'dd/MM/yyyy')}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-gray-400 hover:text-red-400"
                        onClick={() => handleDeleteExpense(expense.id)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18"></path>
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        </svg>
                      </Button>
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
                onClick={() => navigate('/all-transactions')}
              >
                Ver Todas Despesas
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="incomes">
          <Card className="finance-card mt-4">
            <h2 className="text-lg font-semibold text-white mb-4">Entradas Recentes</h2>
            {recentIncomes.length > 0 ? (
              <div className="space-y-4">
                {recentIncomes.map((income, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <p className="text-white">{income.description}</p>
                        <p className="text-xs text-green-400">{income.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="text-right mr-3">
                        <p className="text-green-400">
                          +{formatCurrency(income.amount)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {format(new Date(income.date), 'dd/MM/yyyy')}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-gray-400 hover:text-red-400"
                        onClick={() => handleDeleteExpense(income.id)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18"></path>
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        </svg>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-6">
                <p>Nenhuma entrada registrada</p>
                <Button 
                  className="mt-4 finance-btn"
                  onClick={() => navigate('/add-income')}
                >
                  Adicionar Entrada
                </Button>
              </div>
            )}
            
            {recentIncomes.length > 0 && (
              <Button 
                variant="ghost" 
                className="w-full mt-4 text-finance-blue"
                onClick={() => navigate('/all-transactions')}
              >
                Ver Todas Entradas
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </Card>
        </TabsContent>
        
        <TabsContent value="future">
          <Card className="finance-card mt-4">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-finance-blue" />
              <h2 className="text-lg font-semibold text-white">Transações Futuras</h2>
            </div>
            
            {futureTransactions.length > 0 ? (
              <div className="space-y-4">
                {futureTransactions.slice(0, 5).map((transaction, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${transaction.type === 'income' ? 'bg-green-500/20' : 'bg-red-500/20'} flex items-center justify-center`}>
                        {transaction.type === 'income' ? 
                          <DollarSign className="w-4 h-4 text-green-400" /> : 
                          <ShoppingCart className="w-4 h-4" style={{ color: getCategoryColor(transaction.category) }} />
                        }
                      </div>
                      <div>
                        <p className="text-white">{transaction.description}</p>
                        <p className="text-xs text-gray-400">
                          {format(new Date(transaction.date), 'dd/MM/yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="text-right mr-3">
                        <p className={transaction.type === 'income' ? 'text-green-400' : 'text-red-400'}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-gray-400 hover:text-red-400"
                        onClick={() => handleDeleteExpense(transaction.id)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18"></path>
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        </svg>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-6">
                <p>Nenhuma transação futura programada</p>
              </div>
            )}
            
            {futureTransactions.length > 0 && (
              <div className="flex flex-col space-y-2 mt-4">
                <Button 
                  variant="ghost" 
                  className="w-full text-finance-blue"
                  onClick={() => navigate('/future-transactions')}
                >
                  Ver Lista de Transações
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full text-finance-blue"
                  onClick={() => navigate('/future-graphs')}
                >
                  <PieChart className="w-4 h-4 mr-1" />
                  Ver Gráficos de Previsão
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <div className="fixed bottom-0 left-0 right-0 bg-finance-dark-card py-3 flex justify-around items-center">
        <button className="navbar-icon" onClick={() => navigate('/dashboard')}>
          <Home className="w-6 h-6 text-finance-blue" />
        </button>
        <button className="navbar-icon" onClick={() => navigate('/expenses')}>
          <ShoppingCart className="w-6 h-6 text-white" />
        </button>
        <div className="-mt-8">
          <button 
            className="w-12 h-12 rounded-full bg-finance-blue flex items-center justify-center"
            onClick={() => navigate('/add-income')}
          >
            <DollarSign className="w-6 h-6 text-white" />
          </button>
        </div>
        <button className="navbar-icon" onClick={() => navigate('/investments')}>
          <BarChart className="w-6 h-6 text-white" />
        </button>
        <button className="navbar-icon" onClick={() => navigate('/all-transactions')}>
          <Receipt className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
