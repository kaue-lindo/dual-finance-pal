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
  const addInvestment = async (investment: Omit<Investment, 'id'>) => {
    if (!currentUser) return;
    
    try {
      // Get the current Supabase authentication session
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }
      
      const { data, error } = await supabase
        .from('finances')
        .insert({
          user_id: currentUser.id,
          auth_id: sessionData.session.user.id,
          type: 'investment',
          description: investment.description,
          amount: investment.amount,
          category: 'investment',
          date: investment.startDate.toISOString(),
          recurring_type: investment.period,
          is_compound: investment.isCompound
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving investment to Supabase:', error);
        toast.error('Erro ao salvar investimento no banco de dados');
        return;
      }

      const newInvestment: Investment = {
        id: data.id,
        description: data.description,
        amount: parseFloat(data.amount.toString()),
        rate: investment.rate,
        period: investment.period,
        startDate: new Date(data.date),
        isCompound: data.is_compound
      };
      
      setFinances(prev => {
        const userFinances = prev[currentUser.id] || {
          incomes: [],
          expenses: [],
          investments: [],
          balance: 0
        };
        
        // Calculate the new balance with the investment amount deducted
        const incomeTotal = userFinances.incomes.reduce((sum, inc) => sum + inc.amount, 0);
        const expenseTotal = userFinances.expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const newBalance = incomeTotal - expenseTotal - investment.amount;
        
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
    } catch (error) {
      console.error('Error in addInvestment:', error);
      toast.error('Erro ao adicionar investimento');
    }
  };

  const deleteInvestment = async (id: string) => {
    if (!currentUser) return;
    
    try {
      // Get the current Supabase authentication session
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }
      
      const userFinances = finances[currentUser.id];
      const investment = userFinances?.investments.find(inv => inv.id === id);
      
      if (!investment) {
        toast.error('Investimento não encontrado');
        return;
      }
      
      const { error } = await supabase
        .from('finances')
        .delete()
        .eq('id', id)
        .eq('auth_id', sessionData.session.user.id);

      if (error) {
        console.error('Error deleting investment from Supabase:', error);
        toast.error('Erro ao remover investimento');
        return;
      }
      
      toast.success('Investimento removido com sucesso');
      
      setFinances(prev => {
        const currentFinances = prev[currentUser.id];
        if (!currentFinances) return prev;
        
        const newInvestments = currentFinances.investments.filter(inv => inv.id !== id);
        
        // Add the investment amount back to the balance
        const incomeTotal = currentFinances.incomes.reduce((sum, inc) => sum + inc.amount, 0);
        const expenseTotal = currentFinances.expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const investmentAmount = investment.amount;
        
        return {
          ...prev,
          [currentUser.id]: {
            ...currentFinances,
            investments: newInvestments,
            balance: incomeTotal - expenseTotal + investmentAmount,
          },
        };
      });
    } catch (error) {
      console.error('Error in deleteInvestment:', error);
      toast.error('Erro ao remover investimento');
    }
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
      const years = months / 12;
      let futureValue: number;
      
      if (investment.isCompound !== false) {
        futureValue = calculateCompoundInterest(
          investment.amount,
          investment.period === 'monthly' ? investment.rate * 12 : investment.rate,
          years,
          'monthly'
        );
      } else {
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
