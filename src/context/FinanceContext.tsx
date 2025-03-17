
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

type User = {
  id: string;
  name: string;
  profileImage?: string;
};

type Expense = {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: Date;
  recurring?: {
    type: 'daily' | 'weekly' | 'monthly';
    days?: number[]; // Days of month for monthly recurring
  };
  installment?: {
    total: number;
    current: number;
    remaining: number;
  };
};

type Income = {
  id: string;
  description: string;
  amount: number;
  date: Date;
  recurring?: boolean;
};

type Investment = {
  id: string;
  description: string;
  amount: number;
  rate: number; // Percentage
  period: 'monthly' | 'annual';
  startDate: Date;
};

type UserFinances = {
  incomes: Income[];
  expenses: Expense[];
  investments: Investment[];
  balance: number;
};

type FinanceContextType = {
  currentUser: User | null;
  users: User[];
  finances: Record<string, UserFinances>;
  login: (userId: string, remember: boolean) => void;
  logout: () => void;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  addIncome: (income: Omit<Income, 'id'>) => Promise<void>;
  addInvestment: (investment: Omit<Investment, 'id'>) => void;
  calculateBalance: () => number;
  getMonthlyExpenseTotal: () => number;
  getFutureTransactions: () => { date: Date; description: string; amount: number; type: 'income' | 'expense' }[];
  simulateExpense: (expense: Omit<Expense, 'id'>) => number;
  fetchTransactions: () => Promise<void>;
};

// Predefined users
const predefinedUsers: User[] = [
  {
    id: 'user1',
    name: 'Usuário 1',
    profileImage: '/profile1.jpg',
  },
  {
    id: 'user2',
    name: 'Usuário 2',
    profileImage: '/profile2.jpg',
  },
];

// Default finances for users
const defaultFinances: Record<string, UserFinances> = {
  user1: {
    incomes: [],
    expenses: [],
    investments: [],
    balance: 0,
  },
  user2: {
    incomes: [],
    expenses: [],
    investments: [],
    balance: 0,
  },
};

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [finances, setFinances] = useState<Record<string, UserFinances>>(defaultFinances);
  const [loading, setLoading] = useState(true);

  // Load data from localStorage on initial render
  useEffect(() => {
    const savedUser = localStorage.getItem('financeCurrentUser');
    
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    if (currentUser && !loading) {
      fetchTransactions();
    }
  }, [currentUser, loading]);

  const fetchTransactions = async () => {
    if (!currentUser) return;

    try {
      // Fetch expenses and incomes from Supabase
      const { data, error } = await supabase
        .from('finances')
        .select('*')
        .eq('user_id', currentUser.id);

      if (error) {
        console.error('Error fetching finances:', error);
        return;
      }

      const incomes: Income[] = [];
      const expenses: Expense[] = [];

      // Process the data
      data.forEach(item => {
        if (item.type === 'income') {
          incomes.push({
            id: item.id,
            description: item.description,
            amount: item.amount,
            date: new Date(item.date),
            recurring: item.recurring
          });
        } else {
          expenses.push({
            id: item.id,
            description: item.description,
            amount: item.amount,
            category: item.category,
            date: new Date(item.date),
            recurring: item.recurring ? {
              type: item.recurring_type,
              days: item.recurring_days
            } : undefined,
            installment: item.installment_total ? {
              total: item.installment_total,
              current: item.installment_current,
              remaining: item.installment_total - item.installment_current
            } : undefined
          });
        }
      });

      setFinances(prev => ({
        ...prev,
        [currentUser.id]: {
          ...prev[currentUser.id],
          incomes,
          expenses,
          balance: calculateBalanceFromData(incomes, expenses)
        }
      }));
    } catch (error) {
      console.error('Error in fetchTransactions:', error);
    }
  };

  const calculateBalanceFromData = (incomes: Income[], expenses: Expense[]) => {
    const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    return totalIncome - totalExpenses;
  };

  const login = (userId: string, remember: boolean) => {
    const user = predefinedUsers.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      if (remember) {
        localStorage.setItem('financeCurrentUser', JSON.stringify(user));
      }
      fetchTransactions();
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('financeCurrentUser');
  };

  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    if (!currentUser) return;
    
    try {
      const { data, error } = await supabase
        .from('finances')
        .insert({
          user_id: currentUser.id,
          type: 'expense',
          description: expense.description,
          amount: expense.amount,
          category: expense.category,
          date: expense.date.toISOString(),
          recurring: !!expense.recurring,
          recurring_type: expense.recurring?.type,
          recurring_days: expense.recurring?.days,
          installment_total: expense.installment?.total,
          installment_current: expense.installment?.current || 1
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding expense:', error);
        return;
      }

      // Update the local state with the new expense
      const newExpense: Expense = {
        id: data.id,
        description: data.description,
        amount: data.amount,
        category: data.category,
        date: new Date(data.date),
        recurring: data.recurring ? {
          type: data.recurring_type,
          days: data.recurring_days
        } : undefined,
        installment: data.installment_total ? {
          total: data.installment_total,
          current: data.installment_current,
          remaining: data.installment_total - data.installment_current
        } : undefined
      };

      setFinances(prev => ({
        ...prev,
        [currentUser.id]: {
          ...prev[currentUser.id],
          expenses: [...prev[currentUser.id].expenses, newExpense],
          balance: prev[currentUser.id].balance - expense.amount
        }
      }));
    } catch (error) {
      console.error('Error in addExpense:', error);
    }
  };

  const addIncome = async (income: Omit<Income, 'id'>) => {
    if (!currentUser) return;
    
    try {
      const { data, error } = await supabase
        .from('finances')
        .insert({
          user_id: currentUser.id,
          type: 'income',
          description: income.description,
          amount: income.amount,
          category: 'income',
          date: income.date.toISOString(),
          recurring: income.recurring
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding income:', error);
        return;
      }

      // Update the local state with the new income
      const newIncome: Income = {
        id: data.id,
        description: data.description,
        amount: data.amount,
        date: new Date(data.date),
        recurring: data.recurring
      };

      setFinances(prev => ({
        ...prev,
        [currentUser.id]: {
          ...prev[currentUser.id],
          incomes: [...prev[currentUser.id].incomes, newIncome],
          balance: prev[currentUser.id].balance + income.amount
        }
      }));
    } catch (error) {
      console.error('Error in addIncome:', error);
    }
  };

  const addInvestment = (investment: Omit<Investment, 'id'>) => {
    if (!currentUser) return;
    
    const newInvestment: Investment = {
      ...investment,
      id: Date.now().toString(),
    };
    
    setFinances(prev => ({
      ...prev,
      [currentUser.id]: {
        ...prev[currentUser.id],
        investments: [...prev[currentUser.id].investments, newInvestment],
      },
    }));
  };

  const calculateBalance = () => {
    if (!currentUser) return 0;
    
    const userFinances = finances[currentUser.id];
    
    // Calculate total income
    const totalIncome = userFinances.incomes.reduce((sum, income) => sum + income.amount, 0);
    
    // Calculate total expenses
    const totalExpenses = userFinances.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    return totalIncome - totalExpenses;
  };

  const getMonthlyExpenseTotal = () => {
    if (!currentUser) return 0;
    
    const userFinances = finances[currentUser.id];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // Calculate total expenses for the current month
    return userFinances.expenses.reduce((sum, expense) => {
      const expenseDate = new Date(expense.date);
      const isCurrentMonth = expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
      
      if (isCurrentMonth) {
        return sum + expense.amount;
      }
      
      // Handle recurring expenses
      if (expense.recurring) {
        if (expense.recurring.type === 'daily') {
          // Calculate daily expenses for the month
          const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
          return sum + (expense.amount * daysInMonth);
        }
        
        if (expense.recurring.type === 'weekly') {
          // Approximately 4 weeks in a month
          return sum + (expense.amount * 4);
        }
        
        if (expense.recurring.type === 'monthly' && expense.recurring.days) {
          // Sum expenses for all selected days in the month
          return sum + (expense.amount * expense.recurring.days.length);
        }
      }
      
      return sum;
    }, 0);
  };

  const getFutureTransactions = () => {
    if (!currentUser) return [];
    
    const userFinances = finances[currentUser.id];
    const today = new Date();
    const futureTransactions: { date: Date; description: string; amount: number; type: 'income' | 'expense' }[] = [];
    
    // Get future expenses (including installments and recurring)
    userFinances.expenses.forEach(expense => {
      const expenseDate = new Date(expense.date);
      
      // Future one-time expenses
      if (expenseDate > today && !expense.recurring && !expense.installment) {
        futureTransactions.push({
          date: expenseDate,
          description: expense.description,
          amount: expense.amount,
          type: 'expense'
        });
      }
      
      // Installment expenses
      if (expense.installment && expense.installment.remaining > 0) {
        const installmentAmount = expense.amount;
        
        // Create future transactions for each remaining installment
        for (let i = 1; i <= expense.installment.remaining; i++) {
          const futureDate = new Date(expenseDate);
          futureDate.setMonth(futureDate.getMonth() + i);
          
          futureTransactions.push({
            date: futureDate,
            description: `${expense.description} (${expense.installment.current + i}/${expense.installment.total})`,
            amount: installmentAmount,
            type: 'expense'
          });
        }
      }
      
      // Recurring expenses
      if (expense.recurring) {
        const nextThreeMonths = [
          new Date(today.getFullYear(), today.getMonth() + 1, 1),
          new Date(today.getFullYear(), today.getMonth() + 2, 1),
          new Date(today.getFullYear(), today.getMonth() + 3, 1)
        ];
        
        nextThreeMonths.forEach(month => {
          if (expense.recurring?.type === 'monthly' && expense.recurring.days) {
            expense.recurring.days.forEach(day => {
              const futureDate = new Date(month.getFullYear(), month.getMonth(), day);
              
              // Only add if it's in the future
              if (futureDate > today) {
                futureTransactions.push({
                  date: futureDate,
                  description: `${expense.description} (Mensal)`,
                  amount: expense.amount,
                  type: 'expense'
                });
              }
            });
          } else if (expense.recurring?.type === 'weekly') {
            // Add for each week in the month
            for (let week = 0; week < 4; week++) {
              const futureDate = new Date(month.getFullYear(), month.getMonth(), 1 + (week * 7));
              
              if (futureDate > today) {
                futureTransactions.push({
                  date: futureDate,
                  description: `${expense.description} (Semanal)`,
                  amount: expense.amount,
                  type: 'expense'
                });
              }
            }
          }
        });
      }
    });
    
    // Add future recurring incomes
    userFinances.incomes.forEach(income => {
      if (income.recurring) {
        // Assume monthly recurring for incomes
        const nextThreeMonths = [
          new Date(today.getFullYear(), today.getMonth() + 1, 1),
          new Date(today.getFullYear(), today.getMonth() + 2, 1),
          new Date(today.getFullYear(), today.getMonth() + 3, 1)
        ];
        
        nextThreeMonths.forEach(month => {
          const futureDate = new Date(month);
          futureDate.setDate(new Date(income.date).getDate()); // Keep same day of month
          
          if (futureDate > today) {
            futureTransactions.push({
              date: futureDate,
              description: `${income.description} (Mensal)`,
              amount: income.amount,
              type: 'income'
            });
          }
        });
      }
    });
    
    // Sort by date
    return futureTransactions.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const simulateExpense = (expense: Omit<Expense, 'id'>) => {
    if (!currentUser) return 0;
    
    // Current balance
    const currentBalance = calculateBalance();
    
    // Return the new balance after the simulated expense
    return currentBalance - expense.amount;
  };

  return (
    <FinanceContext.Provider
      value={{
        currentUser,
        users: predefinedUsers,
        finances,
        login,
        logout,
        addExpense,
        addIncome,
        addInvestment,
        calculateBalance,
        getMonthlyExpenseTotal,
        getFutureTransactions,
        simulateExpense,
        fetchTransactions
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
