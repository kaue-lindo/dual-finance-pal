import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, 
  TrendingUp, 
  ArrowDown, 
  ArrowUp, 
  Calendar,
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
import { useConfig } from '@/context/ConfigContext';
import { useProjection } from '@/hooks/use-projection';
import { 
  format, 
  addMonths, 
  startOfMonth, 
  endOfMonth, 
  isSameMonth, 
  isAfter, 
  isBefore, 
  subYears, 
  addYears, 
  isSameDay, 
  addDays, 
  addWeeks, 
  startOfWeek, 
  endOfWeek 
} from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { formatCurrencyValue, getCurrencyLocale } from '@/utils/currencyUtils';
import BottomNav from '@/components/ui/bottom-nav';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { getUniqueTransactionsByMonth, calculatePeriodTotals } from '@/utils/transaction-utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  
  const { currency } = useConfig();
  
  const {
    projectionTimeUnit,
    setProjectionTimeUnit,
    projectionTimeAmount,
    setProjectionTimeAmount
  } = useProjection();
  
  const [chartPeriod, setChartPeriod] = useState<'3m' | '6m' | '1y' | 'all'>('1y');
  const [showProjection, setShowProjection] = useState(true);
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('area');
  const [isLoading, setIsLoading] = useState(true);
  const [customTimeAmount, setCustomTimeAmount] = useState(projectionTimeAmount.toString());
  const [useCumulativeBalance, setUseCumulativeBalance] = useState(true);
  
  const userFinances = currentUser ? finances[currentUser.id] : undefined;
  const futureTransactions = getFutureTransactions();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    setCustomTimeAmount(projectionTimeAmount.toString());
  }, [projectionTimeAmount]);
  
  if (!currentUser) {
    navigate('/login');
    return null;
  }
  
  const handleTimeAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomTimeAmount(value);
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0) {
      setProjectionTimeAmount(numValue);
    }
  };
  
  const getDateByUnit = (date: Date, amount: number, unit: 'days' | 'weeks' | 'months' | 'years'): Date => {
    const newDate = new Date(date);
    switch (unit) {
      case 'days':
        return addDays(newDate, amount);
      case 'weeks':
        return addWeeks(newDate, amount);
      case 'months':
        return addMonths(newDate, amount);
      case 'years':
        return addYears(newDate, amount);
      default:
        return newDate;
    }
  };
  
  const getFormattedDate = (date: Date, unit: 'days' | 'weeks' | 'months' | 'years'): string => {
    switch (unit) {
      case 'days':
        return format(date, 'dd MMM', { locale: getCurrencyLocale(currency) });
      case 'weeks':
        return format(date, "'S'w MMM", { locale: getCurrencyLocale(currency) });
      case 'months':
        return format(date, 'MMM yyyy', { locale: getCurrencyLocale(currency) });
      case 'years':
        return format(date, 'yyyy', { locale: getCurrencyLocale(currency) });
      default:
        return format(date, 'MMM yyyy', { locale: getCurrencyLocale(currency) });
    }
  };
  
  const prepareChartData = () => {
    const today = new Date();
    
    // Calculate the dates based on the projection time unit
    const datesToShow = [];
    const totalPeriods = projectionTimeAmount * 2; // Show past and future periods
    
    // Start from past periods
    for (let i = -totalPeriods/2; i <= totalPeriods/2; i++) {
      const dateForPeriod = getDateByUnit(today, i, projectionTimeUnit);
      datesToShow.push(dateForPeriod);
    }
    
    let accumulatedBalance = 0;
    const chartDataItems = datesToShow.map((date, index) => {
      const periodStart = date;
      
      // Get transactions for this period
      const periodPrefix = `chart-${format(date, 'yyyy-MM-dd')}`;
      
      // Filter transactions for this period based on the unit
      const periodTransactions = futureTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        
        switch (projectionTimeUnit) {
          case 'days':
            return isSameDay(transactionDate, date);
          case 'weeks':
            // Calculate week start and end dates
            const weekStart = startOfWeek(date, { weekStartsOn: 0 }); // Start on Sunday
            const weekEnd = endOfWeek(date, { weekStartsOn: 0 }); // End on Saturday
            return isAfter(transactionDate, weekStart) && isBefore(transactionDate, weekEnd);
          case 'months':
            return isSameMonth(transactionDate, date);
          case 'years':
            return transactionDate.getFullYear() === date.getFullYear();
          default:
            return isSameMonth(transactionDate, date);
        }
      });
      
      const uniquePeriodTransactions = getUniqueTransactionsByMonth(periodTransactions, periodPrefix);
      
      const { totalIncome, totalExpense } = calculatePeriodTotals(uniquePeriodTransactions);
      
      let investmentProjection = 0;
      let timeFromNow = 0;
      
      // Calculate equivalent months from today for investment projection
      switch (projectionTimeUnit) {
        case 'days':
          // Convert days to months (approximate)
          timeFromNow = Math.round((date.getTime() - today.getTime()) / (24 * 60 * 60 * 1000) / 30);
          break;
        case 'weeks':
          // Convert weeks to months (approximate)
          timeFromNow = Math.round((date.getTime() - today.getTime()) / (7 * 24 * 60 * 60 * 1000) / 4);
          break;
        case 'months':
          // Direct month calculation
          timeFromNow = (date.getFullYear() - today.getFullYear()) * 12 + date.getMonth() - today.getMonth();
          break;
        case 'years':
          // Years to months
          timeFromNow = (date.getFullYear() - today.getFullYear()) * 12;
          break;
      }
      
      if (showProjection && timeFromNow >= 0) {
        // Calculate investment projection based on equivalent months
        investmentProjection = getProjectedInvestmentReturn(timeFromNow);
      }
      
      const periodBalance = totalIncome - totalExpense;
      
      // Accumulate balance if the cumulative option is enabled
      if (useCumulativeBalance) {
        accumulatedBalance += periodBalance;
      } else {
        accumulatedBalance = periodBalance; // Reset for non-cumulative view
      }
      
      let totalInvestmentValue;
      // For current month use actual calculated value
      if (isSameMonth(date, today)) {
        totalInvestmentValue = getTotalInvestmentsWithReturns();
      } else {
        // For future dates, add projected returns to base investment
        const baseInvestment = getTotalInvestments();
        
        if (isAfter(date, today)) {
          totalInvestmentValue = baseInvestment + investmentProjection;
        } else {
          // For past dates, just show base investment (no historical data)
          totalInvestmentValue = baseInvestment;
        }
      }
      
      return {
        period: getFormattedDate(date, projectionTimeUnit),
        income: totalIncome,
        expense: totalExpense,
        balance: useCumulativeBalance ? accumulatedBalance : periodBalance,
        investment: totalInvestmentValue,
        date: date,
        isFuture: isAfter(date, today)
      };
    });
    
    return chartDataItems;
  };
  
  const chartData = prepareChartData();
  
  const renderChart = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col space-y-2 w-full h-[300px] items-center justify-center">
          <Skeleton className="h-[250px] w-full" />
        </div>
      );
    }
    
    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="period" 
              tick={{ fill: '#aaa' }} 
              axisLine={{ stroke: '#333' }} 
            />
            <YAxis 
              tickFormatter={(value) => formatCurrencyValue(value, currency, { notation: 'compact' })} 
              tick={{ fill: '#aaa' }} 
              axisLine={{ stroke: '#333' }} 
            />
            <Tooltip 
              formatter={(value) => formatCurrencyValue(Number(value), currency)}
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
              dataKey="period" 
              tick={{ fill: '#aaa' }} 
              axisLine={{ stroke: '#333' }} 
            />
            <YAxis 
              tickFormatter={(value) => formatCurrencyValue(value, currency, { notation: 'compact' })} 
              tick={{ fill: '#aaa' }} 
              axisLine={{ stroke: '#333' }} 
            />
            <Tooltip 
              formatter={(value) => formatCurrencyValue(Number(value), currency)}
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
              dataKey="period" 
              tick={{ fill: '#aaa' }} 
              axisLine={{ stroke: '#333' }} 
            />
            <YAxis 
              tickFormatter={(value) => formatCurrencyValue(value, currency, { notation: 'compact' })} 
              tick={{ fill: '#aaa' }} 
              axisLine={{ stroke: '#333' }} 
            />
            <Tooltip 
              formatter={(value) => formatCurrencyValue(Number(value), currency)}
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
    <div className="min-h-screen bg-finance-dark pb-20">
      <div className="finance-card rounded-b-xl p-4">
        <div className="flex justify-between items-center">
          <Button variant="ghost" size="icon" className="navbar-icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-6 h-6 text-white" />
          </Button>
          <h1 className="text-xl font-bold text-white">Fluxo de Caixa</h1>
          <div className="w-10"></div>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between mb-4 flex-wrap gap-2">
          <div className="text-gray-300">
            <div className="flex gap-2 mb-4 flex-wrap">
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
          
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "border-gray-600"
                  )}
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Projeção: {projectionTimeAmount} {
                    projectionTimeUnit === 'days' ? 'dias' :
                    projectionTimeUnit === 'weeks' ? 'semanas' :
                    projectionTimeUnit === 'months' ? 'meses' : 'anos'
                  }
                </Button>
              </PopoverTrigger>
              <PopoverContent className="bg-finance-dark-card border-finance-dark-lighter w-80">
                <div className="space-y-4 p-2">
                  <h4 className="text-sm font-medium text-white">Período de projeção</h4>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={customTimeAmount}
                      onChange={handleTimeAmountChange}
                      className="finance-input"
                    />
                    <Select 
                      value={projectionTimeUnit} 
                      onValueChange={(value) => setProjectionTimeUnit(value as 'days' | 'weeks' | 'months' | 'years')}
                    >
                      <SelectTrigger className="finance-input">
                        <SelectValue placeholder="Unidade" />
                      </SelectTrigger>
                      <SelectContent className="bg-finance-dark-card border-finance-dark-lighter">
                        <SelectItem value="days">Dias</SelectItem>
                        <SelectItem value="weeks">Semanas</SelectItem>
                        <SelectItem value="months">Meses</SelectItem>
                        <SelectItem value="years">Anos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowProjection(!showProjection)}
                      className={cn(
                        "border-gray-600",
                        showProjection && "bg-finance-blue text-white"
                      )}
                    >
                      Mostrar Projeção
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUseCumulativeBalance(!useCumulativeBalance)}
                      className={cn(
                        "border-gray-600",
                        useCumulativeBalance && "bg-finance-blue text-white"
                      )}
                    >
                      Saldo Acumulativo
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <Card className="bg-finance-dark-card p-4 mb-4 overflow-x-auto">
          {renderChart()}
        </Card>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <Card className="bg-finance-dark-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUp className="text-green-500" size={20} />
              <h3 className="text-gray-300">Entradas</h3>
            </div>
            <p className="text-xl font-bold text-white break-words">{formatCurrencyValue(
              chartData.reduce((sum, period) => sum + period.income, 0),
              currency
            )}</p>
            <p className="text-xs text-gray-400 mt-1">Total do período</p>
          </Card>
          
          <Card className="bg-finance-dark-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDown className="text-red-500" size={20} />
              <h3 className="text-gray-300">Saídas</h3>
            </div>
            <p className="text-xl font-bold text-white break-words">{formatCurrencyValue(
              chartData.reduce((sum, period) => sum + period.expense, 0),
              currency
            )}</p>
            <p className="text-xs text-gray-400 mt-1">Total do período</p>
          </Card>
        </div>
        
        <Card className="bg-finance-dark-card p-4 mb-4 overflow-visible">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-blue-500" size={20} />
            <h3 className="text-gray-300">Investimentos (com retornos)</h3>
          </div>
          <p className="text-xl font-bold text-white break-words">
            {formatCurrencyValue(getTotalInvestmentsWithReturns(), currency)}
          </p>
          <div className="text-sm text-gray-400 mt-1 break-words">
            <p>Investido: {formatCurrencyValue(getTotalInvestments(), currency)}</p>
            <p>Retorno projetado (3 meses): {formatCurrencyValue(getProjectedInvestmentReturn(3), currency)}</p>
            <p>Retorno projetado (12 meses): {formatCurrencyValue(getProjectedInvestmentReturn(12), currency)}</p>
          </div>
        </Card>
      </div>
      
      <BottomNav />
    </div>
  );
};

export default CashFlow;
