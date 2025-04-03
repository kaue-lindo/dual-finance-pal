import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Investment } from '../types';
import { calculateBalanceFromData } from '../utils/calculations';
import { calculateCompoundInterest, calculateSimpleInterest, calculateInvestmentGrowthForMonth } from '../utils/projections';

export const useInvestments = (
  currentUser: any,
  finances: Record<string, any>,
  setFinances: React.Dispatch<React.SetStateAction<Record<string, any>>>
) => {
  const addInvestment = async (investment: Omit<Investment, 'id'>): Promise<void> => {
    if (!currentUser) return;
    
    try {
      const sessionData = await supabase.auth.getSession();
      if (!sessionData.data.session) throw new Error('Usuário não autenticado');
      
      const rateAsNumber = parseFloat(investment.rate.toString());
      const rateAsArray = [rateAsNumber];
      
      const { data, error } = await supabase
        .from('finances')
        .insert({
          user_id: currentUser.id,
          auth_id: sessionData.data.session.user.id,
          type: 'investment',
          description: investment.description,
          amount: investment.amount,
          category: 'investment',
          date: investment.startDate.toISOString(),
          recurring_type: investment.isCompound ? 'compound' : investment.period,
          is_compound: investment.isCompound,
          recurring_days: rateAsArray
        })
        .select()
        .single();
      
      if (error) throw error;
      
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
      
      await saveProjectedReturns(newInvestment);
      
      toast.success('Investimento adicionado com sucesso!');
    } catch (error) {
      console.error('Error in addInvestment:', error);
      toast.error('Erro ao adicionar investimento. Tente novamente.');
    }
  };

  const saveProjectedReturns = async (investment: Investment) => {
    if (!currentUser) return;
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        return;
      }
      
      const months = 12;
      const today = new Date();
      
      let accumulatedAmount = investment.amount;
      
      for (let i = 1; i <= months; i++) {
        const futureDate = new Date(investment.startDate);
        futureDate.setMonth(futureDate.getMonth() + i);
        
        const isPeriodMonthly = investment.period === 'monthly';
        const isCompound = investment.isCompound !== false;
        
        const newAmount = calculateInvestmentGrowthForMonth(
          investment.amount, 
          investment.rate, 
          isPeriodMonthly, 
          i, 
          isCompound
        );
        
        const monthlyReturn = newAmount - accumulatedAmount;
        accumulatedAmount = newAmount;
        
        if (monthlyReturn > 0) {
          await supabase
            .from('finances')
            .insert({
              user_id: currentUser.id,
              auth_id: sessionData.session.user.id,
              type: 'investment_update',
              description: `${investment.description} (Rendimento Acumulado)`,
              amount: monthlyReturn,
              category: 'investment_returns',
              date: futureDate.toISOString(),
              recurring_type: 'investment-reinvest',
              recurring: true,
              source_category: 'investment',
              parent_investment_id: investment.id
            });
        }
      }
    } catch (error) {
      console.error('Error saving projected returns:', error);
    }
  };

  const deleteInvestment = async (id: string) => {
    if (!currentUser) return;
    
    try {
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
      
      await supabase
        .from('finances')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('auth_id', sessionData.session.user.id)
        .eq('recurring_type', 'investment-return')
        .ilike('description', `${investment.description}%`);
      
      toast.success('Investimento removido com sucesso');
      
      setFinances(prev => {
        const currentFinances = prev[currentUser.id];
        if (!currentFinances) return prev;
        
        const newInvestments = currentFinances.investments.filter(inv => inv.id !== id);
        
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

  const getProjectedInvestmentReturn = (months: number = 12): number => {
    if (!currentUser) return 0;
    
    const userFinances = finances[currentUser.id];
    if (!userFinances) return 0;
    
    const investments = userFinances.investments || [];
    if (investments.length === 0) return 0;
    
    let totalReturn = 0;
    
    investments.forEach(investment => {
      const isPeriodMonthly = investment.period === 'monthly';
      const isCompound = investment.isCompound !== false;
      
      const futureValue = calculateInvestmentGrowthForMonth(
        investment.amount,
        investment.rate,
        isPeriodMonthly,
        months,
        isCompound
      );
      
      const investmentReturn = futureValue - investment.amount;
      totalReturn += investmentReturn;
    });
    
    return parseFloat(totalReturn.toFixed(2));
  };

  const getTotalInvestmentsWithReturns = (): number => {
    if (!currentUser) return 0;
    
    const userFinances = finances[currentUser.id] || { investments: [] };
    const initialInvestments = userFinances.investments.reduce(
      (sum, investment) => sum + investment.amount, 
      0
    );
    
    const projectedReturns = getProjectedInvestmentReturn(3);
    
    return initialInvestments + projectedReturns;
  };

  return {
    addInvestment,
    deleteInvestment,
    getTotalInvestments,
    getProjectedInvestmentReturn,
    getTotalInvestmentsWithReturns,
  };
};
