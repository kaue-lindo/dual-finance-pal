
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Investment } from '../types';
import { calculateBalanceFromData } from '../utils';

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
        type: 'investment',
        description: investment.description,
        amount: investment.amount,
        category: investment.rate.toString(),
        date: investment.startDate.toISOString(),
        recurring_type: investment.period,
      })
      .then(({ error }) => {
        if (error) {
          console.error('Error saving investment to Supabase:', error);
          toast.error('Erro ao salvar investimento no banco de dados');
        }
      });
    
    setFinances(prev => {
      const userFinances = prev[currentUser.id] || {
        incomes: [],
        expenses: [],
        investments: [],
        balance: 0
      };
      
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
    
    supabase
      .from('finances')
      .delete()
      .eq('id', id)
      .then(({ error }) => {
        if (error) {
          console.error('Error deleting investment from Supabase:', error);
        }
      });
    
    setFinances(prev => {
      const currentFinances = prev[currentUser.id];
      const newInvestments = currentFinances.investments.filter(inv => inv.id !== id);
      
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

  return {
    addInvestment,
    deleteInvestment,
    getTotalInvestments,
    getProjectedInvestmentReturn,
  };
};
