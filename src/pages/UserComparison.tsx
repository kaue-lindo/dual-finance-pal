import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, BarChart2, PieChart, TrendingUp, TrendingDown } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/utils';
import BottomNav from '@/components/ui/bottom-nav';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

const UserComparison = () => {
  const { currentUser, users, getUserFinances, getUserBalance, getCategoryExpenses } = useFinance();
  const navigate = useNavigate();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('overview');

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  // Filtrar usuários para não incluir o usuário atual
  const otherUsers = users.filter(user => user.id !== currentUser.id);

  // Obter dados do usuário atual
  const currentUserFinances = getUserFinances(currentUser.id);
  const currentUserBalance = getUserBalance(currentUser.id);
  const currentUserExpensesByCategory = getCategoryExpenses(currentUser.id); // Passando o id do usuário atual
  
  // Obter dados do usuário selecionado para comparação
  const selectedUserFinances = selectedUserId ? getUserFinances(selectedUserId) : null;
  const selectedUserBalance = selectedUserId ? getUserBalance(selectedUserId) : 0;
  const selectedUserExpensesByCategory = selectedUserId ? getCategoryExpenses(selectedUserId) : []; // Passando o id do usuário selecionado
  
  // Calcular rendimentos totais para ambos os usuários
  const currentUserReturns = currentUserFinances.incomes
    .filter(income => income.category === 'investment_returns')
    .reduce((sum, income) => sum + income.amount, 0);
  
  const selectedUserReturns = selectedUserFinances?.incomes
    .filter(income => income.category === 'investment_returns')
    .reduce((sum, income) => sum + income.amount, 0) || 0;
  
  // Preparar dados para comparação de saldo
  const balanceComparisonData = [
    {
      name: 'Saldo',
      [currentUser.name || 'Você']: currentUserBalance,
      ...(selectedUserId && { [users.find(u => u.id === selectedUserId)?.name || 'Outro']: selectedUserBalance })
    }
  ];
  
  // Preparar dados para comparação de entradas e saídas
  const incomeExpenseComparisonData = [
    {
      name: 'Entradas',
      [currentUser.name || 'Você']: currentUserFinances.incomes.reduce((sum, income) => sum + income.amount, 0),
      ...(selectedUserId && { 
        [users.find(u => u.id === selectedUserId)?.name || 'Outro']: 
        selectedUserFinances?.incomes.reduce((sum, income) => sum + income.amount, 0) || 0 
      })
    },
    {
      name: 'Saídas',
      [currentUser.name || 'Você']: currentUserFinances.expenses.reduce((sum, expense) => sum + expense.amount, 0),
      ...(selectedUserId && { 
        [users.find(u => u.id === selectedUserId)?.name || 'Outro']: 
        selectedUserFinances?.expenses.reduce((sum, expense) => sum + expense.amount, 0) || 0 
      })
    },
    {
      name: 'Rendimentos',
      [currentUser.name || 'Você']: currentUserReturns,
      ...(selectedUserId && { 
        [users.find(u => u.id === selectedUserId)?.name || 'Outro']: selectedUserReturns
      })
    },
    {
      name: 'Saldo',
      [currentUser.name || 'Você']: currentUserBalance,
      ...(selectedUserId && { 
        [users.find(u => u.id === selectedUserId)?.name || 'Outro']: selectedUserBalance
      })
    }
  ];
  
  // Calcular percentuais de economia
  const calculateSavingsRate = (finances) => {
    const totalIncome = finances.incomes.reduce((sum, income) => sum + income.amount, 0);
    const totalExpense = finances.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    if (totalIncome === 0) return 0;
    return ((totalIncome - totalExpense) / totalIncome) * 100;
  };
  
  const currentUserSavingsRate = calculateSavingsRate(currentUserFinances);
  const selectedUserSavingsRate = selectedUserFinances ? calculateSavingsRate(selectedUserFinances) : 0;
  
  // Dados para o gráfico de economia
  const savingsRateData = [
    {
      name: 'Taxa de Economia (%)',
      [currentUser.name || 'Você']: parseFloat(currentUserSavingsRate.toFixed(2)),
      ...(selectedUserId && { 
        [users.find(u => u.id === selectedUserId)?.name || 'Outro']: parseFloat(selectedUserSavingsRate.toFixed(2))
      })
    }
  ];
  
  // Preparar dados para comparação de categorias de despesas
  const prepareExpenseCategoryData = () => {
    if (!selectedUserId || !selectedUserFinances) return [];
    
    // Combinar categorias de ambos os usuários
    const allCategories = new Set([
      ...currentUserExpensesByCategory.map(item => item.category),
      ...selectedUserExpensesByCategory.map(item => item.category)
    ]);
    
    // Criar dados para o gráfico radar
    return Array.from(allCategories).map(category => {
      const currentUserAmount = currentUserExpensesByCategory.find(item => item.category === category)?.amount || 0;
      const selectedUserAmount = selectedUserExpensesByCategory.find(item => item.category === category)?.amount || 0;
      
      return {
        category,
        [currentUser.name || 'Você']: currentUserAmount,
        [users.find(u => u.id === selectedUserId)?.name || 'Outro']: selectedUserAmount
      };
    });
  };
  
  const expenseCategoryData = prepareExpenseCategoryData();
  
  // Obter nomes para legendas
  const currentUserName = currentUser.name || 'Você';
  const selectedUserName = selectedUserId ? (users.find(u => u.id === selectedUserId)?.name || 'Outro') : '';

  return (
    <div className="min-h-screen bg-finance-dark pb-20">
      {/* Header */}
      <div className="finance-card rounded-b-xl">
        <div className="flex justify-between items-center mb-4">
          <Button variant="ghost" size="icon" className="navbar-icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={24} className="text-white" />
          </Button>
          <h1 className="text-xl font-bold text-white">Comparação de Usuários</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="mt-6 px-4">
        <Card className="finance-card p-4 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Users className="text-finance-blue" size={20} />
            <h2 className="text-lg font-bold text-white">Selecione um usuário para comparar</h2>
          </div>
          
          <Select
            value={selectedUserId}
            onValueChange={setSelectedUserId}
          >
            <SelectTrigger className="w-full bg-finance-dark-card border-finance-dark-lighter text-white">
              <SelectValue placeholder="Selecione um usuário" />
            </SelectTrigger>
            <SelectContent className="bg-finance-dark-card border-finance-dark-lighter text-white">
              {otherUsers.map(user => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name || user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>
        
        {selectedUserId && (
          <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 bg-finance-dark-card">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="income-expense">Entradas/Saídas</TabsTrigger>
              <TabsTrigger value="categories">Categorias</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <Card className="finance-card mt-4 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart2 className="text-finance-blue" size={20} />
                  <h2 className="text-lg font-bold text-white">Comparação de Saldo</h2>
                </div>
                
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={balanceComparisonData}
                      margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis dataKey="name" stroke="#888" />
                      <YAxis stroke="#888" tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip 
                        formatter={(value) => [formatCurrency(Number(value)), '']}
                        contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                      />
                      <Legend />
                      <Bar dataKey={currentUserName} fill="#10B981" />
                      <Bar dataKey={selectedUserName} fill="#6366F1" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-finance-dark-card p-4 rounded-lg">
                    <p className="text-gray-400">Seu saldo</p>
                    <p className={`text-xl font-bold ${currentUserBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {formatCurrency(currentUserBalance)}
                    </p>
                  </div>
                  
                  <div className="bg-finance-dark-card p-4 rounded-lg">
                    <p className="text-gray-400">Saldo de {selectedUserName}</p>
                    <p className={`text-xl font-bold ${selectedUserBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {formatCurrency(selectedUserBalance)}
                    </p>
                  </div>
                </div>
                
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="text-finance-blue" size={20} />
                    <h2 className="text-lg font-bold text-white">Taxa de Economia</h2>
                  </div>
                  
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={savingsRateData}
                        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis dataKey="name" stroke="#888" />
                        <YAxis stroke="#888" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                        <Tooltip 
                          formatter={(value) => [`${Number(value).toFixed(2)}%`, '']}
                          contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                        />
                        <Legend />
                        <Bar dataKey={currentUserName} fill="#10B981" />
                        <Bar dataKey={selectedUserName} fill="#6366F1" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h3 className="text-white font-medium mb-2">Taxa de Economia</h3>
                  <div className="space-y-2">
                    <div className="bg-finance-dark-card p-4 rounded-lg">
                      <p className="text-gray-400">Sua taxa de economia</p>
                      <p className="text-xl font-bold text-white">{currentUserSavingsRate.toFixed(2)}%</p>
                    </div>
                    
                    {selectedUserId && (
                      <div className="bg-finance-dark-card p-4 rounded-lg">
                        <p className="text-gray-400">Taxa de economia de {selectedUserName}</p>
                        <p className="text-xl font-bold text-white">{selectedUserSavingsRate.toFixed(2)}%</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="income-expense">
              <Card className="finance-card mt-4 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="text-finance-blue" size={20} />
                  <h2 className="text-lg font-bold text-white">Comparação de Entradas e Saídas</h2>
                </div>
                
                <div className="h-64">
                  {incomeExpenseComparisonData.some(item => 
                    (typeof item[currentUserName] === 'number' && item[currentUserName] > 0) || 
                    (selectedUserId && typeof item[selectedUserName] === 'number' && item[selectedUserName] > 0)
                  ) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={incomeExpenseComparisonData}
                        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis dataKey="name" stroke="#888" />
                        <YAxis stroke="#888" tickFormatter={(value) => formatCurrency(value)} />
                        <Tooltip 
                          formatter={(value) => [formatCurrency(Number(value)), '']}
                          contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                        />
                        <Legend />
                        <Bar dataKey={currentUserName} fill="#10B981" />
                        <Bar dataKey={selectedUserName} fill="#6366F1" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                      <div className="text-gray-400 mb-2">
                        <BarChart2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-lg font-medium">Nenhuma transação encontrada</p>
                        <p className="text-sm mt-2">Adicione transações para visualizar a comparação</p>
                      </div>
                      <Button 
                        onClick={() => navigate('/add-transaction')} 
                        className="mt-4 bg-finance-blue hover:bg-finance-blue/90"
                      >
                        Adicionar Transação
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-finance-dark-card p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} className="text-green-500" />
                      <p className="text-gray-400">Suas entradas</p>
                    </div>
                    <p className="text-xl font-bold text-white">
                      {formatCurrency(currentUserFinances.incomes.reduce((sum, income) => sum + income.amount, 0))}
                    </p>
                  </div>
                  
                  <div className="bg-finance-dark-card p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} className="text-green-500" />
                      <p className="text-gray-400">Entradas de {selectedUserName}</p>
                    </div>
                    <p className="text-xl font-bold text-white">
                      {formatCurrency(selectedUserFinances?.incomes.reduce((sum, income) => sum + income.amount, 0) || 0)}
                    </p>
                  </div>
                  
                  <div className="bg-finance-dark-card p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingDown size={16} className="text-red-500" />
                      <p className="text-gray-400">Suas saídas</p>
                    </div>
                    <p className="text-xl font-bold text-white">
                      {formatCurrency(currentUserFinances.expenses.reduce((sum, expense) => sum + expense.amount, 0))}
                    </p>
                  </div>
                  
                  <div className="bg-finance-dark-card p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingDown size={16} className="text-red-500" />
                      <p className="text-gray-400">Saídas de {selectedUserName}</p>
                    </div>
                    <p className="text-xl font-bold text-white">
                      {formatCurrency(selectedUserFinances?.expenses.reduce((sum, expense) => sum + expense.amount, 0) || 0)}
                    </p>
                  </div>
                  
                  <div className="bg-finance-dark-card p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} className="text-blue-500" />
                      <p className="text-gray-400">Seus rendimentos</p>
                    </div>
                    <p className="text-xl font-bold text-white">
                      {formatCurrency(currentUserReturns)}
                    </p>
                  </div>
                  
                  <div className="bg-finance-dark-card p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} className="text-blue-500" />
                      <p className="text-gray-400">Rendimentos de {selectedUserName}</p>
                    </div>
                    <p className="text-xl font-bold text-white">
                      {formatCurrency(selectedUserReturns)}
                    </p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h3 className="text-white font-medium mb-2">Taxa de Economia</h3>
                  <div className="space-y-2">
                    <div className="bg-finance-dark-card p-4 rounded-lg">
                      <p className="text-gray-400">Sua taxa de economia</p>
                      <p className="text-xl font-bold text-white">{currentUserSavingsRate.toFixed(2)}%</p>
                    </div>
                    
                    {selectedUserId && (
                      <div className="bg-finance-dark-card p-4 rounded-lg">
                        <p className="text-gray-400">Taxa de economia de {selectedUserName}</p>
                        <p className="text-xl font-bold text-white">{selectedUserSavingsRate.toFixed(2)}%</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="categories">
              <Card className="finance-card mt-4 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <PieChart className="text-finance-blue" size={20} />
                  <h2 className="text-lg font-bold text-white">Comparação por Categorias</h2>
                </div>
                
                <div className="h-80">
                  {expenseCategoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={expenseCategoryData}>
                        <PolarGrid stroke="#444" />
                        <PolarAngleAxis dataKey="category" stroke="#888" tick={{ fill: "#fff" }} />
                        <PolarRadiusAxis stroke="#888" tickFormatter={(value) => formatCurrency(value)} />
                        <Radar 
                          name={currentUserName} 
                          dataKey={currentUserName} 
                          stroke="#10B981" 
                          fill="#10B981" 
                          fillOpacity={0.6} 
                        />
                        <Radar 
                          name={selectedUserName} 
                          dataKey={selectedUserName} 
                          stroke="#6366F1" 
                          fill="#6366F1" 
                          fillOpacity={0.6} 
                        />
                        <Legend />
                        <Tooltip 
                          formatter={(value) => [formatCurrency(Number(value)), '']}
                          contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                      <div className="text-gray-400 mb-2">
                        <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-lg font-medium">Nenhuma categoria de despesa encontrada</p>
                        <p className="text-sm mt-2">Adicione despesas com categorias para visualizar a comparação</p>
                      </div>
                      <Button 
                        onClick={() => navigate('/add-transaction')} 
                        className="mt-4 bg-finance-blue hover:bg-finance-blue/90"
                      >
                        Adicionar Despesa
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="mt-6">
                  <h3 className="text-white font-medium mb-3">Principais categorias de despesas:</h3>
                  <div className="space-y-3">
                    {expenseCategoryData
                      .sort((a, b) => {
                        const aTotal = Number(a[currentUserName]) + Number(a[selectedUserName]);
                        const bTotal = Number(b[currentUserName]) + Number(b[selectedUserName]);
                        return bTotal - aTotal;
                      })
                      .slice(0, 5)
                      .map((item, index) => (
                        <div key={index} className="bg-finance-dark-card p-4 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-white font-medium">{item.category}</p>
                            <div className="flex gap-4">
                              <div className="flex items-center">
                                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                                <span className="text-green-500">{formatCurrency(Number(item[currentUserName]))}</span>
                              </div>
                              <div className="flex items-center">
                                <div className="w-3 h-3 rounded-full bg-indigo-400 mr-2"></div>
                                <span className="text-indigo-400">{formatCurrency(Number(item[selectedUserName]))}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Barra de progresso comparativa */}
                          <div className="w-full bg-finance-dark-lighter h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-green-500 h-full" 
                              style={{ 
                                width: `${(Number(item[currentUserName]) / (Number(item[currentUserName]) + Number(item[selectedUserName]))) * 100}%`,
                                float: 'left'
                              }}
                            ></div>
                            <div 
                              className="bg-indigo-400 h-full" 
                              style={{ 
                                width: `${(Number(item[selectedUserName]) / (Number(item[currentUserName]) + Number(item[selectedUserName]))) * 100}%`,
                                float: 'left'
                              }}
                            ></div>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
      
      <BottomNav currentPath="/user-comparison" />
    </div>
  );
};

export default UserComparison;
