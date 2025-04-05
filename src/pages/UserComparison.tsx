
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '@/context/FinanceContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PieChart, BarChart3, LineChart as LineChartIcon, TrendingUp } from 'lucide-react';
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
  const [compareType, setCompareType] = useState<'expenses' | 'income' | 'investment' | 'monthly'>('expenses');
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
  const [monthsToShow, setMonthsToShow] = useState(6);
  const [activeTab, setActiveTab] = useState('expenses');

  useEffect(() => {
    if (users.length > 0) {
      setUserOne(users[0].id);
      setUserTwo(users.length > 1 ? users[1].id : users[0].id);
    }
  }, [users]);

  if (!userOne || !userTwo) {
    return <div className="flex justify-center items-center h-screen bg-finance-dark">Carregando...</div>;
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
  
  // Custom tooltip components
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-finance-dark-card p-3 border border-finance-dark-lighter rounded-md">
          <p className="text-gray-200 font-semibold">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color }}>
              {`${entry.name}: ${formatCurrency(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderBarChart = (data: any[]) => {
    const xKey = activeTab === 'monthly' ? 'month' : 'category';
    
    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey={xKey} stroke="white" />
          <YAxis stroke="white" tickFormatter={value => formatCurrency(value)} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey={userOneName} fill="#8884d8" />
          <Bar dataKey={userTwoName} fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-white text-center mb-2">{userOneName}</h3>
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
              >
                {userOneData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getCategoryColor(data[index].rawCategory || index.toString())}
                  />
                ))}
              </Pie>
              <Tooltip formatter={value => formatCurrency(Number(value))} />
            </RechartsPie>
          </ResponsiveContainer>
        </div>
        <div>
          <h3 className="text-white text-center mb-2">{userTwoName}</h3>
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
              >
                {userTwoData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getCategoryColor(data[index].rawCategory || index.toString())}
                  />
                ))}
              </Pie>
              <Tooltip formatter={value => formatCurrency(Number(value))} />
            </RechartsPie>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-finance-dark pb-20">
      <div className="finance-card rounded-b-xl">
        <div className="flex justify-between items-center p-4">
          <Button variant="ghost" size="icon" className="navbar-icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={24} className="text-white" />
          </Button>
          <h1 className="text-xl font-bold text-white">Comparativo de Usuários</h1>
          <Button variant="ghost" size="icon" className="navbar-icon">
            <PieChart size={24} className="text-white" />
          </Button>
        </div>
      </div>

      <div className="px-4 pt-4">
        <Card className="finance-card mb-4">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-white mb-4">Filtros</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="userOne" className="text-white">Usuário 1:</Label>
                <Select value={userOne} onValueChange={(value: string) => setUserOne(value)}>
                  <SelectTrigger className="bg-finance-dark-card text-white">
                    <SelectValue placeholder="Selecione o Usuário 1" />
                  </SelectTrigger>
                  <SelectContent className="bg-finance-dark-card text-white">
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="userTwo" className="text-white">Usuário 2:</Label>
                <Select value={userTwo} onValueChange={(value: string) => setUserTwo(value)}>
                  <SelectTrigger className="bg-finance-dark-card text-white">
                    <SelectValue placeholder="Selecione o Usuário 2" />
                  </SelectTrigger>
                  <SelectContent className="bg-finance-dark-card text-white">
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 flex justify-between">
              <div className="flex-1 mr-2">
                <Label htmlFor="chartType" className="text-white">Tipo de Visualização:</Label>
                <Select value={chartType} onValueChange={(value: 'bar' | 'pie') => setChartType(value)}>
                  <SelectTrigger className="bg-finance-dark-card text-white">
                    <SelectValue placeholder="Tipo de Gráfico" />
                  </SelectTrigger>
                  <SelectContent className="bg-finance-dark-card text-white">
                    <SelectItem value="bar">Barras</SelectItem>
                    <SelectItem value="pie">Pizza</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {activeTab === 'monthly' && (
                <div className="flex-1 ml-2">
                  <Label htmlFor="monthsToShow" className="text-white">Meses a Mostrar:</Label>
                  <Input
                    type="number"
                    id="monthsToShow"
                    className="bg-finance-dark-card text-white"
                    value={monthsToShow}
                    onChange={(e) => setMonthsToShow(Number(e.target.value))}
                  />
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="finance-card">
          <div className="p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-5 bg-finance-dark-lighter mb-4">
                <TabsTrigger value="expenses" className="text-xs sm:text-sm">Despesas</TabsTrigger>
                <TabsTrigger value="income" className="text-xs sm:text-sm">Receitas</TabsTrigger>
                <TabsTrigger value="investment" className="text-xs sm:text-sm">Investimentos</TabsTrigger>
                <TabsTrigger value="overview" className="text-xs sm:text-sm">Visão Geral</TabsTrigger>
                <TabsTrigger value="monthly" className="text-xs sm:text-sm">Mensal</TabsTrigger>
              </TabsList>
              
              <TabsContent value="expenses">
                <h2 className="text-lg font-semibold text-white mb-4">Comparativo de Despesas por Categoria</h2>
                {chartType === 'bar' ? renderBarChart(chartData) : renderPieCharts(chartData)}
              </TabsContent>
              
              <TabsContent value="income">
                <h2 className="text-lg font-semibold text-white mb-4">Comparativo de Receitas por Categoria</h2>
                {chartType === 'bar' ? renderBarChart(chartData) : renderPieCharts(chartData)}
              </TabsContent>
              
              <TabsContent value="investment">
                <h2 className="text-lg font-semibold text-white mb-4">Comparativo de Investimentos</h2>
                {chartType === 'bar' ? renderBarChart(chartData) : renderPieCharts(chartData)}
              </TabsContent>
              
              <TabsContent value="overview">
                <h2 className="text-lg font-semibold text-white mb-4">Visão Geral Financeira</h2>
                {chartType === 'bar' ? renderBarChart(chartData) : renderPieCharts(chartData)}
              </TabsContent>
              
              <TabsContent value="monthly">
                <h2 className="text-lg font-semibold text-white mb-4">Comparativo Mensal</h2>
                {chartType === 'bar' ? renderBarChart(chartData) : renderPieCharts(chartData)}
              </TabsContent>
            </Tabs>

            <div className="mt-6 p-3 bg-finance-dark-lighter rounded-lg">
              <p className="text-gray-300 text-sm">
                Este comparativo permite visualizar as diferenças entre os dois usuários em termos de despesas, receitas, investimentos e fluxo mensal.
                Use os filtros acima para personalizar a visualização.
              </p>
            </div>
          </div>
        </Card>

        <div className="flex justify-center mt-6">
          <Button 
            className="finance-btn mr-3"
            onClick={() => navigate('/dashboard')}
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            Ver Dashboard
          </Button>
          <Button 
            className="finance-btn-secondary"
            onClick={() => navigate('/cashflow')}
          >
            <LineChartIcon className="w-4 h-4 mr-1" />
            Ver Fluxo de Caixa
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default UserComparison;
