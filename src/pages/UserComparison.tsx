
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, PieChart, BarChart3, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/utils';
import BottomNav from '@/components/ui/bottom-nav';
import { ResponsiveContainer, PieChart as RePieChart, Pie, Legend, Cell, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Bar } from 'recharts';
import { getCategoryColor, formatCategoryName } from '@/utils/chartUtils';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#fb929e', '#5a98d2'];

const UserComparison = () => {
  const navigate = useNavigate();
  const { 
    currentUser, 
    users, 
    getUserBalance,
    getCategoryExpenses,
    getUserFinances,
    getRealIncome,
    getMonthlyExpenseTotal,
    getTotalInvestments,
    selectProfile
  } = useFinance();
  
  const [user1, setUser1] = useState<string | null>(null);
  const [user2, setUser2] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  
  useEffect(() => {
    if (currentUser) {
      setUser1(currentUser.id);
    }
  }, [currentUser]);
  
  const handleCompare = () => {
    if (user1 && user2) {
      // Switch to selected user profile for viewing
      selectProfile(user1);
    }
  };
  
  if (!currentUser) {
    navigate('/login');
    return null;
  }
  
  const user1Balance = user1 ? getUserBalance(user1) : 0;
  const user2Balance = user2 ? getUserBalance(user2) : 0;
  
  const user1Expenses = user1 ? getCategoryExpenses(user1) : [];
  const user2Expenses = user2 ? getCategoryExpenses(user2) : [];
  
  const user1Name = user1 ? users.find(u => u.id === user1)?.name || 'Usuário 1' : 'Usuário 1';
  const user2Name = user2 ? users.find(u => u.id === user2)?.name || 'Usuário 2' : 'Usuário 2';
  
  // Preparar dados para os gráficos de pizza
  const prepareExpensesData = (expenses: { category: string; amount: number }[]) => {
    if (!expenses || expenses.length === 0) return [];
    
    return expenses.map(expense => ({
      name: formatCategoryName(expense.category),
      value: expense.amount,
      color: getCategoryColor(expense.category)
    }));
  };
  
  // Preparar dados para o gráfico de barras comparativas
  const prepareComparisonData = () => {
    if (!user1 || !user2) return [];
    
    const user1Finances = getUserFinances(user1);
    const user2Finances = getUserFinances(user2);
    
    const user1Income = user1Finances.incomes.reduce((sum, inc) => sum + inc.amount, 0);
    const user2Income = user2Finances.incomes.reduce((sum, inc) => sum + inc.amount, 0);
    
    const user1Expense = user1Finances.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const user2Expense = user2Finances.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    const user1Investment = user1Finances.investments.reduce((sum, inv) => sum + inv.amount, 0);
    const user2Investment = user2Finances.investments.reduce((sum, inv) => sum + inv.amount, 0);
    
    return [
      {
        name: 'Entradas',
        [user1Name]: user1Income,
        [user2Name]: user2Income,
      },
      {
        name: 'Saídas',
        [user1Name]: user1Expense,
        [user2Name]: user2Expense,
      },
      {
        name: 'Investimentos',
        [user1Name]: user1Investment,
        [user2Name]: user2Investment,
      },
      {
        name: 'Saldo',
        [user1Name]: user1Balance,
        [user2Name]: user2Balance,
      }
    ];
  };
  
  // Remover categorias comuns - correção para o gráfico exibir claramente
  const getCommonCategoryExpenses = () => {
    if (!user1 || !user2) return [];
    
    const user1Categories = user1Expenses.map(e => e.category);
    const user2Categories = user2Expenses.map(e => e.category);
    
    // Encontrar categorias que existem em ambos os usuários
    const commonCategories = user1Categories.filter(cat => user2Categories.includes(cat));
    
    const result = commonCategories.map(category => {
      const user1Amount = user1Expenses.find(e => e.category === category)?.amount || 0;
      const user2Amount = user2Expenses.find(e => e.category === category)?.amount || 0;
      
      return {
        category: formatCategoryName(category),
        [user1Name]: user1Amount,
        [user2Name]: user2Amount,
      };
    });
    
    // Ordenar por maior diferença de valores para melhor visualização
    return result.sort((a, b) => {
      const diffA = Math.abs(a[user1Name] - a[user2Name]);
      const diffB = Math.abs(b[user1Name] - b[user2Name]);
      return diffB - diffA;
    });
  };
  
  // Dados para os gráficos
  const user1ExpensesData = prepareExpensesData(user1Expenses);
  const user2ExpensesData = prepareExpensesData(user2Expenses);
  const comparisonData = prepareComparisonData();
  const commonCategoryData = getCommonCategoryExpenses();
  
  return (
    <div className="min-h-screen bg-finance-dark pb-20">
      <div className="finance-card rounded-b-xl">
        <div className="flex justify-between items-center p-4">
          <Button variant="ghost" size="icon" className="navbar-icon" onClick={() => navigate('/settings')}>
            <ArrowLeft className="w-6 h-6 text-white" />
          </Button>
          <h1 className="text-xl font-bold text-white">Comparação</h1>
          <div className="w-10"></div>
        </div>
      </div>
      
      <div className="p-4 space-y-6">
        <Card className="p-4 bg-finance-dark-card">
          <h2 className="text-lg font-semibold text-white mb-3">Selecione Usuários para Comparar</h2>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Usuário 1</label>
              <Select value={user1 || ''} onValueChange={setUser1}>
                <SelectTrigger className="bg-finance-dark-lighter border-gray-700 text-white">
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent className="bg-finance-dark-lighter border-gray-700 text-white">
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Usuário 2</label>
              <Select value={user2 || ''} onValueChange={setUser2}>
                <SelectTrigger className="bg-finance-dark-lighter border-gray-700 text-white">
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent className="bg-finance-dark-lighter border-gray-700 text-white">
                  {users.filter(user => user.id !== user1).map(user => (
                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button className="w-full" onClick={handleCompare} disabled={!user1 || !user2}>
              <Users className="mr-2 h-4 w-4" />
              Comparar Usuários
            </Button>
          </div>
        </Card>
        
        {user1 && user2 && (
          <>
            <Card className="p-4 bg-finance-dark-card">
              <div className="flex justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Resumo Comparativo</h2>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setChartType('pie')}
                    className={chartType === 'pie' ? 'bg-finance-blue text-white' : 'bg-transparent'}
                  >
                    <PieChart className="h-4 w-4 mr-1" />
                    Pizza
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setChartType('bar')}
                    className={chartType === 'bar' ? 'bg-finance-blue text-white' : 'bg-transparent'}
                  >
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Barras
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-gray-400 text-sm">{user1Name}</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(user1Balance)}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-sm">{user2Name}</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(user2Balance)}</p>
                </div>
              </div>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="name" tick={{ fill: '#ccc' }} />
                    <YAxis tickFormatter={(value) => formatCurrency(value, true)} tick={{ fill: '#ccc' }} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey={user1Name} fill="#3b82f6" />
                    <Bar dataKey={user2Name} fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4 bg-finance-dark-card">
                <h2 className="text-lg font-semibold text-white mb-3">Despesas por Categoria - {user1Name}</h2>
                {user1ExpensesData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === 'pie' ? (
                        <RePieChart>
                          <Pie
                            data={user1ExpensesData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                          >
                            {user1ExpensesData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Legend formatter={(value) => <span style={{ color: '#ccc' }}>{value}</span>} />
                        </RePieChart>
                      ) : (
                        <BarChart data={user1ExpensesData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                          <XAxis dataKey="name" tick={{ fill: '#ccc' }} />
                          <YAxis tickFormatter={(value) => formatCurrency(value, true)} tick={{ fill: '#ccc' }} />
                          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                          <Bar dataKey="value" fill="#3b82f6">
                            {user1ExpensesData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-400">
                    Sem despesas para mostrar
                  </div>
                )}
              </Card>
              
              <Card className="p-4 bg-finance-dark-card">
                <h2 className="text-lg font-semibold text-white mb-3">Despesas por Categoria - {user2Name}</h2>
                {user2ExpensesData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === 'pie' ? (
                        <RePieChart>
                          <Pie
                            data={user2ExpensesData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={(entry) => `${entry.name}: ${formatCurrency(entry.value)}`}
                          >
                            {user2ExpensesData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Legend formatter={(value) => <span style={{ color: '#ccc' }}>{value}</span>} />
                        </RePieChart>
                      ) : (
                        <BarChart data={user2ExpensesData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                          <XAxis dataKey="name" tick={{ fill: '#ccc' }} />
                          <YAxis tickFormatter={(value) => formatCurrency(value, true)} tick={{ fill: '#ccc' }} />
                          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                          <Bar dataKey="value" fill="#8b5cf6">
                            {user2ExpensesData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-400">
                    Sem despesas para mostrar
                  </div>
                )}
              </Card>
            </div>
            
            {/* Optei por remover o gráfico de comparação de categorias comuns que estava com problemas */}
            
            <Card className="p-4 bg-finance-dark-card">
              <h2 className="text-lg font-semibold text-white mb-3">Fluxo Financeiro Mensal</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <h3 className="text-sm text-gray-400 mb-2">{user1Name}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <ArrowUp className="text-green-500 h-4 w-4 mr-1" />
                        <span className="text-sm text-gray-300">Entradas</span>
                      </div>
                      <span className="text-green-500 font-medium">{formatCurrency(
                        getUserFinances(user1).incomes.reduce((sum, inc) => sum + inc.amount, 0)
                      )}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <ArrowDown className="text-red-500 h-4 w-4 mr-1" />
                        <span className="text-sm text-gray-300">Saídas</span>
                      </div>
                      <span className="text-red-500 font-medium">{formatCurrency(
                        getUserFinances(user1).expenses.reduce((sum, exp) => sum + exp.amount, 0)
                      )}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm text-gray-400 mb-2">{user2Name}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <ArrowUp className="text-green-500 h-4 w-4 mr-1" />
                        <span className="text-sm text-gray-300">Entradas</span>
                      </div>
                      <span className="text-green-500 font-medium">{formatCurrency(
                        getUserFinances(user2).incomes.reduce((sum, inc) => sum + inc.amount, 0)
                      )}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <ArrowDown className="text-red-500 h-4 w-4 mr-1" />
                        <span className="text-sm text-gray-300">Saídas</span>
                      </div>
                      <span className="text-red-500 font-medium">{formatCurrency(
                        getUserFinances(user2).expenses.reduce((sum, exp) => sum + exp.amount, 0)
                      )}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
      
      <BottomNav />
    </div>
  );
};

export default UserComparison;
