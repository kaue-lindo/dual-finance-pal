
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Investment } from '../types';
import { calculateBalanceFromData } from '../utils/calculations';
import { calculateCompoundInterest, calculateSimpleInterest } from '../utils/projections';

export const useInvestments = (
  currentUser: any,
  finances: Record<string, any>,
  setFinances: React.Dispatch<React.SetStateAction<Record<string, any>>>
) => {
  const addInvestment = (investment: Omit<Investment, 'id'>) => {
    if (!currentUser) return;
    
    const newInvestment: Investment = {
      ...investment,
      id: Date.now().toString(),
    };
    
    supabase
      .from('finances')
      .insert({
        user_id: currentUser.id,
        type: 'expense', // Changed from 'investment' to 'expense' to properly track as an expense
        description: investment.description,
        amount: investment.amount,
        category: 'investment', // Now uses a category to identify it as an investment type expense
        date: investment.startDate.toISOString(),
        recurring_type: investment.period,
        is_compound: investment.isCompound
      })
      .then(({ error }) => {
        if (error) {
          console.error('Error saving investment to Supabase:', error);
          toast.error('Erro ao salvar investimento no banco de dados');
        } else {
          toast.success('Investimento adicionado com sucesso');
        }
      });
    
    setFinances(prev => {
      const userFinances = prev[currentUser.id] || {
        incomes: [],
        expenses: [],
        investments: [],
        balance: 0
      };
      
      // Add the investment as an expense too, to properly deduct from balance
      const newExpense = {
        id: `investment-${newInvestment.id}`,
        description: `${investment.description} (Investimento)`,
        amount: investment.amount,
        category: 'investment',
        date: investment.startDate,
        sourceCategory: undefined
      };
      
      // Calculate the balance with the new investment as an expense
      const incomeTotal = userFinances.incomes.reduce((sum, inc) => sum + inc.amount, 0);
      const expenseTotal = userFinances.expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const newBalance = incomeTotal - expenseTotal - investment.amount;
      
      return {
        ...prev,
        [currentUser.id]: {
          ...userFinances,
          investments: [...userFinances.investments, newInvestment],
          expenses: [...userFinances.expenses, newExpense],
          balance: newBalance,
        },
      };
    });
  };

  const deleteInvestment = (id: string) => {
    if (!currentUser) return;
    
    const userFinances = finances[currentUser.id];
    const investment = userFinances?.investments.find(inv => inv.id === id);
    
    if (!investment) {
      toast.error('Investimento não encontrado');
      return;
    }
    
    supabase
      .from('finances')
      .delete()
      .eq('id', id)
      .then(({ error }) => {
        if (error) {
          console.error('Error deleting investment from Supabase:', error);
          toast.error('Erro ao remover investimento');
        } else {
          toast.success('Investimento removido com sucesso');
        }
      });
    
    setFinances(prev => {
      const currentFinances = prev[currentUser.id];
      if (!currentFinances) return prev;
      
      const newInvestments = currentFinances.investments.filter(inv => inv.id !== id);
      
      // Also remove the corresponding expense
      const newExpenses = currentFinances.expenses.filter(exp => exp.id !== `investment-${id}`);
      
      // Recalculate the balance
      const incomeTotal = currentFinances.incomes.reduce((sum, inc) => sum + inc.amount, 0);
      const expenseTotal = newExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      
      return {
        ...prev,
        [currentUser.id]: {
          ...currentFinances,
          investments: newInvestments,
          expenses: newExpenses,
          balance: incomeTotal - expenseTotal,
        },
      };
    });
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
      // Calculate return based on interest type (simple or compound)
      const years = months / 12;
      let futureValue: number;
      
      if (investment.isCompound !== false) { // Default to compound if not specified
        // Use compound interest
        futureValue = calculateCompoundInterest(
          investment.amount,
          investment.period === 'monthly' ? investment.rate * 12 : investment.rate,
          years,
          'monthly'
        );
      } else {
        // Use simple interest
        futureValue = calculateSimpleInterest(
          investment.amount,
          investment.period === 'monthly' ? investment.rate * 12 : investment.rate,
          years,
          investment.period
        );
      }
      
      const growthAmount = futureValue - investment.amount;
      totalReturn += growthAmount;
    });
    
    return totalReturn;
  };

  return {
    addInvestment,
    deleteInvestment,
    getTotalInvestments,
    getProjectedInvestmentReturn,
  };
};
