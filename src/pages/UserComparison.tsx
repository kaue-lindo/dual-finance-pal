
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '@/context/FinanceContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PieChart, BarChart3, TrendingUp } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell } from 'recharts';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { calculateTotalForMonth } from '@/utils/chartUtils';
import { formatCurrency } from '@/lib/utils';
import { getCategoryColor, formatCategoryName } from '@/utils/chartUtils';
import BottomNav from '@/components/ui/bottom-nav';

const UserComparison = () => {
  const navigate = useNavigate();
  const { 
    users, 
    finances, 
    getCategoryExpenses, 
    getIncomeCategories, 
    getExpenseCategories,
    getTotalInvestments,
    getTotalInvestmentsWithReturns,
    getUserBalance
  } = useFinance();
  
  const [userOne, setUserOne] = useState<string | null>(null);
  const [userTwo, setUserTwo] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
  const [monthsToShow, setMonthsToShow] = useState(6);
  const [activeTab, setActiveTab] = useState('expenses');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (users.length > 0) {
      setUserOne(users[0].id);
      setUserTwo(users.length > 1 ? users[1].id : users[0].id);
    }
    
    // Add a small delay to simulate loading for animation effect
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);
    
    return () => clearTimeout(timer);
  }, [users]);

  if (!userOne || !userTwo) {
    return (
      <div className="flex justify-center items-center h-screen bg-finance-dark">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-slate-700 h-10 w-10"></div>
          <div className="flex-1 space-y-6 py-1">
            <div className="h-2 bg-slate-700 rounded"></div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-2 bg-slate-700 rounded col-span-2"></div>
                <div className="h-2 bg-slate-700 rounded col-span-1"></div>
              </div>
              <div className="h-2 bg-slate-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const userOneName = users.find(user => user.id === userOne)?.name || 'Usuário 1';
  const userTwoName = users.find(user => user.id === userTwo)?.name || 'Usuário 2';

  // Data preparation functions
  const prepareExpensesData = () => {
    const userOneData = getCategoryExpenses(userOne);
    const userTwoData = getCategoryExpenses(userTwo);
    const categoryNames = Array.from(new Set([...userOneData.map(item => item.category), ...userTwoData.map(item => item.category)]));

    return categoryNames.map(category => {
      const userOneExpense = userOneData.find(item => item.category === category)?.amount || 0;
      const userTwoExpense = userTwoData.find(item => item.category === category)?.amount || 0;
      return {
        category: formatCategoryName(category),
        [userOneName]: userOneExpense,
        [userTwoName]: userTwoExpense,
        rawCategory: category
      };
    });
  };

  const prepareIncomeData = () => {
    const categories = getIncomeCategories();
    const result = [];
    
    for (const category of categories) {
      const userOneIncomes = finances[userOne]?.incomes || [];
      const userTwoIncomes = finances[userTwo]?.incomes || [];
      
      const userOneAmount = userOneIncomes
        .filter(income => income.category === category.value)
        .reduce((sum, income) => sum + income.amount, 0);
      
      const userTwoAmount = userTwoIncomes
        .filter(income => income.category === category.value)
        .reduce((sum, income) => sum + income.amount, 0);
      
      result.push({
        category: category.label,
        [userOneName]: userOneAmount,
        [userTwoName]: userTwoAmount,
        rawCategory: category.value
      });
    }
    
    return result;
  };

  const prepareInvestmentData = () => {
    const userOneInvestments = finances[userOne]?.investments || [];
    const userTwoInvestments = finances[userTwo]?.investments || [];
    
    // Group investments by type
    const userOneInvestmentsByType = new Map();
    const userTwoInvestmentsByType = new Map();
    
    userOneInvestments.forEach(inv => {
      const key = inv.description || 'Outros';
      const current = userOneInvestmentsByType.get(key) || 0;
      userOneInvestmentsByType.set(key, current + inv.amount);
    });
    
    userTwoInvestments.forEach(inv => {
      const key = inv.description || 'Outros';
      const current = userTwoInvestmentsByType.get(key) || 0;
      userTwoInvestmentsByType.set(key, current + inv.amount);
    });
    
    // Create unified set of investment types
    const allTypes = new Set([
      ...userOneInvestmentsByType.keys(),
      ...userTwoInvestmentsByType.keys()
    ]);
    
    return Array.from(allTypes).map(type => ({
      category: type,
      [userOneName]: userOneInvestmentsByType.get(type) || 0,
      [userTwoName]: userTwoInvestmentsByType.get(type) || 0,
      rawCategory: type
    }));
  };

  const prepareOverviewData = () => {
    return [
      {
        name: 'Saldo Total',
        [userOneName]: getUserBalance(userOne),
        [userTwoName]: getUserBalance(userTwo),
      },
      {
        name: 'Total Investido',
        [userOneName]: getTotalInvestments(userOne),
        [userTwoName]: getTotalInvestments(userTwo),
      },
      {
        name: 'Investimento com Retornos',
        [userOneName]: getTotalInvestmentsWithReturns(userOne),
        [userTwoName]: getTotalInvestmentsWithReturns(userTwo),
      }
    ];
  };

  const prepareMonthlyData = () => {
    const months = Array.from({ length: monthsToShow }, (_, i) => {
      const date = subMonths(new Date(), monthsToShow - 1 - i);
      return format(date, 'MMMM', { locale: ptBR });
    });

    const userOneIncomes = finances[userOne]?.incomes || [];
    const userTwoIncomes = finances[userTwo]?.incomes || [];

    const userOneTransactions = months.map(month => {
      return calculateTotalForMonth(userOneIncomes, month);
    });

    const userTwoTransactions = months.map(month => {
      return calculateTotalForMonth(userTwoIncomes, month);
    });

    return months.map((month, index) => ({
      month: month,
      [userOneName]: Number(userOneTransactions[index] || 0),
      [userTwoName]: Number(userTwoTransactions[index] || 0),
    }));
  };

  // Get the appropriate data based on the selected compare type
  const getComparisonData = () => {
    switch (activeTab) {
      case 'expenses':
        return prepareExpensesData();
      case 'income':
        return prepareIncomeData();
      case 'investment':
        return prepareInvestmentData();
      case 'overview':
        return prepareOverviewData();
      case 'monthly':
        return prepareMonthlyData();
      default:
        return prepareExpensesData();
    }
  };

  const chartData = getComparisonData();
  
  // Custom tooltip with improved styling
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 p-4 border border-purple-500/20 rounded-lg shadow-lg backdrop-blur-sm">
          <p className="text-white font-semibold mb-2">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="flex justify-between items-center mb-1">
              <span className="flex items-center">
                <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }}></span>
                <span className="text-gray-200">{entry.name}:</span>
              </span>
              <span className="font-medium text-white ml-2">{formatCurrency(entry.value)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Render bar chart with enhanced styling
  const renderBarChart = (data: any[]) => {
    const xKey = activeTab === 'monthly' ? 'month' : 'category';
    
    return (
      <ResponsiveContainer width="100%" height={400} className="animate-fade-in">
        <BarChart data={data}>
          <defs>
            <linearGradient id="colorUser1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#8884d8" stopOpacity={0.2}/>
            </linearGradient>
            <linearGradient id="colorUser2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.2}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey={xKey} stroke="#aaa" />
          <YAxis stroke="#aaa" tickFormatter={value => formatCurrency(value)} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '10px' }} />
          <Bar dataKey={userOneName} fill="url(#colorUser1)" radius={[4, 4, 0, 0]} />
          <Bar dataKey={userTwoName} fill="url(#colorUser2)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  // Render pie charts with enhanced styling
  const renderPieCharts = (data: any[]) => {
    const userOneTotal = data.reduce((sum, item) => sum + item[userOneName], 0);
    const userTwoTotal = data.reduce((sum, item) => sum + item[userTwoName], 0);

    const userOneData = data.map(item => ({
      name: item.category || item.month || item.name,
      value: item[userOneName],
      percentage: ((item[userOneName] / userOneTotal) * 100).toFixed(1)
    }));

    const userTwoData = data.map(item => ({
      name: item.category || item.month || item.name,
      value: item[userTwoName],
      percentage: ((item[userTwoName] / userTwoTotal) * 100).toFixed(1)
    }));

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
        <Card className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
          <h3 className="text-white text-center mb-4 font-semibold">{userOneName}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPie>
              <Pie
                data={userOneData.filter(item => item.value > 0)}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                labelLine={false}
              >
                {userOneData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getCategoryColor(data[index].rawCategory || index.toString())}
                    className="drop-shadow-lg"
                  />
                ))}
              </Pie>
              <Tooltip formatter={value => formatCurrency(Number(value))} />
            </RechartsPie>
          </ResponsiveContainer>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
          <h3 className="text-white text-center mb-4 font-semibold">{userTwoName}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPie>
              <Pie
                data={userTwoData.filter(item => item.value > 0)}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                labelLine={false}
              >
                {userTwoData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getCategoryColor(data[index].rawCategory || index.toString())}
                    className="drop-shadow-lg"
                  />
                ))}
              </Pie>
              <Tooltip formatter={value => formatCurrency(Number(value))} />
            </RechartsPie>
          </ResponsiveContainer>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 pb-20">
      <div className="bg-gradient-to-r from-purple-800 to-blue-700 rounded-b-xl shadow-lg">
        <div className="flex justify-between items-center p-4">
          <Button variant="ghost" size="icon" className="hover:bg-white/10 transition-colors" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={24} className="text-white" />
          </Button>
          <h1 className="text-xl font-bold text-white">Comparativo de Usuários</h1>
          <Button variant="ghost" size="icon" className="hover:bg-white/10 transition-colors">
            <PieChart size={24} className="text-white" />
          </Button>
        </div>
      </div>

      <div className="container px-4 pt-6 mx-auto">
        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 mb-6 shadow-xl overflow-hidden">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
              <span className="w-1 h-6 bg-purple-500 mr-2 rounded"></span>
              Filtros
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="userOne" className="text-gray-300 mb-1.5 block">Usuário 1:</Label>
                <Select value={userOne} onValueChange={(value: string) => setUserOne(value)}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white focus:ring-purple-500">
                    <SelectValue placeholder="Selecione o Usuário 1" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600 text-white">
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id} className="focus:bg-purple-700 focus:text-white">
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="userTwo" className="text-gray-300 mb-1.5 block">Usuário 2:</Label>
                <Select value={userTwo} onValueChange={(value: string) => setUserTwo(value)}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white focus:ring-purple-500">
                    <SelectValue placeholder="Selecione o Usuário 2" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600 text-white">
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id} className="focus:bg-purple-700 focus:text-white">
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 flex justify-between">
              <div className="flex-1 mr-2">
                <Label htmlFor="chartType" className="text-gray-300 mb-1.5 block">Visualização:</Label>
                <div className="flex space-x-2 mt-1">
                  <Button
                    size="sm"
                    variant={chartType === 'bar' ? 'default' : 'outline'}
                    className={`${chartType === 'bar' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-slate-700 border-slate-600 hover:bg-slate-600'}`}
                    onClick={() => setChartType('bar')}
                  >
                    <BarChart3 size={16} className="mr-1" />
                    Barras
                  </Button>
                  <Button
                    size="sm"
                    variant={chartType === 'pie' ? 'default' : 'outline'} 
                    className={`${chartType === 'pie' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-slate-700 border-slate-600 hover:bg-slate-600'}`}
                    onClick={() => setChartType('pie')}
                  >
                    <PieChart size={16} className="mr-1" />
                    Pizza
                  </Button>
                </div>
              </div>

              {activeTab === 'monthly' && (
                <div className="flex-1 ml-2">
                  <Label htmlFor="monthsToShow" className="text-gray-300 mb-1.5 block">Meses:</Label>
                  <Input
                    type="number"
                    id="monthsToShow"
                    className="bg-slate-700 border-slate-600 text-white focus:ring-purple-500"
                    value={monthsToShow}
                    min={1}
                    max={36}
                    onChange={(e) => setMonthsToShow(Number(e.target.value))}
                  />
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 shadow-xl overflow-hidden">
          <div className="p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-5 bg-slate-700 mb-4 p-1 rounded-lg">
                <TabsTrigger 
                  value="expenses" 
                  className={`text-xs sm:text-sm py-1.5 ${activeTab === 'expenses' ? 'bg-purple-600 text-white' : 'text-gray-300'}`}
                >
                  Despesas
                </TabsTrigger>
                <TabsTrigger 
                  value="income" 
                  className={`text-xs sm:text-sm py-1.5 ${activeTab === 'income' ? 'bg-purple-600 text-white' : 'text-gray-300'}`}
                >
                  Receitas
                </TabsTrigger>
                <TabsTrigger 
                  value="investment" 
                  className={`text-xs sm:text-sm py-1.5 ${activeTab === 'investment' ? 'bg-purple-600 text-white' : 'text-gray-300'}`}
                >
                  Investimentos
                </TabsTrigger>
                <TabsTrigger 
                  value="overview" 
                  className={`text-xs sm:text-sm py-1.5 ${activeTab === 'overview' ? 'bg-purple-600 text-white' : 'text-gray-300'}`}
                >
                  Visão Geral
                </TabsTrigger>
                <TabsTrigger 
                  value="monthly" 
                  className={`text-xs sm:text-sm py-1.5 ${activeTab === 'monthly' ? 'bg-purple-600 text-white' : 'text-gray-300'}`}
                >
                  Mensal
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="expenses" className="animate-fadeIn">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <span className="w-1 h-6 bg-purple-500 mr-2 rounded"></span>
                  Comparativo de Despesas por Categoria
                </h2>
                {isLoading ? (
                  <div className="h-96 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
                  </div>
                ) : chartType === 'bar' ? renderBarChart(chartData) : renderPieCharts(chartData)}
              </TabsContent>
              
              <TabsContent value="income" className="animate-fadeIn">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <span className="w-1 h-6 bg-purple-500 mr-2 rounded"></span>
                  Comparativo de Receitas por Categoria
                </h2>
                {isLoading ? (
                  <div className="h-96 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
                  </div>
                ) : chartType === 'bar' ? renderBarChart(chartData) : renderPieCharts(chartData)}
              </TabsContent>
              
              <TabsContent value="investment" className="animate-fadeIn">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <span className="w-1 h-6 bg-purple-500 mr-2 rounded"></span>
                  Comparativo de Investimentos
                </h2>
                {isLoading ? (
                  <div className="h-96 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
                  </div>
                ) : chartType === 'bar' ? renderBarChart(chartData) : renderPieCharts(chartData)}
              </TabsContent>
              
              <TabsContent value="overview" className="animate-fadeIn">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <span className="w-1 h-6 bg-purple-500 mr-2 rounded"></span>
                  Visão Geral Financeira
                </h2>
                {isLoading ? (
                  <div className="h-96 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
                  </div>
                ) : chartType === 'bar' ? renderBarChart(chartData) : renderPieCharts(chartData)}
              </TabsContent>
              
              <TabsContent value="monthly" className="animate-fadeIn">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <span className="w-1 h-6 bg-purple-500 mr-2 rounded"></span>
                  Comparativo Mensal
                </h2>
                {isLoading ? (
                  <div className="h-96 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
                  </div>
                ) : chartType === 'bar' ? renderBarChart(chartData) : renderPieCharts(chartData)}
              </TabsContent>
            </Tabs>

            <div className="mt-6 p-4 bg-slate-700/40 rounded-lg backdrop-blur-sm border border-slate-600/50">
              <p className="text-gray-300 text-sm leading-relaxed">
                Este comparativo permite visualizar as diferenças entre os dois usuários em termos de despesas, receitas, investimentos e fluxo mensal.
                Utilize os filtros acima para personalizar a visualização.
              </p>
            </div>
          </div>
        </Card>

        <div className="flex justify-center mt-6">
          <Button 
            className="bg-gradient-to-r from-purple-700 to-blue-700 hover:from-purple-800 hover:to-blue-800 text-white mr-3 shadow-lg"
            onClick={() => navigate('/dashboard')}
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            Ver Dashboard
          </Button>
          <Button 
            className="bg-slate-700 hover:bg-slate-600 text-white shadow-lg"
            onClick={() => navigate('/cash-flow')}
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            Ver Fluxo de Caixa
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default UserComparison;
