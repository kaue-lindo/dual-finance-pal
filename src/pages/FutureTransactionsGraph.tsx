import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useFinance } from '@/context/FinanceContext';
import { format, addMonths } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, PieChart, BarChart3, LineChart as LineChartIcon, Home, ShoppingCart, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { BarChart, Bar, PieChart as RechartsPie, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer } from 'recharts';
import { getCategoryColor, formatCategoryName } from '@/utils/chartUtils';

const FutureTransactionsGraph = () => {
  const { 
    currentUser, 
    finances, 
    getFutureTransactions, 
    getTotalInvestments,
    getCategoryExpenses,
    getProjectedInvestmentReturn,
    calculateBalance
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
    const transactions = getFutureTransactions();
    const currentBalance = calculateBalance();
    const totalInvestments = getTotalInvestments();
    const categoryExpenses = getCategoryExpenses();
    
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
      };
    }
    
    transactions.forEach(transaction => {
      const monthKey = format(transaction.date, 'MMM/yy');
      
      if (!monthlyData[monthKey]) return;
      
      if (transaction.type === 'income') {
        monthlyData[monthKey].income += transaction.amount;
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
        runningBalance = runningBalance + monthlyData[monthKey].income - monthlyData[monthKey].expense;
        monthlyData[monthKey].balance = runningBalance;
      }
      
      if (monthKey === format(addMonths(today, 3), 'MMM/yy') ||
          monthKey === format(addMonths(today, 6), 'MMM/yy') ||
          monthKey === format(addMonths(today, 12), 'MMM/yy')) {
        
        const monthsFromNow = Math.round((monthlyData[monthKey].date.getTime() - today.getTime()) / (30 * 24 * 60 * 60 * 1000));
        const investmentReturn = getProjectedInvestmentReturn(monthsFromNow);
        monthlyData[monthKey].investment = investmentReturn;
      }
    });
    
    const monthsArray = Object.values(monthlyData);
    setFutureMonths(monthsArray);
    
    const categoryDataForChart = categoryExpenses.map(item => ({
      name: formatCategoryName(item.category),
      value: item.amount,
      category: item.category
    }));
    setCategoryData(categoryDataForChart);
    
    const totalExpenses = categoryExpenses.reduce((sum, item) => sum + item.amount, 0);
    const distributionDataForChart = [
      { name: 'Saldo Disponível', value: currentBalance, color: '#2EC4B6' },
      { name: 'Investimentos', value: totalInvestments, color: '#FF9F1C' },
      { name: 'Despesas', value: totalExpenses, color: '#FF6B6B' }
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

  return (
    <div className="min-h-screen bg-finance-dark pb-20">
      <div className="finance-card rounded-b-xl">
        <div className="flex justify-between items-center mb-4">
          <Button variant="ghost" size="icon" className="navbar-icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={24} className="text-white" />
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
              <h2 className="text-lg font-semibold text-white mb-4">Projeção de Saldo nos Próximos Meses</h2>
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
                    <Line type="monotone" dataKey="investment" name="Rendimentos" stroke="#FF9F1C" strokeWidth={2} dot={{ stroke: '#FF9F1C', strokeWidth: 2, r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 p-3 bg-finance-dark-lighter rounded-lg">
                <p className="text-gray-300 text-sm">
                  Esta projeção mostra como seu saldo financeiro vai evoluir nos próximos meses, considerando todas as 
                  entradas e saídas programadas e recorrentes, além dos rendimentos previstos dos seus investimentos.
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
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getCategoryColor(entry.category)} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
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
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
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
        <button className="navbar-icon" onClick={() => navigate('/simulator')}>
          <TrendingUp className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
};

export default FutureTransactionsGraph;
