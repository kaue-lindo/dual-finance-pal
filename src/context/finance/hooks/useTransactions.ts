import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FutureTransaction, Income, Expense, Investment, IncomeCategory, UserFinances } from '../types';
import { calculateBalanceFromData, calculateBalanceExcludingInvestmentReturns } from '../utils/calculations';
import { getMonthlyReturn, calculateInvestmentGrowthForMonth, calculateInvestmentReturnForMonth } from '../utils/projections';

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
      // Get the current Supabase authentication session
      const { data: sessionData } = await supabase.auth.getSession();
      
      let query = supabase
        .from('finances')
        .select('*')
        .eq('user_id', userId);
      
      // If we have an authenticated session, also filter by auth_id
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
            rate: item.recurring_days && item.recurring_days.length > 0 ? 
              parseFloat(item.recurring_days[0].toString()) : 5,
            period: item.recurring_type === 'compound' ? 'monthly' : (item.recurring_type as 'monthly' | 'annual' || 'monthly'),
            startDate: new Date(item.date),
            isCompound: item.is_compound
          });
        } else if (item.type === 'investment_update' && item.parent_investment_id) {
          // Encontrar o investimento pai para aplicar o reinvestimento
          const parentInvestmentIndex = investments.findIndex(inv => inv.id === item.parent_investment_id);
          
          if (parentInvestmentIndex >= 0) {
            // Adicionar o valor do reinvestimento ao investimento pai
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
        
        // Usar o novo cálculo de saldo que exclui rendimentos de investimentos
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
      // Get the current Supabase authentication session
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
    
    // Adicionar todas as despesas (atuais e futuras)
    userFinances.expenses.forEach(expense => {
      const expenseDate = new Date(expense.date);
      
      // Incluir despesas do mês atual e futuras
      futureTransactions.push({
        id: expense.id,
        date: expenseDate,
        description: expense.description,
        amount: expense.amount,
        type: 'expense',
        category: expense.category,
        sourceCategory: expense.sourceCategory
      });
      
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
    
    // Adicionar todas as rendas (atuais e futuras)
    userFinances.incomes.forEach(income => {
      const incomeDate = new Date(income.date);
      
      // Adicionar indicador de recorrência à descrição original se for recorrente
      let description = income.description;
      if (income.recurring) {
        if (typeof income.recurring === 'object' && income.recurring.type) {
          // Se tiver tipo específico de recorrência
          const recurringType = income.recurring.type;
          if (recurringType === 'daily') {
            description = `${income.description} (Diário)`;
          } else if (recurringType === 'weekly') {
            description = `${income.description} (Semanal)`;
          } else if (recurringType === 'monthly') {
            description = `${income.description} (Mensal)`;
          }
        } else if (income.recurring === true) {
          // Se for apenas marcado como recorrente sem tipo específico
          description = `${income.description} (Mensal)`;
        }
      }
      
      // Incluir rendas do mês atual e futuras
      futureTransactions.push({
        id: income.id,
        date: incomeDate,
        description: description,
        amount: income.amount,
        type: 'income',
        category: income.category
      });
      
      if (income.recurring) {
        const nextMonths = [];
        for (let i = 1; i <= monthsToLookAhead; i++) {
          nextMonths.push(new Date(today.getFullYear(), today.getMonth() + i, 1));
        }
        
        nextMonths.forEach(month => {
          const futureDate = new Date(month);
          futureDate.setDate(incomeDate.getDate());
          
          // Determinar o tipo de recorrência para a descrição
          let recurringType = "Mensal";
          if (typeof income.recurring === 'object' && income.recurring.type) {
            if (income.recurring.type === 'daily') recurringType = "Diário";
            if (income.recurring.type === 'weekly') recurringType = "Semanal";
          }
          
          futureTransactions.push({
            id: `${income.id}-recurring-${month.getMonth()}`,
            date: futureDate,
            description: `${income.description} (${recurringType})`,
            amount: income.amount,
            type: 'income',
            category: income.category
          });
        });
      }
    });

    userFinances.investments.forEach(investment => {
      const months = 24;
      
      const investmentDate = new Date(investment.startDate);
      
      // Incluir investimento inicial
      futureTransactions.push({
        id: `${investment.id}-initial`,
        date: investmentDate,
        description: `${investment.description} (Investimento Inicial)`,
        amount: investment.amount,
        type: 'investment',
        category: 'investment'
      });
      
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
    
    return futureTransactions.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  return {
    fetchTransactions,
    fetchTransactionsByUserId,
    deleteTransaction,
    getFutureTransactions,
  };
};
