import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FutureTransaction, Income, Expense, Investment, IncomeCategory, UserFinances } from '../types';
import { calculateBalanceFromData } from '../utils/calculations';
import { getMonthlyReturn, calculateInvestmentGrowthForMonth } from '../utils/projections';

export const useTransactions = (
  currentUser: any,
  finances: Record<string, any>,
  setFinances: React.Dispatch<React.SetStateAction<Record<string, any>>>
) => {
  const fetchTransactions = async () => {
    if (!currentUser) return;

    try {
      console.log("Fetching transactions for user:", currentUser.id);
      const { data, error } = await supabase
        .from('finances')
        .select('*')
        .eq('user_id', currentUser.id);

      if (error) {
        console.error('Error fetching finances:', error);
        return;
      }

      console.log("Fetched transaction data:", data);
      const incomes: Income[] = [];
      const expenses: Expense[] = [];
      const investments: Investment[] = [];

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
            rate: parseFloat(item.recurring_type === 'compound' ? '5' : item.recurring_type || "0"),
            period: item.recurring_type === 'compound' ? 'monthly' : (item.recurring_type as 'monthly' | 'annual' || 'monthly'),
            startDate: new Date(item.date),
            isCompound: item.is_compound
          });
        }
      });

      const existingInvestments = finances[currentUser.id]?.investments || [];
      const existingIds = new Set(investments.map(inv => inv.id));
      const uniqueExistingInvestments = existingInvestments.filter(inv => !existingIds.has(inv.id));
      const combinedInvestments = [...investments, ...uniqueExistingInvestments];
      
      const incomeTotal = incomes.reduce((sum, inc) => sum + inc.amount, 0);
      const expenseTotal = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const investmentTotal = investments.reduce((sum, inv) => sum + inv.amount, 0);
      const calculatedBalance = incomeTotal - expenseTotal - investmentTotal;
      
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

  const getFutureTransactions = (): FutureTransaction[] => {
    if (!currentUser) return [];
    
    const userFinances = finances[currentUser.id] || { expenses: [], incomes: [], investments: [] };
    const today = new Date();
    const futureTransactions: FutureTransaction[] = [];
    
    const monthsToLookAhead = 24;
    
    userFinances.expenses.forEach(expense => {
      const expenseDate = new Date(expense.date);
      
      const currentMonth = today.getMonth();
      const expenseMonth = expenseDate.getMonth();
      const expenseYear = expenseDate.getFullYear();
      const currentYear = today.getFullYear();
      
      if ((expenseMonth === currentMonth && expenseYear === currentYear) || expenseDate > today) {
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
        for (let i = 0; i <= monthsToLookAhead; i++) {
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
      
      const currentMonth = today.getMonth();
      const incomeMonth = incomeDate.getMonth();
      const incomeYear = incomeDate.getFullYear();
      const currentYear = today.getFullYear();
      
      if ((incomeMonth === currentMonth && incomeYear === currentYear) || incomeDate > today) {
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
        for (let i = 0; i <= monthsToLookAhead; i++) {
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
      const months = 24;
      
      const investmentDate = new Date(investment.startDate);
      const currentMonth = today.getMonth();
      const investmentMonth = investmentDate.getMonth();
      const investmentYear = investmentDate.getFullYear();
      const currentYear = today.getFullYear();
      
      if ((investmentMonth === currentMonth && investmentYear === currentYear) || investmentDate > today) {
        futureTransactions.push({
          id: `${investment.id}-initial`,
          date: investmentDate,
          description: `${investment.description} (Investimento Inicial)`,
          amount: investment.amount,
          type: 'investment',
          category: 'investment'
        });
      }
      
      for (let i = 1; i <= months; i++) {
        const futureDate = new Date(investmentDate);
        futureDate.setMonth(futureDate.getMonth() + i);
        
        if (futureDate < today) continue;
        
        const isPeriodMonthly = investment.period === 'monthly';
        const isCompoundType = investment.isCompound !== false;
        
        let monthlyGrowth: number;
        
        if (isCompoundType) {
          const previousMonthValue = calculateInvestmentGrowthForMonth(
            investment.amount, investment.rate, isPeriodMonthly, i-1, true
          );
          const currentMonthValue = calculateInvestmentGrowthForMonth(
            investment.amount, investment.rate, isPeriodMonthly, i, true
          );
          monthlyGrowth = currentMonthValue - previousMonthValue;
        } else {
          const monthlyRate = isPeriodMonthly ? 
            investment.rate / 100 : 
            investment.rate / 12 / 100;
          monthlyGrowth = investment.amount * monthlyRate;
        }
        
        futureTransactions.push({
          id: `${investment.id}-growth-${i}`,
          date: futureDate,
          description: `${investment.description} (Rendimento Mensal)`,
          amount: monthlyGrowth,
          type: 'income',
          category: 'investment-return'
        });
      }
    });
    
    return futureTransactions.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  return {
    fetchTransactions,
    deleteTransaction,
    getFutureTransactions,
  };
};
