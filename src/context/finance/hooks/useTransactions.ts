
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FutureTransaction, Income, Expense, Investment, IncomeCategory, UserFinances, RecurringType } from '../types';
import { calculateBalanceFromData, calculateBalanceExcludingInvestmentReturns } from '../utils/calculations';
import { getMonthlyReturn, calculateInvestmentGrowthForMonth, calculateInvestmentReturnForMonth } from '../utils/projections';
import { processRecurringIncomes, processRecurringExpenses, processInstallments } from '../utils/recurring';

// Interfaces e tipos auxiliares
interface FinanceData {
  id: string;
  amount: number;
  date: string;
  recurring: boolean;
  recurring_days: any[];
  installment_total: number;
  installment_current: number;
  created_at: string;
  updated_at: string;
  is_compound: boolean;
  auth_id: string;
  user_id: string;
  type: string;
  description: string;
  category: string;
  recurring_type: string;
  source_category: string;
  parent_investment_id?: string;
}

export const useTransactions = (
  currentUser: any,
  finances: Record<string, any>,
  setFinances: React.Dispatch<React.SetStateAction<Record<string, any>>>
) => {
  const fetchTransactions = async () => {
    if (!currentUser) return;
    await fetchTransactionsByUserId(currentUser.id);
  };

  const fetchTransactionsByUserId = async (userId: string) => {
    try {
      console.log("Fetching transactions for user:", userId);
      const { data: sessionData } = await supabase.auth.getSession();
      
      let query = supabase
        .from('finances')
        .select('*')
        .eq('user_id', userId);
      
      if (sessionData?.session?.user?.id) {
        query = query.eq('auth_id', sessionData.session.user.id);
      }
        
      const { data, error } = await query;

      if (error) {
        console.error('Error fetching finances:', error);
        return;
      }

      console.log("Fetched transaction data for user", userId, ":", data);
      const incomes: Income[] = [];
      const expenses: Expense[] = [];
      const investments: Investment[] = [];

      setFinances(prev => {
        if (!prev[userId]) {
          return {
            ...prev,
            [userId]: {
              incomes: [],
              expenses: [],
              investments: [],
              balance: 0
            }
          };
        }
        return prev;
      });

      (data as FinanceData[]).forEach(item => {
        if (item.type === 'income') {
          const recurring = item.recurring ? 
            (item.recurring_type ? {
              type: (item.recurring_type || 'monthly') as RecurringType,
              days: item.recurring_days || []
            } : true) : undefined;
          
          incomes.push({
            id: item.id,
            description: item.description,
            amount: parseFloat(item.amount.toString()),
            date: new Date(item.date),
            category: (item.category || 'other') as IncomeCategory,
            recurring
          });
        } else if (item.type === 'expense') {
          expenses.push({
            id: item.id,
            description: item.description,
            amount: parseFloat(item.amount.toString()),
            category: item.category || 'other',
            date: new Date(item.date),
            sourceCategory: item.source_category as IncomeCategory | undefined,
            recurring: item.recurring ? {
              type: (item.recurring_type || 'monthly') as RecurringType,
              days: item.recurring_days || []
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
            rate: item.recurring_days && item.recurring_days.length > 0 ? 
              parseFloat(item.recurring_days[0].toString()) : 5,
            period: item.recurring_type === 'compound' ? 'monthly' : (item.recurring_type as 'monthly' | 'annual' || 'monthly'),
            startDate: new Date(item.date),
            isCompound: item.is_compound
          });
        } else if (item.type === 'investment_update' && item.parent_investment_id) {
          const parentInvestmentIndex = investments.findIndex(inv => inv.id === item.parent_investment_id);
          
          if (parentInvestmentIndex >= 0) {
            const updatedAmount = parseFloat(investments[parentInvestmentIndex].amount.toString()) + 
                                parseFloat(item.amount.toString());
            
            investments[parentInvestmentIndex] = {
              ...investments[parentInvestmentIndex],
              amount: updatedAmount
            };
            
            console.log(`Reinvestimento aplicado: ${item.amount} adicionado ao investimento ${item.parent_investment_id}`);
          }
        }
      });

      setFinances(prev => {
        const existingFinances = prev[userId] || {
          incomes: [],
          expenses: [],
          investments: [],
          balance: 0
        };
        
        const existingInvestments = existingFinances.investments || [];
        const existingIds = new Set(investments.map(inv => inv.id));
        const uniqueExistingInvestments = existingInvestments.filter(inv => !existingIds.has(inv.id));
        const combinedInvestments = [...investments, ...uniqueExistingInvestments];
        
        const calculatedBalance = calculateBalanceExcludingInvestmentReturns(incomes, expenses);
        
        console.log(`Updated finances for user ${userId}:`, {
          incomes: incomes.length,
          expenses: expenses.length,
          investments: combinedInvestments.length,
          balance: calculatedBalance
        });
        
        return {
          ...prev,
          [userId]: {
            ...existingFinances,
            incomes,
            expenses,
            investments: combinedInvestments,
            balance: calculatedBalance
          }
        };
      });
    } catch (error) {
      console.error('Error in fetchTransactionsByUserId:', error);
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!currentUser) return;
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }
      
      if (!id.includes('-installment-') && !id.includes('-recurring-') && !id.includes('-growth-')) {
        console.log('Deleting transaction with ID:', id);
        
        const { error } = await supabase
          .from('finances')
          .delete()
          .eq('id', id)
          .eq('auth_id', sessionData.session.user.id);

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
            .eq('id', baseId)
            .eq('auth_id', sessionData.session.user.id);

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
    
    // Processar despesas
    processExpenses(userFinances.expenses, futureTransactions, today, monthsToLookAhead);
    
    // Processar receitas
    processIncomes(userFinances.incomes, futureTransactions, today, monthsToLookAhead);
    
    // Processar investimentos
    processInvestments(userFinances.investments, futureTransactions, monthsToLookAhead);
    
    return futureTransactions.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  // Função auxiliar para processar despesas
  const processExpenses = (expenses: Expense[], futureTransactions: FutureTransaction[], today: Date, monthsToLookAhead: number) => {
    expenses.forEach(expense => {
      const expenseDate = new Date(expense.date);
      
      // Adicionar a despesa original
      futureTransactions.push({
        id: expense.id,
        date: expenseDate,
        description: expense.description,
        amount: expense.amount,
        type: 'expense',
        category: expense.category,
        sourceCategory: expense.sourceCategory
      });
      
      // Processar prestações
      if (expense.installment && expense.installment.remaining > 0) {
        processInstallments(expense, futureTransactions);
      }
      
      // Processar recorrências
      if (expense.recurring) {
        processRecurringExpenses(expense, futureTransactions, today, monthsToLookAhead);
      }
    });
  };

  // Função auxiliar para processar prestações
  const processInstallments = (expense: Expense, futureTransactions: FutureTransaction[]) => {
    if (!expense.installment) return;
    
    const installmentAmount = expense.amount;
    const expenseDate = new Date(expense.date);
    
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
  };

  // Função auxiliar para processar despesas recorrentes
  const processRecurringExpenses = (expense: Expense, futureTransactions: FutureTransaction[], today: Date, monthsToLookAhead: number) => {
    if (!expense.recurring) return;
    
    const nextMonths = [];
    for (let i = 0; i <= monthsToLookAhead; i++) {
      nextMonths.push(new Date(today.getFullYear(), today.getMonth() + i, 1));
    }
    
    nextMonths.forEach(month => {
      if (expense.recurring?.type === 'monthly' && expense.recurring.days && expense.recurring.days.length > 0) {
        expense.recurring.days.forEach(day => {
          const futureDate = new Date(month.getFullYear(), month.getMonth(), day);
          
          // Só adiciona transações futuras ou a partir do primeiro dia do mês atual
          if (futureDate >= new Date(today.getFullYear(), today.getMonth(), 1)) {
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
          
          if (futureDate >= new Date(today.getFullYear(), today.getMonth(), 1)) {
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
      } else if (expense.recurring?.type === 'daily') {
        // Para despesas diárias, gera uma transação para cada dia do mês
        const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
        
        for (let day = 1; day <= daysInMonth; day++) {
          const futureDate = new Date(month.getFullYear(), month.getMonth(), day);
          
          if (futureDate >= new Date(today.getFullYear(), today.getMonth(), 1)) {
            futureTransactions.push({
              id: `${expense.id}-recurring-daily-${month.getMonth()}-${day}`,
              date: futureDate,
              description: `${expense.description} (Diário)`,
              amount: expense.amount,
              type: 'expense',
              category: expense.category,
              sourceCategory: expense.sourceCategory
            });
          }
        }
      }
    });
  };

  // Função auxiliar para processar receitas
  const processIncomes = (incomes: Income[], futureTransactions: FutureTransaction[], today: Date, monthsToLookAhead: number) => {
    incomes.forEach(income => {
      const incomeDate = new Date(income.date);
      
      // Determinar descrição com base no tipo de recorrência (se houver)
      let description = income.description;
      if (income.recurring) {
        if (typeof income.recurring === 'object' && income.recurring.type) {
          const recurringType = income.recurring.type;
          if (recurringType === 'daily') {
            description = `${income.description} (Diário)`;
          } else if (recurringType === 'weekly') {
            description = `${income.description} (Semanal)`;
          } else if (recurringType === 'monthly') {
            description = `${income.description} (Mensal)`;
          }
        } else if (income.recurring === true) {
          description = `${income.description} (Mensal)`;
        }
      }
      
      // Adicionar a receita original
      futureTransactions.push({
        id: income.id,
        date: incomeDate,
        description: description,
        amount: income.amount,
        type: 'income',
        category: income.category
      });
      
      // Processar receitas recorrentes
      if (income.recurring) {
        processRecurringIncomes(income, futureTransactions, today, monthsToLookAhead, incomeDate);
      }
    });
  };

  // Função auxiliar para processar receitas recorrentes
  const processRecurringIncomes = (income: Income, futureTransactions: FutureTransaction[], today: Date, monthsToLookAhead: number, incomeDate: Date) => {
    if (!income.recurring) return;
    
    const nextMonths = [];
    for (let i = 1; i <= monthsToLookAhead; i++) {
      nextMonths.push(new Date(today.getFullYear(), today.getMonth() + i, 1));
    }
    
    nextMonths.forEach(month => {
      const recurringDays = (typeof income.recurring === 'object' && income.recurring.days && income.recurring.days.length > 0) ? 
        income.recurring.days : [incomeDate.getDate()];
      
      const recurringType = (typeof income.recurring === 'object' && income.recurring.type) ? 
        income.recurring.type : 'monthly';
      
      let recurringLabel = "Mensal";
      if (recurringType === 'daily') recurringLabel = "Diário";
      if (recurringType === 'weekly') recurringLabel = "Semanal";
      
      if (recurringType === 'monthly') {
        recurringDays.forEach(day => {
          const futureDate = new Date(month.getFullYear(), month.getMonth(), day);
          
          futureTransactions.push({
            id: `${income.id}-recurring-${month.getMonth()}-${day}`,
            date: futureDate,
            description: `${income.description} (${recurringLabel})`,
            amount: income.amount,
            type: 'income',
            category: income.category
          });
        });
      } else if (recurringType === 'weekly') {
        for (let week = 0; week < 4; week++) {
          const futureDate = new Date(month.getFullYear(), month.getMonth(), 1 + (week * 7));
          
          futureTransactions.push({
            id: `${income.id}-recurring-weekly-${month.getMonth()}-${week}`,
            date: futureDate,
            description: `${income.description} (${recurringLabel})`,
            amount: income.amount,
            type: 'income',
            category: income.category
          });
        }
      } else if (recurringType === 'daily') {
        const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
        
        for (let day = 1; day <= daysInMonth; day++) {
          const futureDate = new Date(month.getFullYear(), month.getMonth(), day);
          
          futureTransactions.push({
            id: `${income.id}-recurring-daily-${month.getMonth()}-${day}`,
            date: futureDate,
            description: `${income.description} (${recurringLabel})`,
            amount: income.amount,
            type: 'income',
            category: income.category
          });
        }
      } else {
        // Se não tiver tipo específico, usa a data base
        const futureDate = new Date(month.getFullYear(), month.getMonth(), incomeDate.getDate());
        
        futureTransactions.push({
          id: `${income.id}-recurring-${month.getMonth()}`,
          date: futureDate,
          description: `${income.description} (${recurringLabel})`,
          amount: income.amount,
          type: 'income',
          category: income.category
        });
      }
    });
  };

  // Função auxiliar para processar investimentos
  const processInvestments = (investments: Investment[], futureTransactions: FutureTransaction[], monthsToLookAhead: number) => {
    investments.forEach(investment => {
      const months = monthsToLookAhead;
      
      const investmentDate = new Date(investment.startDate);
      
      // Adicionar o investimento inicial
      futureTransactions.push({
        id: `${investment.id}-initial`,
        date: investmentDate,
        description: `${investment.description} (Investimento Inicial)`,
        amount: investment.amount,
        type: 'investment',
        category: 'investment'
      });
      
      // Adicionar os rendimentos mensais
      for (let i = 1; i <= months; i++) {
        const futureDate = new Date(investmentDate);
        futureDate.setMonth(futureDate.getMonth() + i);
        
        const isPeriodMonthly = investment.period === 'monthly';
        const isCompound = investment.isCompound !== false;
        
        const prevMonthGrowth = calculateInvestmentGrowthForMonth(
          investment.amount, 
          investment.rate, 
          isPeriodMonthly, 
          i-1, 
          isCompound
        );
        
        const currentMonthGrowth = calculateInvestmentGrowthForMonth(
          investment.amount, 
          investment.rate, 
          isPeriodMonthly, 
          i, 
          isCompound
        );
        
        const monthlyReturn = currentMonthGrowth - prevMonthGrowth;
        
        if (monthlyReturn > 0) {
          futureTransactions.push({
            id: `${investment.id}-growth-${i}`,
            date: futureDate,
            description: `${investment.description} (Rendimento Mensal)`,
            amount: monthlyReturn,
            type: 'income',
            category: 'investment-return'
          });
        }
      }
    });
  };

  return {
    fetchTransactions,
    fetchTransactionsByUserId,
    deleteTransaction,
    getFutureTransactions,
  };
};
