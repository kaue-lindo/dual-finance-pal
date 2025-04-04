
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  TrendingUp, 
  ArrowDown, 
  ArrowUp, 
  Plus,
  RefreshCw,
  Calendar,
  Search
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  Area, 
  AreaChart,
  ReferenceLine,
  BarChart,
  Bar
} from 'recharts';
import { useFinance } from '@/context/FinanceContext';
import { format, addMonths, startOfMonth, endOfMonth, isSameMonth, isAfter, isBefore, subYears, addYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';
import BottomNav from '@/components/ui/bottom-nav';
import { cn } from '@/lib/utils';

const CashFlow = () => {
  const navigate = useNavigate();
  const { 
    currentUser, 
    finances, 
    getFutureTransactions, 
    getTotalInvestments, 
    getProjectedInvestmentReturn, 
    getTotalInvestmentsWithReturns
  } = useFinance();
  
  const [chartPeriod, setChartPeriod] = useState<'3m' | '6m' | '1y' | 'all'>('1y');
  const [showProjection, setShowProjection] = useState(true);
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('area');
  
  const userFinances = currentUser ? finances[currentUser.id] : undefined;
  const futureTransactions = getFutureTransactions();
  
  if (!currentUser) {
    navigate('/login');
    return null;
  }
  
  // Preparar dados para o gráfico
  const prepareChartData = () => {
    // Determinar intervalo de datas para o gráfico
    const today = new Date();
    const startYear = today.getFullYear();
    let startDate = new Date(startYear, 0, 1); // Janeiro do ano atual
    let endDate = new Date(startYear + 1, 0, 1); // Janeiro do próximo ano
    
    // Criar array de meses para o intervalo
    const months = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      months.push(new Date(currentDate));
      currentDate = addMonths(currentDate, 1);
    }
    
    // Calcular saldos para cada mês
    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      let income = 0;
      let expense = 0;
      let investmentValue = 0;
      
      // Somar transações para o mês
      futureTransactions.forEach(transaction => {
        const transactionDate = new Date(transaction.date);
        
        // Verificar se a transação está dentro do mês
        if (isSameMonth(transactionDate, month)) {
          if (transaction.type === 'income') {
            income += transaction.amount;
          } else if (transaction.type === 'expense') {
            expense += transaction.amount;
          } else if (transaction.type === 'investment') {
            investmentValue += transaction.amount;
          }
        }
      });
      
      // Se for mês atual ou futuro, adicionar projeção de investimentos
      let investmentProjection = 0;
      if (isAfter(month, today) || isSameMonth(month, today)) {
        const monthsFromNow = Math.max(0, 
          (month.getFullYear() - today.getFullYear()) * 12 + 
          month.getMonth() - today.getMonth()
        );
        
        if (showProjection) {
          investmentProjection = getProjectedInvestmentReturn(monthsFromNow);
        }
      }
      
      // Calcular saldo para o mês
      const balance = income - expense;
      const totalInvestmentValue = isSameMonth(month, today) ? 
        getTotalInvestmentsWithReturns() : 
        (investmentValue + investmentProjection);
      
      return {
        month: format(month, 'MMM yyyy', { locale: ptBR }),
        income,
        expense,
        balance,
        investment: totalInvestmentValue,
        date: month
      };
    });
  };
  
  const chartData = prepareChartData();
  
  const renderChart = () => {
    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="month" 
              tick={{ fill: '#aaa' }} 
              axisLine={{ stroke: '#333' }} 
            />
            <YAxis 
              tickFormatter={(value) => formatCurrency(value, true)} 
              tick={{ fill: '#aaa' }} 
              axisLine={{ stroke: '#333' }} 
            />
            <Tooltip 
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{ backgroundColor: '#222', border: 'none', borderRadius: '4px' }}
              labelStyle={{ color: '#fff' }}
            />
            <Legend wrapperStyle={{ color: '#fff' }} />
            <Line type="monotone" dataKey="income" stroke="#10b981" name="Entradas" strokeWidth={2} />
            <Line type="monotone" dataKey="expense" stroke="#ef4444" name="Saídas" strokeWidth={2} />
            <Line type="monotone" dataKey="balance" stroke="#3b82f6" name="Saldo" strokeWidth={2} />
            <Line type="monotone" dataKey="investment" stroke="#8b5cf6" name="Investimentos" strokeWidth={2} />
            <ReferenceLine y={0} stroke="#666" />
          </LineChart>
        </ResponsiveContainer>
      );
    } else if (chartType === 'area') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="month" 
              tick={{ fill: '#aaa' }} 
              axisLine={{ stroke: '#333' }} 
            />
            <YAxis 
              tickFormatter={(value) => formatCurrency(value, true)} 
              tick={{ fill: '#aaa' }} 
              axisLine={{ stroke: '#333' }} 
            />
            <Tooltip 
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{ backgroundColor: '#222', border: 'none', borderRadius: '4px' }}
              labelStyle={{ color: '#fff' }}
            />
            <Legend wrapperStyle={{ color: '#fff' }} />
            <Area type="monotone" dataKey="income" fill="#10b981" stroke="#10b981" name="Entradas" fillOpacity={0.2} />
            <Area type="monotone" dataKey="expense" fill="#ef4444" stroke="#ef4444" name="Saídas" fillOpacity={0.2} />
            <Area type="monotone" dataKey="balance" fill="#3b82f6" stroke="#3b82f6" name="Saldo" fillOpacity={0.2} />
            <Area type="monotone" dataKey="investment" fill="#8b5cf6" stroke="#8b5cf6" name="Investimentos" fillOpacity={0.2} />
            <ReferenceLine y={0} stroke="#666" />
          </AreaChart>
        </ResponsiveContainer>
      );
    } else {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="month" 
              tick={{ fill: '#aaa' }} 
              axisLine={{ stroke: '#333' }} 
            />
            <YAxis 
              tickFormatter={(value) => formatCurrency(value, true)} 
              tick={{ fill: '#aaa' }} 
              axisLine={{ stroke: '#333' }} 
            />
            <Tooltip 
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{ backgroundColor: '#222', border: 'none', borderRadius: '4px' }}
              labelStyle={{ color: '#fff' }}
            />
            <Legend wrapperStyle={{ color: '#fff' }} />
            <Bar dataKey="income" fill="#10b981" name="Entradas" />
            <Bar dataKey="expense" fill="#ef4444" name="Saídas" />
            <Bar dataKey="balance" fill="#3b82f6" name="Saldo" />
            <Bar dataKey="investment" fill="#8b5cf6" name="Investimentos" />
            <ReferenceLine y={0} stroke="#666" />
          </BarChart>
        </ResponsiveContainer>
      );
    }
  };
  
  return (
    <div className="min-h-screen bg-finance-dark">
      <div className="finance-card rounded-b-xl">
        <div className="flex justify-between items-center p-4">
          <Button variant="ghost" size="icon" className="navbar-icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-6 h-6 text-white" />
          </Button>
          <h1 className="text-xl font-bold text-white">Fluxo de Caixa</h1>
          <div className="w-10"></div>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between mb-4">
          <div className="text-gray-300">
            <div className="flex gap-2 mb-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setChartType('line')}
                className={cn(
                  "border-gray-600",
                  chartType === 'line' && "bg-finance-blue text-white"
                )}
              >
                <TrendingUp className="h-4 w-4 mr-1" />
                Linha
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setChartType('area')}
                className={cn(
                  "border-gray-600",
                  chartType === 'area' && "bg-finance-blue text-white"
                )}
              >
                <TrendingUp className="h-4 w-4 mr-1" />
                Área
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setChartType('bar')}
                className={cn(
                  "border-gray-600",
                  chartType === 'bar' && "bg-finance-blue text-white"
                )}
              >
                <TrendingUp className="h-4 w-4 mr-1" />
                Barras
              </Button>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowProjection(!showProjection)}
            className={cn(
              "border-gray-600",
              showProjection && "bg-finance-blue text-white"
            )}
          >
            <Calendar className="h-4 w-4 mr-1" />
            Projeção
          </Button>
        </div>
        
        <Card className="bg-finance-dark-card p-3 mb-4">
          {renderChart()}
        </Card>
        
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="bg-finance-dark-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUp className="text-green-500" size={20} />
              <h3 className="text-gray-300">Entradas</h3>
            </div>
            <p className="text-xl font-bold text-white">{formatCurrency(
              chartData.reduce((sum, month) => sum + month.income, 0)
            )}</p>
            <p className="text-xs text-gray-400 mt-1">Jan - Jan/Próximo</p>
          </Card>
          
          <Card className="bg-finance-dark-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDown className="text-red-500" size={20} />
              <h3 className="text-gray-300">Saídas</h3>
            </div>
            <p className="text-xl font-bold text-white">{formatCurrency(
              chartData.reduce((sum, month) => sum + month.expense, 0)
            )}</p>
            <p className="text-xs text-gray-400 mt-1">Jan - Jan/Próximo</p>
          </Card>
        </div>
        
        <Card className="bg-finance-dark-card p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-blue-500" size={20} />
            <h3 className="text-gray-300">Investimentos (com retornos)</h3>
          </div>
          <p className="text-xl font-bold text-white">
            {formatCurrency(getTotalInvestmentsWithReturns())}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Investido: {formatCurrency(getTotalInvestments())} + 
            Retorno projetado: {formatCurrency(getProjectedInvestmentReturn(3))}
          </p>
        </Card>
      </div>
      
      <BottomNav />
    </div>
  );
};

export default CashFlow;
