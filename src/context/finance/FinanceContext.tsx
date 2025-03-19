
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  FinanceContextType, 
  UserFinances, 
  Expense, 
  Income, 
  Investment,
  FutureTransaction,
  IncomeCategory
} from './types';
import { 
  incomeCategories, 
  categoryAllocationMap, 
  predefinedUsers, 
  defaultFinances 
} from './constants';
import { calculateBalanceFromData } from './utils';

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [finances, setFinances] = useState<Record<string, UserFinances>>(defaultFinances);
  const [loading, setLoading] = useState(true);

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
      const investments: Investment[] = [];

      // Initialize the finance record for the current user if it doesn't exist
      if (!finances[currentUser.id]) {
        setFinances(prev => ({
          ...prev,
          [currentUser.id]: {
            incomes: [],
            expenses: [],
            investments: [],
            balance: 0
          }
        }));
      }

      data.forEach(item => {
        if (item.type === 'income') {
          incomes.push({
            id: item.id,
            description: item.description,
            amount: parseFloat(item.amount.toString()),
            date: new Date(item.date),
            category: (item.category || 'other') as IncomeCategory,
            recurring: item.recurring
          });
        } else if (item.type === 'expense') {
          expenses.push({
            id: item.id,
            description: item.description,
            amount: parseFloat(item.amount.toString()),
            category: item.category || 'other',
            date: new Date(item.date),
            sourceCategory: item.source_category as IncomeCategory | undefined,
            recurring: item.recurring_type ? {
              type: item.recurring_type as 'daily' | 'weekly' | 'monthly',
              days: item.recurring_days
            } : undefined,
            installment: item.installment_total ? {
              total: item.installment_total,
              current: item.installment_current,
              remaining: item.installment_total - item.installment_current
            } : undefined
          });
        } else if (item.type === 'investment') {
          investments.push({
            id: item.id,
            description: item.description,
            amount: parseFloat(item.amount.toString()),
            rate: parseFloat(item.category),
            period: item.recurring_type as 'monthly' | 'annual',
            startDate: new Date(item.date)
          });
        }
      });

      // Add existing investments from the local state if they exist
      const existingInvestments = finances[currentUser.id]?.investments || [];
      const combinedInvestments = [...investments, ...existingInvestments];
      
      // Calculate balance correctly excluding investments
      const calculatedBalance = calculateBalanceFromData(incomes, expenses);
      
      setFinances(prev => ({
        ...prev,
        [currentUser.id]: {
          ...prev[currentUser.id],
          incomes,
          expenses,
          investments: combinedInvestments,
          balance: calculatedBalance
        }
      }));
    } catch (error) {
      console.error('Error in fetchTransactions:', error);
    }
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
    
    const sourceCategory = categoryAllocationMap[expense.category] || 'salary';
    
    try {
      const { data, error } = await supabase
        .from('finances')
        .insert({
          user_id: currentUser.id,
          type: 'expense',
          description: expense.description,
          amount: expense.amount,
          category: expense.category,
          source_category: sourceCategory,
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
        toast.error('Erro ao adicionar despesa');
        return;
      }

      const newExpense: Expense = {
        id: data.id,
        description: data.description,
        amount: parseFloat(data.amount.toString()),
        category: data.category || 'other',
        date: new Date(data.date),
        sourceCategory: data.source_category as IncomeCategory | undefined,
        recurring: data.recurring_type ? {
          type: data.recurring_type as 'daily' | 'weekly' | 'monthly',
          days: data.recurring_days
        } : undefined,
        installment: data.installment_total ? {
          total: data.installment_total,
          current: data.installment_current,
          remaining: data.installment_total - data.installment_current
        } : undefined
      };

      setFinances(prev => {
        // Ensure we have an entry for this user
        const userFinances = prev[currentUser.id] || {
          incomes: [],
          expenses: [],
          investments: [],
          balance: 0
        };
        
        const updatedExpenses = [...userFinances.expenses, newExpense];
        const updatedIncomes = [...userFinances.incomes];
        
        return {
          ...prev,
          [currentUser.id]: {
            ...userFinances,
            expenses: updatedExpenses,
            balance: calculateBalanceFromData(updatedIncomes, updatedExpenses)
          }
        };
      });
      
      toast.success('Despesa adicionada com sucesso');
    } catch (error) {
      console.error('Error in addExpense:', error);
      toast.error('Erro ao adicionar despesa');
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
          category: income.category,
          date: income.date.toISOString(),
          recurring: income.recurring
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding income:', error);
        toast.error('Erro ao adicionar receita');
        return;
      }

      const newIncome: Income = {
        id: data.id,
        description: data.description,
        amount: parseFloat(data.amount.toString()),
        date: new Date(data.date),
        category: data.category as IncomeCategory,
        recurring: data.recurring
      };

      setFinances(prev => {
        // Ensure we have an entry for this user
        const userFinances = prev[currentUser.id] || {
          incomes: [],
          expenses: [],
          investments: [],
          balance: 0
        };
        
        const updatedIncomes = [...userFinances.incomes, newIncome];
        const updatedExpenses = [...userFinances.expenses];
        
        return {
          ...prev,
          [currentUser.id]: {
            ...userFinances,
            incomes: updatedIncomes,
            balance: calculateBalanceFromData(updatedIncomes, updatedExpenses)
          }
        };
      });
      
      toast.success('Receita adicionada com sucesso');
    } catch (error) {
      console.error('Error in addIncome:', error);
      toast.error('Erro ao adicionar receita');
    }
  };

  const addInvestment = (investment: Omit<Investment, 'id'>) => {
    if (!currentUser) return;
    
    const newInvestment: Investment = {
      ...investment,
      id: Date.now().toString(),
    };
    
    // Insert the investment into supabase
    supabase
      .from('finances')
      .insert({
        user_id: currentUser.id,
        type: 'investment',
        description: investment.description,
        amount: investment.amount,
        category: investment.rate.toString(), // Store rate in category field
        date: investment.startDate.toISOString(),
        recurring_type: investment.period, // Store period in recurring_type
      })
      .then(({ error }) => {
        if (error) {
          console.error('Error saving investment to Supabase:', error);
          toast.error('Erro ao salvar investimento no banco de dados');
        }
      });
    
    setFinances(prev => {
      // Ensure we have an entry for this user
      const userFinances = prev[currentUser.id] || {
        incomes: [],
        expenses: [],
        investments: [],
        balance: 0
      };
      
      // When adding an investment, we reduce the balance by the investment amount
      const newBalance = calculateBalanceFromData(userFinances.incomes, userFinances.expenses) - investment.amount;
      
      return {
        ...prev,
        [currentUser.id]: {
          ...userFinances,
          investments: [...userFinances.investments, newInvestment],
          balance: newBalance,
        },
      };
    });
    
    toast.success('Investimento adicionado com sucesso');
  };

  const deleteInvestment = (id: string) => {
    if (!currentUser) return;
    
    const userFinances = finances[currentUser.id];
    const investment = userFinances.investments.find(inv => inv.id === id);
    
    if (!investment) {
      toast.error('Investimento não encontrado');
      return;
    }
    
    // Delete from Supabase if it exists there
    supabase
      .from('finances')
      .delete()
      .eq('id', id)
      .then(({ error }) => {
        if (error) {
          console.error('Error deleting investment from Supabase:', error);
          // Continue with local deletion even if Supabase delete fails
        }
      });
    
    setFinances(prev => {
      const currentFinances = prev[currentUser.id];
      const newInvestments = currentFinances.investments.filter(inv => inv.id !== id);
      
      // When removing an investment, we add the amount back to the balance
      const newBalance = calculateBalanceFromData(currentFinances.incomes, currentFinances.expenses);
      
      return {
        ...prev,
        [currentUser.id]: {
          ...currentFinances,
          investments: newInvestments,
          balance: newBalance,
        },
      };
    });
    
    toast.success('Investimento removido com sucesso');
  };

  const calculateBalance = () => {
    if (!currentUser) return 0;
    
    const userFinances = finances[currentUser.id] || { incomes: [], expenses: [] };
    return calculateBalanceFromData(userFinances.incomes, userFinances.expenses);
  };

  const getMonthlyExpenseTotal = () => {
    if (!currentUser) return 0;
    
    const userFinances = finances[currentUser.id] || { expenses: [] };
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return userFinances.expenses.reduce((sum, expense) => {
      const expenseDate = new Date(expense.date);
      const isCurrentMonth = expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
      
      if (isCurrentMonth) {
        return sum + expense.amount;
      }
      
      if (expense.recurring) {
        if (expense.recurring.type === 'daily') {
          const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
          return sum + (expense.amount * daysInMonth);
        }
        
        if (expense.recurring.type === 'weekly') {
          return sum + (expense.amount * 4);
        }
        
        if (expense.recurring.type === 'monthly' && expense.recurring.days) {
          return sum + (expense.amount * expense.recurring.days.length);
        }
      }
      
      return sum;
    }, 0);
  };

  const getFutureTransactions = (): FutureTransaction[] => {
    if (!currentUser) return [];
    
    const userFinances = finances[currentUser.id] || { expenses: [], incomes: [], investments: [] };
    const today = new Date();
    const futureTransactions: FutureTransaction[] = [];
    
    // Look ahead for 24 months instead of just 3
    const monthsToLookAhead = 24;
    
    userFinances.expenses.forEach(expense => {
      const expenseDate = new Date(expense.date);
      
      if (expenseDate > today) {
        futureTransactions.push({
          id: expense.id,
          date: expenseDate,
          description: expense.description,
          amount: expense.amount,
          type: 'expense',
          category: expense.category,
          sourceCategory: expense.sourceCategory
        });
      }
      
      if (expense.installment && expense.installment.remaining > 0) {
        const installmentAmount = expense.amount;
        
        for (let i = 1; i <= expense.installment.remaining; i++) {
          const futureDate = new Date(expenseDate);
          futureDate.setMonth(futureDate.getMonth() + i);
          
          futureTransactions.push({
            id: `${expense.id}-installment-${i}`,
            date: futureDate,
            description: `${expense.description} (${expense.installment.current + i}/${expense.installment.total})`,
            amount: installmentAmount,
            type: 'expense',
            category: expense.category,
            sourceCategory: expense.sourceCategory
          });
        }
      }
      
      if (expense.recurring) {
        const nextMonths = [];
        for (let i = 1; i <= monthsToLookAhead; i++) {
          nextMonths.push(new Date(today.getFullYear(), today.getMonth() + i, 1));
        }
        
        nextMonths.forEach(month => {
          if (expense.recurring?.type === 'monthly' && expense.recurring.days) {
            expense.recurring.days.forEach(day => {
              const futureDate = new Date(month.getFullYear(), month.getMonth(), day);
              
              if (futureDate > today) {
                futureTransactions.push({
                  id: `${expense.id}-recurring-${month.getMonth()}-${day}`,
                  date: futureDate,
                  description: `${expense.description} (Mensal)`,
                  amount: expense.amount,
                  type: 'expense',
                  category: expense.category,
                  sourceCategory: expense.sourceCategory
                });
              }
            });
          } else if (expense.recurring?.type === 'weekly') {
            for (let week = 0; week < 4; week++) {
              const futureDate = new Date(month.getFullYear(), month.getMonth(), 1 + (week * 7));
              
              if (futureDate > today) {
                futureTransactions.push({
                  id: `${expense.id}-recurring-weekly-${month.getMonth()}-${week}`,
                  date: futureDate,
                  description: `${expense.description} (Semanal)`,
                  amount: expense.amount,
                  type: 'expense',
                  category: expense.category,
                  sourceCategory: expense.sourceCategory
                });
              }
            }
          }
        });
      }
    });
    
    userFinances.incomes.forEach(income => {
      const incomeDate = new Date(income.date);
      
      if (incomeDate > today) {
        futureTransactions.push({
          id: income.id,
          date: incomeDate,
          description: income.description,
          amount: income.amount,
          type: 'income',
          category: income.category
        });
      }
      
      if (income.recurring) {
        const nextMonths = [];
        for (let i = 1; i <= monthsToLookAhead; i++) {
          nextMonths.push(new Date(today.getFullYear(), today.getMonth() + i, 1));
        }
        
        nextMonths.forEach(month => {
          const futureDate = new Date(month);
          futureDate.setDate(new Date(income.date).getDate());
          
          if (futureDate > today) {
            futureTransactions.push({
              id: `${income.id}-recurring-${month.getMonth()}`,
              date: futureDate,
              description: `${income.description} (Mensal)`,
              amount: income.amount,
              type: 'income',
              category: income.category
            });
          }
        });
      }
    });

    userFinances.investments.forEach(investment => {
      const months = 24; // Look ahead for 24 months for investments
      const rate = investment.rate / 100;
      const effectiveRate = investment.period === 'monthly' ? rate : rate / 12;
      
      for (let i = 1; i <= months; i++) {
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + i);
        
        const growthFactor = Math.pow(1 + effectiveRate, i);
        const futureValue = investment.amount * growthFactor;
        const growthAmount = futureValue - investment.amount;
        
        // Show returns every 3 months, 6 months, 12 months and 24 months
        if (i === 3 || i === 6 || i === 12 || i === 24) {
          futureTransactions.push({
            id: `${investment.id}-growth-${i}`,
            date: futureDate,
            description: `${investment.description} (Rendimento ${i} meses)`,
            amount: growthAmount,
            type: 'income',
            category: 'investment-return'
          });
        }
      }
    });
    
    return futureTransactions.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const simulateExpense = (expense: Omit<Expense, 'id'>) => {
    if (!currentUser) return 0;
    
    const currentBalance = calculateBalance();
    
    return currentBalance - expense.amount;
  };

  const deleteTransaction = async (id: string) => {
    if (!currentUser) return;
    
    try {
      if (!id.includes('-installment-') && !id.includes('-recurring-') && !id.includes('-growth-')) {
        console.log('Deleting transaction with ID:', id);
        
        const { error } = await supabase
          .from('finances')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Error deleting transaction:', error);
          toast.error('Erro ao remover transação');
          return;
        }
        
        await fetchTransactions();
        toast.success('Transação removida com sucesso');
      } else {
        let baseId;
        if (id.includes('-installment-')) {
          baseId = id.split('-installment-')[0];
        } else if (id.includes('-recurring-')) {
          baseId = id.split('-recurring-')[0];
        } else if (id.includes('-growth-')) {
          toast.success('Transação removida da visualização');
          return;
        }
        
        if (baseId) {
          console.log('Deleting base transaction with ID:', baseId);
          
          const { error } = await supabase
            .from('finances')
            .delete()
            .eq('id', baseId);

          if (error) {
            console.error('Error deleting base transaction:', error);
            toast.error('Erro ao remover transação');
          } else {
            await fetchTransactions();
            toast.success('Transação e suas futuras ocorrências removidas com sucesso');
          }
        }
      }
    } catch (error) {
      console.error('Error in deleteTransaction:', error);
      toast.error('Erro ao remover transação');
    }
  };

  const getIncomeCategories = () => {
    return incomeCategories;
  };

  const getTotalInvestments = () => {
    if (!currentUser) return 0;
    const userFinances = finances[currentUser.id] || { investments: [] };
    return userFinances.investments.reduce((sum, investment) => sum + investment.amount, 0);
  };

  const getProjectedInvestmentReturn = (months = 12) => {
    if (!currentUser) return 0;
    
    const userFinances = finances[currentUser.id] || { investments: [] };
    let totalReturn = 0;
    
    userFinances.investments.forEach(investment => {
      const rate = investment.rate / 100;
      const effectiveRate = investment.period === 'monthly' ? rate : rate / 12;
      
      const growthFactor = Math.pow(1 + effectiveRate, months);
      const futureValue = investment.amount * growthFactor;
      const growthAmount = futureValue - investment.amount;
      
      totalReturn += growthAmount;
    });
    
    return totalReturn;
  };

  const getCategoryExpenses = () => {
    if (!currentUser) return [];
    
    const userFinances = finances[currentUser.id] || { expenses: [] };
    const categoryMap: Record<string, number> = {};
    
    userFinances.expenses.forEach(expense => {
      const category = expense.category || 'other';
      categoryMap[category] = (categoryMap[category] || 0) + expense.amount;
    });
    
    return Object.entries(categoryMap).map(([category, amount]) => ({
      category,
      amount
    }));
  };

  const getRealIncome = () => {
    if (!currentUser) return 0;
    
    const userFinances = finances[currentUser.id] || { incomes: [] };
    return userFinances.incomes.reduce((sum, income) => sum + income.amount, 0);
  };

  // New function to update user profile
  const updateUserProfile = (userData: { name?: string, avatarUrl?: string }) => {
    if (!currentUser) return;
    
    const updatedUser = {
      ...currentUser,
      name: userData.name || currentUser.name,
      avatarUrl: userData.avatarUrl || currentUser.avatarUrl
    };
    
    setCurrentUser(updatedUser);
    
    // Save to localStorage if "remember me" was checked
    if (localStorage.getItem('financeCurrentUser')) {
      localStorage.setItem('financeCurrentUser', JSON.stringify(updatedUser));
    }
    
    toast.success('Perfil atualizado com sucesso');
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
        deleteInvestment,
        calculateBalance,
        getMonthlyExpenseTotal,
        getFutureTransactions,
        simulateExpense,
        fetchTransactions,
        deleteTransaction,
        getIncomeCategories,
        getTotalInvestments,
        getProjectedInvestmentReturn,
        getCategoryExpenses,
        getRealIncome,
        updateUserProfile
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
