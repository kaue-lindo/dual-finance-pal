import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useFinance } from '@/context/FinanceContext';
import { format, addMonths } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, PieChart, BarChart3, LineChart as LineChartIcon, Home, ShoppingCart, DollarSign, Calendar, TrendingUp, Receipt } from 'lucide-react';
import { BarChart, Bar, PieChart as RechartsPie, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer } from 'recharts';
import { getCategoryColor, formatCategoryName } from '@/utils/chartUtils';
import { calculateInvestmentReturnForMonth } from '@/context/finance/utils/projections';

const FutureTransactionsGraph = () => {
  const { 
    currentUser, 
    finances, 
    getFutureTransactions, 
    getTotalInvestments,
    getCategoryExpenses,
    getProjectedInvestmentReturn,
    calculateBalance,
    getRealIncome
  } = useFinance();
  const navigate = useNavigate();
  
  const [activeChartTab, setActiveChartTab] = useState('line');
  const [futureMonths, setFutureMonths] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [distributionData, setDistributionData] = useState<any[]>([]);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    prepareChartData();
  }, [currentUser, finances]);

  const prepareChartData = () => {
    if (!currentUser) return;
    
    const transactions = getFutureTransactions();
    const currentBalance = calculateBalance();
    const totalInvestments = getTotalInvestments();
    const categoryExpenses = getCategoryExpenses();
    const totalIncome = getRealIncome();
    const userFinances = finances[currentUser.id] || { investments: [] };
    
    const today = new Date();
    const monthlyData: Record<string, any> = {};
    
    for (let i = 0; i < 12; i++) {
      const monthDate = addMonths(today, i);
      const monthKey = format(monthDate, 'MMM/yy');
      
      monthlyData[monthKey] = {
        month: monthKey,
        date: monthDate,
        balance: i === 0 ? currentBalance : 0,
        income: 0,
        expense: 0,
        investment: 0,
        investmentReturn: i === 0 ? 0 : calculateInvestmentReturnForMonth(userFinances.investments, i)
      };
    }
    
    transactions.forEach(transaction => {
      const monthKey = format(transaction.date, 'MMM/yy');
      
      if (!monthlyData[monthKey]) return;
      
      if (transaction.type === 'income') {
        if (transaction.category === 'investment-return') {
          monthlyData[monthKey].investmentReturn += transaction.amount;
        } else {
          monthlyData[monthKey].income += transaction.amount;
        }
      } else if (transaction.type === 'investment') {
        monthlyData[monthKey].investment += transaction.amount;
      } else {
        monthlyData[monthKey].expense += transaction.amount;
      }
    });
    
    let runningBalance = currentBalance;
    Object.keys(monthlyData).sort((a, b) => {
      return monthlyData[a].date.getTime() - monthlyData[b].date.getTime();
    }).forEach(monthKey => {
      if (monthKey === format(today, 'MMM/yy')) {
        runningBalance = monthlyData[monthKey].balance;
      } else {
        runningBalance = runningBalance + 
                        monthlyData[monthKey].income + 
                        monthlyData[monthKey].investmentReturn - 
                        monthlyData[monthKey].expense -
                        monthlyData[monthKey].investment;
        monthlyData[monthKey].balance = runningBalance;
      }
    });
    
    const monthsArray = Object.values(monthlyData);
    setFutureMonths(monthsArray);
    
    const formattedData = monthsArray.map(item => ({
      name: item.month,
      income: Number(item.income || 0),
      expense: Number(item.expense || 0),
      balance: Number(item.income || 0) - Number(item.expense || 0)
    }));
    
    const categoryDataForChart = categoryExpenses.map(item => {
      const totalExpenses = categoryExpenses.reduce((sum, item) => sum + item.amount, 0);
      const percentage = totalExpenses > 0 ? (item.amount / totalExpenses) * 100 : 0;
      
      return {
        name: formatCategoryName(item.category),
        value: item.amount,
        category: item.category,
        percentage: percentage.toFixed(1),
        user: currentUser?.name || 'Usuário',
      };
    });
    setCategoryData(categoryDataForChart);
    
    const totalExpenses = categoryExpenses.reduce((sum, item) => sum + item.amount, 0);
    
    const distributionDataForChart = [
      { name: 'Saldo Disponível', value: currentBalance, color: '#2EC4B6', percentage: ((currentBalance / (currentBalance + totalInvestments + totalExpenses)) * 100).toFixed(1) },
      { name: 'Investimentos', value: totalInvestments, color: '#FF9F1C', percentage: ((totalInvestments / (currentBalance + totalInvestments + totalExpenses)) * 100).toFixed(1) },
      { name: 'Despesas', value: totalExpenses, color: '#FF6B6B', percentage: ((totalExpenses / (currentBalance + totalInvestments + totalExpenses)) * 100).toFixed(1) }
    ];
    setDistributionData(distributionDataForChart);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-finance-dark-card p-3 border border-finance-dark-lighter rounded-md">
          <p className="text-gray-200 font-medium">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${formatCurrency(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CategoryTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-finance-dark-card p-3 border border-finance-dark-lighter rounded-md">
          <p className="text-gray-200 font-medium">{data.name}</p>
          <p className="text-sm text-white">Valor: {formatCurrency(data.value)}</p>
          <p className="text-sm text-white">Percentual: {data.percentage}%</p>
          <p className="text-sm text-white">Usuário: {data.user}</p>
        </div>
      );
    }
    return null;
  };

  const DistributionTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-finance-dark-card p-3 border border-finance-dark-lighter rounded-md">
          <p className="text-gray-200 font-medium">{data.name}</p>
          <p className="text-sm text-white">Valor: {formatCurrency(data.value)}</p>
          <p className="text-sm text-white">Percentual: {data.percentage}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-finance-dark pb-20">
      <div className="finance-card rounded-b-xl">
        <div className="flex justify-between items-center mb-4">
          <Button variant="ghost" size="icon" className="navbar-icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-6 h-6 text-white" />
          </Button>
          <h1 className="text-xl font-bold text-white">Previsões Futuras</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="px-4 mt-6">
        <Tabs value={activeChartTab} onValueChange={setActiveChartTab}>
          <TabsList className="grid grid-cols-3 bg-finance-dark-lighter">
            <TabsTrigger value="line" className="flex items-center gap-2">
              <LineChartIcon className="w-4 h-4" />
              <span>Projeção</span>
            </TabsTrigger>
            <TabsTrigger value="pie" className="flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              <span>Categorias</span>
            </TabsTrigger>
            <TabsTrigger value="distribution" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span>Distribuição</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="line">
            <Card className="finance-card mt-4">
              <h2 className="text-lg font-semibold text-white mb-4">Projeção Financeira - Próximos Meses</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={futureMonths}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="month" stroke="#999" />
                    <YAxis stroke="#999" tickFormatter={(value) => `R$${value.toLocaleString()}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="balance" name="Saldo" stroke="#2EC4B6" strokeWidth={2} dot={{ stroke: '#2EC4B6', strokeWidth: 2, r: 4 }} />
                    <Line type="monotone" dataKey="income" name="Entradas" stroke="#8AC926" strokeWidth={2} dot={{ stroke: '#8AC926', strokeWidth: 2, r: 4 }} />
                    <Line type="monotone" dataKey="expense" name="Saídas" stroke="#FF6B6B" strokeWidth={2} dot={{ stroke: '#FF6B6B', strokeWidth: 2, r: 4 }} />
                    <Line type="monotone" dataKey="investment" name="Investimentos" stroke="#FF9F1C" strokeWidth={2} dot={{ stroke: '#FF9F1C', strokeWidth: 2, r: 4 }} />
                    <Line type="monotone" dataKey="investmentReturn" name="Rendimentos" stroke="#9D4EDD" strokeWidth={2} dot={{ stroke: '#9D4EDD', strokeWidth: 2, r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 p-3 bg-finance-dark-lighter rounded-lg">
                <p className="text-gray-300 text-sm">
                  Esta projeção mostra como seu saldo financeiro vai evoluir nos próximos meses, considerando todas as 
                  entradas e saídas programadas e recorrentes. Os investimentos são mostrados como saídas do saldo disponível, 
                  enquanto os rendimentos projetados são calculados mensalmente.
                </p>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="pie">
            <Card className="finance-card mt-4">
              <h2 className="text-lg font-semibold text-white mb-4">Despesas por Categoria</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getCategoryColor(entry.category)} />
                      ))}
                    </Pie>
                    <Tooltip content={<CategoryTooltip />} />
                    <Legend />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 p-3 bg-finance-dark-lighter rounded-lg">
                <p className="text-gray-300 text-sm">
                  Este gráfico mostra como suas despesas estão distribuídas entre as diferentes categorias. 
                  Você pode identificar quais áreas estão consumindo mais do seu orçamento.
                </p>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="distribution">
            <Card className="finance-card mt-4">
              <h2 className="text-lg font-semibold text-white mb-4">Distribuição do seu Dinheiro</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={distributionData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<DistributionTooltip />} />
                    <Legend />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 p-3 bg-finance-dark-lighter rounded-lg">
                <p className="text-gray-300 text-sm">
                  Este gráfico mostra como seu dinheiro está distribuído entre saldo disponível, 
                  investimentos e despesas mensais. Ideal para visualizar o equilíbrio entre os três.
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-center mt-6">
          <Button 
            className="finance-btn mr-3"
            onClick={() => navigate('/future-transactions')}
          >
            <Calendar className="w-4 h-4 mr-1" />
            Ver Transações
          </Button>
          <Button 
            className="finance-btn-secondary"
            onClick={() => navigate('/simulator')}
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            Simulador
          </Button>
        </div>
      </div>

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
          <BarChart3 className="w-6 h-6 text-white" />
        </button>
        <button className="navbar-icon" onClick={() => navigate('/all-transactions')}>
          <Receipt className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
};

export default FutureTransactionsGraph;
