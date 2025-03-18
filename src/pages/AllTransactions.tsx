
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { ArrowLeft, DollarSign, ShoppingCart, Search, Receipt } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { getCategoryColor } from '@/utils/chartUtils';

const AllTransactions = () => {
  const { 
    currentUser, 
    finances, 
    deleteTransaction 
  } = useFinance();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  const userFinances = finances[currentUser.id];
  
  const filteredExpenses = userFinances.expenses
    .filter(expense => 
      expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredIncomes = userFinances.incomes
    .filter(income => 
      income.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      income.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const allTransactions = [
    ...filteredExpenses.map(expense => ({ 
      ...expense, 
      type: 'expense' 
    })),
    ...filteredIncomes.map(income => ({ 
      ...income, 
      type: 'income' 
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteTransaction(id);
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

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
      case 'salary':
        return 'Salário';
      case 'bonus':
        return 'Bônus';
      case 'investment-return':
        return 'Retorno de Investimento';
      case 'other-income':
        return 'Outras Receitas';
      default:
        return 'Outros';
    }
  }

  return (
    <div className="min-h-screen bg-finance-dark pb-20">
      <div className="finance-card rounded-b-xl">
        <div className="flex justify-between items-center mb-4">
          <Button variant="ghost" size="icon" className="navbar-icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-6 h-6 text-white" />
          </Button>
          <h1 className="text-xl font-bold text-white">Todas Transações</h1>
          <div className="w-10"></div>
        </div>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <Input
            placeholder="Buscar transações..."
            className="finance-input pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4 mt-6">
        <TabsList className="grid grid-cols-3 bg-finance-dark-lighter">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            <span>Todas</span>
          </TabsTrigger>
          <TabsTrigger value="incomes" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <span>Entradas</span>
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            <span>Despesas</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <Card className="finance-card mt-4">
            <h2 className="text-lg font-semibold text-white mb-4">Todas as Transações</h2>
            {allTransactions.length > 0 ? (
              <div className="space-y-4">
                {allTransactions.map((transaction, index) => (
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
                        <p className="text-xs" style={{ color: transaction.type === 'income' ? '#4ade80' : getCategoryColor(transaction.category) }}>
                          {getCategoryName(transaction.category)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="text-right mr-3">
                        <p className={transaction.type === 'income' ? 'text-green-400' : 'text-red-400'}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {format(new Date(transaction.date), 'dd/MM/yyyy')}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-gray-400 hover:text-red-400"
                        onClick={() => handleDeleteTransaction(transaction.id)}
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
                <p>Nenhuma transação encontrada</p>
              </div>
            )}
          </Card>
        </TabsContent>
        
        <TabsContent value="incomes">
          <Card className="finance-card mt-4">
            <h2 className="text-lg font-semibold text-white mb-4">Todas as Entradas</h2>
            {filteredIncomes.length > 0 ? (
              <div className="space-y-4">
                {filteredIncomes.map((income, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <p className="text-white">{income.description}</p>
                        <p className="text-xs text-green-400">{getCategoryName(income.category)}</p>
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
                        onClick={() => handleDeleteTransaction(income.id)}
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
                <p>Nenhuma entrada encontrada</p>
              </div>
            )}
          </Card>
        </TabsContent>
        
        <TabsContent value="expenses">
          <Card className="finance-card mt-4">
            <h2 className="text-lg font-semibold text-white mb-4">Todas as Despesas</h2>
            {filteredExpenses.length > 0 ? (
              <div className="space-y-4">
                {filteredExpenses.map((expense, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                        <ShoppingCart className="w-4 h-4" style={{ color: getCategoryColor(expense.category) }} />
                      </div>
                      <div>
                        <p className="text-white">{expense.description}</p>
                        <p className="text-xs" style={{ color: getCategoryColor(expense.category) }}>{getCategoryName(expense.category)}</p>
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
                        onClick={() => handleDeleteTransaction(expense.id)}
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
                <p>Nenhuma despesa encontrada</p>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <div className="fixed bottom-0 left-0 right-0 bg-finance-dark-card py-3 flex justify-around items-center">
        <button className="navbar-icon" onClick={() => navigate('/dashboard')}>
          <Home className="w-6 h-6 text-white" />
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
          <Receipt className="w-6 h-6 text-finance-blue" />
        </button>
      </div>
    </div>
  );
};

export default AllTransactions;
