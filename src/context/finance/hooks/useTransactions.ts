
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FutureTransaction, Income, Expense, Investment, IncomeCategory, UserFinances } from '../types';
import { calculateBalanceFromData } from '../utils/calculations';
import { getMonthlyReturn } from '../utils/projections';

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
          // Fix the error by checking if the property exists
          const isCompound = item.recurring_type === 'compound';
          
          investments.push({
            id: item.id,
            description: item.description,
            amount: parseFloat(item.amount.toString()),
            rate: parseFloat(item.category),
            period: item.recurring_type === 'compound' ? 'monthly' : (item.recurring_type as 'monthly' | 'annual'),
            startDate: new Date(item.date),
            isCompound: isCompound
          });
        }
      });

      // Combine with any existing investments that might not be in the database yet
      const existingInvestments = finances[currentUser.id]?.investments || [];
      const existingIds = new Set(investments.map(inv => inv.id));
      const uniqueExistingInvestments = existingInvestments.filter(inv => !existingIds.has(inv.id));
      const combinedInvestments = [...investments, ...uniqueExistingInvestments];
      
      // Calculate the correct balance excluding investment amounts
      const calculatedBalance = calculateBalanceFromData(incomes, expenses);
      const totalInvestmentsAmount = combinedInvestments.reduce((sum, inv) => sum + inv.amount, 0);
      const availableBalance = calculatedBalance - totalInvestmentsAmount;
      
      setFinances(prev => ({
        ...prev,
        [currentUser.id]: {
          ...prev[currentUser.id],
          incomes,
          expenses,
          investments: combinedInvestments,
          balance: availableBalance
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
    
    // Process expenses
    userFinances.expenses.forEach(expense => {
      const expenseDate = new Date(expense.date);
      
      // Include current month's expenses in the projections
      const currentMonth = today.getMonth();
      const expenseMonth = expenseDate.getMonth();
      const expenseYear = expenseDate.getFullYear();
      const currentYear = today.getFullYear();
      
      // Add all current and future expenses
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
      
      // Process installment payments
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
      
      // Process recurring expenses
      if (expense.recurring) {
        const nextMonths = [];
        for (let i = 0; i <= monthsToLookAhead; i++) {
          // Start with current month for recurring expenses
          nextMonths.push(new Date(today.getFullYear(), today.getMonth() + i, 1));
        }
        
        nextMonths.forEach(month => {
          if (expense.recurring?.type === 'monthly' && expense.recurring.days) {
            expense.recurring.days.forEach(day => {
              const futureDate = new Date(month.getFullYear(), month.getMonth(), day);
              
              // Include the current month's recurring expenses too
              if (futureDate.getTime() >= today.setHours(0, 0, 0, 0) || 
                 (futureDate.getMonth() === today.getMonth() && futureDate.getFullYear() === today.getFullYear())) {
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
              
              if (futureDate.getTime() >= today.setHours(0, 0, 0, 0) || 
                 (futureDate.getMonth() === today.getMonth() && futureDate.getFullYear() === today.getFullYear())) {
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
    
    // Process incomes
    userFinances.incomes.forEach(income => {
      const incomeDate = new Date(income.date);
      
      // Include current month's incomes
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
      
      // Process recurring incomes
      if (income.recurring) {
        const nextMonths = [];
        for (let i = 0; i <= monthsToLookAhead; i++) {
          // Start with current month for recurring incomes
          nextMonths.push(new Date(today.getFullYear(), today.getMonth() + i, 1));
        }
        
        nextMonths.forEach(month => {
          const futureDate = new Date(month);
          futureDate.setDate(new Date(income.date).getDate());
          
          if (futureDate.getTime() >= today.setHours(0, 0, 0, 0) || 
             (futureDate.getMonth() === today.getMonth() && futureDate.getFullYear() === today.getFullYear())) {
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

    // Process investments with updated calculation based on simple or compound interest
    userFinances.investments.forEach(investment => {
      const months = 24;
      
      // Add the initial investment as an expense in the cash flow
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
          type: 'expense',
          category: 'investment'
        });
      }
      
      // Calculate and add projected returns based on interest type
      for (let i = 1; i <= months; i++) {
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + i);
        
        // Calculate returns for each month based on interest type (simple or compound)
        let growthAmount: number;
        
        if (investment.isCompound !== false) { // Default to compound if not specified
          // Compound interest calculation
          const isPeriodMonthly = investment.period === 'monthly';
          const monthlyRate = isPeriodMonthly ? investment.rate / 100 : (investment.rate / 12) / 100;
          growthAmount = investment.amount * Math.pow(1 + monthlyRate, i) - investment.amount;
        } else {
          // Simple interest calculation
          const isPeriodMonthly = investment.period === 'monthly';
          const monthlyRate = isPeriodMonthly ? investment.rate / 100 : (investment.rate / 12) / 100;
          growthAmount = investment.amount * monthlyRate * i;
        }
        
        // Include returns at key intervals (3, 6, 12, 24 months)
        if (i === 3 || i === 6 || i === 12 || i === 24) {
          futureTransactions.push({
            id: `${investment.id}-growth-${i}`,
            date: futureDate,
            description: `${investment.description} (${investment.isCompound !== false ? 'Juros Compostos' : 'Juros Simples'} ${i} meses)`,
            amount: growthAmount,
            type: 'income',
            category: 'investment-return'
          });
        }
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
