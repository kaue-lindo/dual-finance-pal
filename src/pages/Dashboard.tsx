
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet, Menu, MoreVertical } from 'lucide-react';
import { formatDate, formatCurrency, formatCompactCurrency, cn } from '@/lib/utils';
import TransactionsList from '@/components/TransactionsList';
import { useFinance } from '@/context/FinanceContext';
import BottomNav from '@/components/ui/bottom-nav';
import { useIsMobile } from '@/hooks/use-mobile';
import QuickActions from '@/components/QuickActions';

const Dashboard = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { currentUser, fetchTransactions, getFutureTransactions, finances } = useFinance();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activePeriod, setActivePeriod] = useState<'day' | 'week' | 'month'>('day');
  
  useEffect(() => {
    if (currentUser) {
      fetchTransactions();
    } else {
      navigate('/login');
    }
  }, [currentUser, fetchTransactions, navigate]);
  
  if (!currentUser) {
    return null;
  }
  
  const userFinances = finances[currentUser.id] || { incomes: [], expenses: [], balance: 0 };
  
  const formattedDate = formatDate(new Date(), 'MMMM, yyyy');
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
  
  const goToPreviousMonth = () => {
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setCurrentMonth(prevMonth);
  };
  
  const goToNextMonth = () => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentMonth(nextMonth);
  };
  
  const goToCurrentMonth = () => {
    setCurrentMonth(new Date());
  };
  
  const futureTransactions = getFutureTransactions();
  
  const firstDayOfCurrentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const lastDayOfCurrentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  
  const filterTransactionsByPeriod = () => {
    const today = new Date();
    const currentDate = today.getDate();
    const currentMonthYear = `${today.getMonth()}-${today.getFullYear()}`;
    const displayedMonthYear = `${currentMonth.getMonth()}-${currentMonth.getFullYear()}`;
    const isCurrentMonth = currentMonthYear === displayedMonthYear;
    
    let startDate, endDate;
    
    if (activePeriod === 'day' && isCurrentMonth) {
      startDate = new Date(today.setHours(0, 0, 0, 0));
      endDate = new Date(today.setHours(23, 59, 59, 999));
    } else if (activePeriod === 'week' && isCurrentMonth) {
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      startDate = new Date(today.setDate(diff));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate = new Date(firstDayOfCurrentMonth);
      endDate = new Date(lastDayOfCurrentMonth);
    }
    
    return futureTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  };
  
  const filteredTransactions = filterTransactionsByPeriod();
  
  const calculateIncomeAndExpense = () => {
    let totalIncome = 0;
    let totalExpense = 0;
    
    filteredTransactions.forEach(transaction => {
      if (transaction.type === 'income') {
        totalIncome += transaction.amount;
      } else if (transaction.type === 'expense') {
        totalExpense += transaction.amount;
      }
    });
    
    return { totalIncome, totalExpense };
  };
  
  const { totalIncome, totalExpense } = calculateIncomeAndExpense();
  const balance = totalIncome - totalExpense;
  
  const currentDay = new Date().getDate();
  const month = currentMonth.getMonth();
  const year = currentMonth.getFullYear();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  
  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }
  
  const getTransactionsForDay = (day: number) => {
    const startOfDay = new Date(year, month, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month, day, 23, 59, 59, 999);
    
    return futureTransactions.filter(t => {
      const date = new Date(t.date);
      return date >= startOfDay && date <= endOfDay;
    });
  };
  
  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           month === today.getMonth() && 
           year === today.getFullYear();
  };

  // Formatação do nome do mês atual do calendário
  const currentMonthName = formatDate(currentMonth, 'MMMM yyyy');
  const capitalizedMonthName = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);

  return (
    <div className="min-h-screen pb-20 bg-finance-dark">
      <div className="finance-card rounded-b-xl p-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <span className="text-xl font-bold text-white mr-2">Olá, {currentUser.name || 'Usuário'}</span>
          </div>
          <div className="flex items-center gap-2">
            <QuickActions 
              trigger={
                <Button variant="ghost" size="icon" className="navbar-icon">
                  <Menu size={24} className="text-white" />
                </Button>
              }
            />
          </div>
        </div>
        
        <div className="text-center mb-6">
          <p className="text-sm text-gray-400 mb-1">Saldo Total</p>
          <p className="text-3xl font-bold text-white">{formatCurrency(userFinances.balance)}</p>
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <Button variant="ghost" size="icon" onClick={goToPreviousMonth} className="text-white">
            <ChevronLeft size={20} />
          </Button>
          <div 
            className="flex gap-1 items-center cursor-pointer"
            onClick={goToCurrentMonth}
          >
            <Calendar size={16} className="text-finance-blue" />
            <span className="text-white font-medium">{capitalizedDate}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={goToNextMonth} className="text-white">
            <ChevronRight size={20} />
          </Button>
        </div>
        
        <div className="flex justify-center items-center mt-4 mb-2">
          <div className="inline-flex rounded-md overflow-hidden border border-gray-700">
            <button
              className={cn(
                "px-4 py-2 text-sm transition-colors",
                activePeriod === 'day' 
                  ? "bg-finance-blue text-white" 
                  : "bg-finance-dark-lighter text-gray-300 hover:bg-finance-dark-card"
              )}
              onClick={() => setActivePeriod('day')}
            >
              Dia
            </button>
            <button
              className={cn(
                "px-4 py-2 text-sm transition-colors",
                activePeriod === 'week' 
                  ? "bg-finance-blue text-white" 
                  : "bg-finance-dark-lighter text-gray-300 hover:bg-finance-dark-card"
              )}
              onClick={() => setActivePeriod('week')}
            >
              Semana
            </button>
            <button
              className={cn(
                "px-4 py-2 text-sm transition-colors",
                activePeriod === 'month' 
                  ? "bg-finance-blue text-white" 
                  : "bg-finance-dark-lighter text-gray-300 hover:bg-finance-dark-card"
              )}
              onClick={() => setActivePeriod('month')}
            >
              Mês
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mt-4">
          <Card className="bg-finance-dark-lighter border-none">
            <div className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={16} className="text-green-500" />
                <p className="text-gray-400 text-sm">Entradas</p>
              </div>
              <p className="text-xl font-bold text-green-500">{formatCurrency(totalIncome)}</p>
            </div>
          </Card>
          
          <Card className="bg-finance-dark-lighter border-none">
            <div className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown size={16} className="text-red-500" />
                <p className="text-gray-400 text-sm">Saídas</p>
              </div>
              <p className="text-xl font-bold text-red-500">{formatCurrency(totalExpense)}</p>
            </div>
          </Card>
        </div>
      </div>
            
      <div className="px-4 mt-6">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-white">Calendário</h2>
            <span className="text-gray-400 text-sm">{capitalizedMonthName}</span>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => (
              <div key={index} className="text-center text-gray-400 text-xs">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="h-10" />;
              }
              
              const transactions = getTransactionsForDay(day);
              const hasIncome = transactions.some(t => t.type === 'income');
              const hasExpense = transactions.some(t => t.type === 'expense');
              const today = isToday(day);
              
              return (
                <div
                  key={`day-${day}`}
                  className={cn(
                    "h-10 rounded-full flex flex-col items-center justify-center cursor-pointer relative",
                    today && "bg-finance-blue text-white font-bold",
                    !today && "hover:bg-finance-dark-lighter"
                  )}
                  onClick={() => {
                    const currentDate = new Date();
                    const isCurrentMonth = currentDate.getMonth() === month && currentDate.getFullYear() === year;
                    
                    if (isCurrentMonth) {
                      currentDate.setDate(day);
                      setCurrentMonth(new Date(currentDate));
                      setActivePeriod('day');
                    }
                  }}
                >
                  <span className={cn(
                    "text-sm",
                    today ? "text-white" : "text-gray-300"
                  )}>
                    {day}
                  </span>
                  
                  <div className="flex gap-1 mt-1">
                    {hasIncome && (
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    )}
                    {hasExpense && (
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-white">Transações</h2>
            <Button 
              variant="ghost" 
              className="text-finance-blue hover:text-finance-blue/80 hover:bg-transparent p-0 h-auto"
              onClick={() => navigate('/transactions')}
            >
              Ver Todas
            </Button>
          </div>
          
          <TransactionsList 
            transactions={filteredTransactions.slice(0, 5)} 
            emptyMessage="Nenhuma transação neste período"
          />
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
};

export default Dashboard;
