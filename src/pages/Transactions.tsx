
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUp, ArrowDown, Plus, Filter, Search, Trash2, ArrowLeft, PieChart, BarChart3, LineChart as LineChartIcon, Calendar, TrendingUp, DollarSign, ShoppingCart } from 'lucide-react';
import { format, addMonths, isAfter, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import BottomNav from '@/components/ui/bottom-nav';
import { getCategoryColor, formatCategoryName } from '@/utils/chartUtils';

const Transactions = () => {
  const navigate = useNavigate();
  const { 
    currentUser, 
    finances,
    getUserFinances, 
    getRealIncome, 
    getMonthlyExpenseTotal,
    deleteTransaction,
    getFutureTransactions,
    getTotalInvestments,
    getCategoryExpenses,
    fetchTransactions
  } = useFinance();
  
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'transactions' | 'charts'>('transactions');
  const [activeChartTab, setActiveChartTab] = useState('line');
  const [timeFilter, setTimeFilter] = useState<'all' | 'current' | 'future'>('current');
  const [futureTransactions, setFutureTransactions] = useState<any[]>([]);
  
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    loadTransactions();
  }, [currentUser, finances]);
  
  const loadTransactions = async () => {
    await fetchTransactions();
    const future = getFutureTransactions();
    
    // Converter para o formato de transação
    const formattedFuture = future.map((t, index) => ({
      id: t.id || `temp-${Date.now()}-${Math.random()}-${index}`,
      date: t.date,
      description: t.description,
      amount: t.amount,
      type: t.type,
      category: t.category || 'other',
      sourceCategory: t.sourceCategory
    }));
    
    setFutureTransactions(formattedFuture);
  };
  
  if (!currentUser) {
    return null;
  }
  
  const userFinances = getUserFinances(currentUser.id);
  const totalIncome = getRealIncome();
  const totalExpenses = getMonthlyExpenseTotal();
  const totalInvestments = getTotalInvestments();

  // Função para excluir uma transação
  const handleDeleteTransaction = async (id: string, type: 'income' | 'expense' | 'investment') => {
    if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
      try {
        // Usar a função deleteTransaction do contexto que lida com todos os tipos
        await deleteTransaction(id);
        await loadTransactions(); // Recarregar transações após a exclusão
        toast.success('Transação excluída com sucesso!');
      } catch (error) {
        console.error('Error deleting transaction:', error);
        toast.error('Erro ao excluir transação');
      }
    }
  };

  // Combinar transações de entrada e saída
  const incomes = userFinances.incomes.map(income => ({
    ...income,
    type: 'income',
    date: new Date(income.date)
  }));
  
  const expenses = userFinances.expenses.map(expense => ({
    ...expense,
    type: 'expense',
    date: new Date(expense.date)
  }));
  
  const investments = userFinances.investments.map(investment => ({
    ...investment,
    type: 'investment',
    date: new Date(investment.startDate),
    description: investment.description
  }));
  
  // Filtrar transações com base na aba ativa e termo de pesquisa
  let filteredTransactions = [];
  
  // Filtrar por período (atual ou futuro)
  const today = startOfDay(new Date());
  
  if (timeFilter === 'current' || timeFilter === 'all') {
    if (activeTab === 'all' || activeTab === 'income') {
      filteredTransactions = [
        ...filteredTransactions,
        ...incomes
          .filter(income => 
            income.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
            (timeFilter === 'all' || isBefore(new Date(income.date), today))
          )
      ];
    }
    
    if (activeTab === 'all' || activeTab === 'expense') {
      filteredTransactions = [
        ...filteredTransactions,
        ...expenses
          .filter(expense => 
            expense.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
            (timeFilter === 'all' || isBefore(new Date(expense.date), today))
          )
      ];
    }
    
    // Investimentos são sempre considerados transações atuais
    if (activeTab === 'all' || activeTab === 'investment') {
      filteredTransactions = [
        ...filteredTransactions,
        ...investments
          .filter(investment => 
            investment.description.toLowerCase().includes(searchTerm.toLowerCase())
          )
      ];
    }
  }
  
  // Adicionar transações futuras
  if (timeFilter === 'future' || timeFilter === 'all') {
    filteredTransactions = [
      ...filteredTransactions,
      ...futureTransactions
        .filter(transaction => {
          // Filtrar por tipo (excluindo investimentos das transações futuras)
          if (transaction.type === 'investment') return false;
          if (activeTab !== 'all' && transaction.type !== activeTab) return false;
          
          // Filtrar por termo de pesquisa
          if (!transaction.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
          
          // Filtrar por data futura
          return timeFilter === 'all' || isAfter(new Date(transaction.date), today);
        })
    ];
  }

  // Ordenar transações por data (mais recentes primeiro)
  filteredTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());

  // Função auxiliar para renderizar a lista de transações
  const renderTransactionsList = (transactions: any[]) => {
    if (transactions.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-400">Nenhuma transação encontrada</p>
        </div>
      );
    }
    
    // Agrupar transações por mês
    const groupedByMonth: Record<string, any[]> = {};
    
    transactions.forEach(transaction => {
      const monthYear = format(transaction.date, 'MMMM yyyy', { locale: ptBR });
      if (!groupedByMonth[monthYear]) {
        groupedByMonth[monthYear] = [];
      }
      groupedByMonth[monthYear].push(transaction);
    });
    
    return (
      <div className="space-y-6">
        {Object.entries(groupedByMonth).map(([monthYear, monthTransactions]) => {
          // Calcular o total de entradas para o mês
          const monthlyIncomeTotal = monthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
          
          // Calcular o total de saídas para o mês
          const monthlyExpenseTotal = monthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
          
          // Calcular o total de investimentos para o mês
          const monthlyInvestmentTotal = monthTransactions
            .filter(t => t.type === 'investment')
            .reduce((sum, t) => sum + t.amount, 0);
          
          return (
            <div key={monthYear}>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-white font-medium capitalize">{monthYear}</h3>
                {timeFilter !== 'future' && (
                  <div className="flex space-x-3">
                    <div className="text-sm">
                      <span className="text-green-500">+{formatCurrency(monthlyIncomeTotal)}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-red-500">-{formatCurrency(monthlyExpenseTotal)}</span>
                    </div>
                    {monthlyInvestmentTotal > 0 && (
                      <div className="text-sm">
                        <span className="text-blue-500">•{formatCurrency(monthlyInvestmentTotal)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {monthTransactions.map((transaction, index) => (
                  <Card key={`${transaction.id}-${index}`} className="finance-card p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                          transaction.type === 'income' 
                            ? 'bg-green-500/20' 
                            : transaction.type === 'investment' 
                              ? 'bg-blue-500/20' 
                              : 'bg-red-500/20'
                        }`}>
                          {transaction.type === 'income' ? (
                            <ArrowUp className="h-5 w-5 text-green-500" />
                          ) : transaction.type === 'investment' ? (
                            <BarChart3 className="h-5 w-5 text-blue-500" />
                          ) : (
                            <ArrowDown className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">{transaction.description}</p>
                          <div className="flex text-xs space-x-2">
                            <span className="text-gray-400">
                              {format(transaction.date, 'dd MMM yyyy', { locale: ptBR })}
                            </span>
                            {transaction.category && (
                              <span style={{ color: getCategoryColor(transaction.category) }}>
                                {formatCategoryName(transaction.category)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-bold ${
                          transaction.type === 'income' 
                            ? 'text-green-500' 
                            : transaction.type === 'investment' 
                              ? 'text-blue-500' 
                              : 'text-red-500'
                        }`}>
                          {transaction.type === 'income' 
                            ? '+' 
                            : transaction.type === 'investment' 
                              ? '•' 
                              : '-'
                          }
                          {formatCurrency(transaction.amount)}
                        </span>
                        <button 
                          onClick={() => handleDeleteTransaction(transaction.id, transaction.type)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-finance-dark pb-24">
      <div className="finance-card rounded-b-xl">
        <div className="flex justify-between items-center mb-4">
          <Button variant="ghost" size="icon" className="navbar-icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-6 h-6 text-white" />
          </Button>
          <h1 className="text-xl font-bold text-white">Transações</h1>
          <Button 
            variant="ghost" 
            size="icon" 
            className="navbar-icon" 
            onClick={() => setViewMode(viewMode === 'transactions' ? 'charts' : 'transactions')}
          >
            {viewMode === 'transactions' ? (
              <PieChart className="w-6 h-6 text-white" />
            ) : (
              <Calendar className="w-6 h-6 text-white" />
            )}
          </Button>
        </div>
      </div>
      
      <div className="px-4 pt-4 pb-20">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-white">Transações</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className={viewMode === 'transactions' ? 'bg-finance-dark-lighter' : 'bg-transparent'}
              onClick={() => setViewMode('transactions')}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Lista
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className={viewMode === 'charts' ? 'bg-finance-dark-lighter' : 'bg-transparent'}
              onClick={() => setViewMode('charts')}
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              Gráficos
            </Button>
          </div>
        </div>
        
        {viewMode === 'transactions' && (
          <>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <Card className="p-3 bg-finance-dark-card">
                <div className="flex flex-col items-center">
                  <ArrowUp className="h-5 w-5 text-green-500 mb-1" />
                  <p className="text-xs text-gray-400">Entradas</p>
                  <p className="text-lg font-bold text-white">{formatCurrency(totalIncome)}</p>
                </div>
              </Card>
              <Card className="p-3 bg-finance-dark-card">
                <div className="flex flex-col items-center">
                  <ArrowDown className="h-5 w-5 text-red-500 mb-1" />
                  <p className="text-xs text-gray-400">Saídas</p>
                  <p className="text-lg font-bold text-white">{formatCurrency(totalExpenses)}</p>
                </div>
              </Card>
              <Card className="p-3 bg-finance-dark-card">
                <div className="flex flex-col items-center">
                  <TrendingUp className="h-5 w-5 text-blue-500 mb-1" />
                  <p className="text-xs text-gray-400">Investimentos</p>
                  <p className="text-lg font-bold text-white">{formatCurrency(totalInvestments)}</p>
                </div>
              </Card>
            </div>
            
            <div className="mb-4">
              <div className="flex gap-2 mb-2">
                <Tabs value={timeFilter} onValueChange={(value) => setTimeFilter(value as 'all' | 'current' | 'future')} className="w-full">
                  <TabsList className="grid grid-cols-3 bg-finance-dark-lighter">
                    <TabsTrigger value="current">Atuais</TabsTrigger>
                    <TabsTrigger value="future">Futuras</TabsTrigger>
                    <TabsTrigger value="all">Todas</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Buscar transações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-finance-dark-lighter text-white"
                />
              </div>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-4 bg-finance-dark-lighter">
                  <TabsTrigger value="all">Todas</TabsTrigger>
                  <TabsTrigger value="income">Entradas</TabsTrigger>
                  <TabsTrigger value="expense">Saídas</TabsTrigger>
                  <TabsTrigger value="investment">Invest.</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            {renderTransactionsList(filteredTransactions)}
          </>
        )}
        
        {viewMode === 'charts' && (
          <div className="mt-4">
            <Button 
              className="finance-btn w-full mb-4"
              onClick={() => navigate('/cashflow')}
            >
              <LineChartIcon className="w-4 h-4 mr-1" />
              Ver Gráficos de Fluxo de Caixa
            </Button>
            
            <Button 
              className="finance-btn-secondary w-full"
              onClick={() => navigate('/investment-returns')}
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              Ver Rendimentos de Investimentos
            </Button>
          </div>
        )}
      </div>
      
      {/* Barra de navegação inferior */}
      <BottomNav currentPath="/transactions" />
    </div>
  );
};

export default Transactions;
