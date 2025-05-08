import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDateRangePicker } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn, formatCurrency } from '@/lib/utils';
import { useFinance } from '@/context/FinanceContext';
import { TransactionType } from '@/context/finance/types';
import { CalendarIcon, ChevronsUpDown } from "lucide-react";
import { format } from 'date-fns';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { PopoverClose } from '@radix-ui/react-popover';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import BottomNav from '@/components/ui/bottom-nav';

const Dashboard = () => {
  const { 
    currentUser, 
    finances, 
    getFutureTransactions, 
    fetchTransactions,
    deleteTransaction,
    getUniqueTransactionsByMonth,
    supabaseUser,
    selectedProfile,
    selectProfile,
    isAuthenticated,
    loading
  } = useFinance();
  const navigate = useNavigate();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [futureTransactions, setFutureTransactions] = useState<any[] | null>(null);
  const [profiles, setProfiles] = useState([
    {
      id: supabaseUser?.id,
      name: supabaseUser?.email
    }
  ]);
  const [open, setOpen] = React.useState(false)

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (currentUser && date) {
      const future = getFutureTransactions(date);
      setFutureTransactions(future);
    }
  }, [currentUser, date, getFutureTransactions]);

  useEffect(() => {
    if (supabaseUser) {
      setProfiles([
        {
          id: supabaseUser?.id,
          name: supabaseUser?.email
        }
      ])
    }
  }, [supabaseUser])

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Not authenticated</div>;
  }

  const userFinances = finances[currentUser.id];
  const transactions = userFinances ? [...userFinances.incomes, ...userFinances.expenses] : [];

  const calculateBalance = () => {
    if (!userFinances) return 0;
    
    let balance = 0;
    userFinances.incomes.forEach(income => balance += income.amount);
    userFinances.expenses.forEach(expense => balance -= expense.amount);
    return balance;
  };

  const balance = calculateBalance();

  const calculateCumulativeBalance = (transactions: any[], targetDate: Date) => {
    const allTransactionsUpToDate = transactions.filter(trans => {
      const transDate = new Date(trans.date);
      return transDate <= targetDate;
    });
    
    // Calculate balance from all transactions up to target date
    return allTransactionsUpToDate.reduce((balance, transaction) => {
      // Check if it's an income or expense
      if (transaction.type === TransactionType.INCOME) {
        return balance + transaction.amount;
      } else if (transaction.type === TransactionType.EXPENSE) {
        return balance - transaction.amount;
      }
      return balance;
    }, 0);
  };

  const formatDateForDisplay = (date: Date | undefined) => {
    return date ? format(date, 'MMM yyyy') : 'Select a Date';
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      await deleteTransaction(transactionId);
      toast.success("Transação excluída com sucesso");
      await fetchTransactions();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error("Erro ao excluir transação");
    }
  };

  const renderFutureTransactions = () => {
    if (!futureTransactions || futureTransactions.length === 0) {
      return null;
    }

    return futureTransactions.slice(0, 3).map((transaction, index) => {
      const isIncome = transaction.type === TransactionType.INCOME;
      // Remove references to transaction.recurring
      return (
        <div key={index} className="flex items-center justify-between p-3 border-b border-gray-800">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
              isIncome ? 'bg-green-500/20' : 'bg-red-500/20'
            }`}>
              {isIncome ? (
                <ArrowUp className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDown className="w-4 h-4 text-red-500" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{transaction.description}</p>
              <p className="text-xs text-gray-400">
                {new Date(transaction.date).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className={`font-medium ${isIncome ? 'text-green-500' : 'text-red-500'}`}>
              {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
            </p>
          </div>
        </div>
      );
    });
  };

  const renderBottomCards = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <Card className="finance-card">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-white mb-2">Receita Total</h3>
            <p className="text-2xl font-bold text-green-500">{formatCurrency(userFinances?.incomes.reduce((sum, income) => sum + income.amount, 0) || 0)}</p>
          </div>
        </Card>
        
        <Card className="finance-card">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-white mb-2">Despesa Total</h3>
            <p className="text-2xl font-bold text-red-500">{formatCurrency(userFinances?.expenses.reduce((sum, expense) => sum + expense.amount, 0) || 0)}</p>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-finance-dark pb-20">
      <div className="finance-card rounded-b-xl">
        <div className="flex justify-between items-center mb-4">
          <div>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  role="combobox"
                  aria-expanded={open}
                  className="w-[200px] justify-between"
                >
                  {selectedProfile ? (profiles.find((profile) => profile.id === selectedProfile)?.name) : "Select profile..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
                <Command>
                  <CommandList>
                    <CommandEmpty>No profiles found.</CommandEmpty>
                    <CommandGroup>
                      {profiles.map((profile) => (
                        <CommandItem
                          key={profile.id}
                          value={profile.name}
                          onSelect={() => {
                            selectProfile(profile.id)
                            setOpen(false)
                          }}
                        >
                          {profile.name}
                          {selectedProfile === profile.id ? (
                            <CheckIcon className="ml-auto h-4 w-4" />
                          ) : null}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                  <CommandSeparator />
                  <CommandList>
                    <CommandGroup>
                      <CommandItem onSelect={() => {
                        setOpen(false)
                        navigate('/profiles')
                      }}>
                        Manage profiles
                      </CommandItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <div className="w-10"></div>
        </div>

        <div className="flex justify-between items-center">
          <div className="w-full">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"ghost"}
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formatDateForDisplay(date)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <CalendarDateRangePicker
                  date={date}
                  onDateChange={setDate}
                  mode="single"
                  showDate={false}
                />
                <PopoverClose>Close</PopoverClose>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      <div className="mt-6 px-4">
        <Card className="finance-card">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-finance-blue flex items-center justify-center">
                <Calendar size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Saldo Atual</h2>
                <p className="text-gray-400">
                  {date ? `Em ${new Date(date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}` : 'Selecione um mês'}
                </p>
              </div>
            </div>

            <div>
              <p className="text-3xl font-bold text-white">{formatCurrency(calculateCumulativeBalance(transactions, date || new Date()))}</p>
            </div>
          </div>
        </Card>

        {renderBottomCards()}

        <div className="mt-6">
          <div className="flex justify-between items-center px-1 mb-3">
            <h2 className="text-lg font-bold text-white">Próximas Transações</h2>
            {futureTransactions && futureTransactions.length > 3 && (
              <Button variant="link" className="text-sm">
                Ver todas
              </Button>
            )}
          </div>
          {futureTransactions && futureTransactions.length > 0 ? (
            <Card className="finance-card">
              {renderFutureTransactions()}
            </Card>
          ) : (
            <div className="mt-4 text-center">
              <p className="text-gray-400">Nenhuma transação futura encontrada para este mês.</p>
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Dashboard;

const CheckIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
};
