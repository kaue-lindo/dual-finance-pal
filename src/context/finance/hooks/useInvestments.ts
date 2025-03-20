
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
        type: 'investment',
        description: investment.description,
        amount: investment.amount,
        category: investment.rate.toString(),
        date: investment.startDate.toISOString(),
        recurring_type: investment.period,
        is_compound: investment.isCompound
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
      
      // Corretamente subtrai o valor do investimento do saldo disponível
      const newBalance = calculateBalanceFromData(userFinances.incomes, userFinances.expenses) - 
                          userFinances.investments.reduce((sum, inv) => sum + inv.amount, 0) - 
                          investment.amount;
      
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
        }
      });
    
    setFinances(prev => {
      const currentFinances = prev[currentUser.id];
      if (!currentFinances) return prev;
      
      const newInvestments = currentFinances.investments.filter(inv => inv.id !== id);
      
      // Recalcula o saldo, levando em conta a remoção do investimento
      const totalIncomes = currentFinances.incomes.reduce((sum, income) => sum + income.amount, 0);
      const totalExpenses = currentFinances.expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const totalInvestments = newInvestments.reduce((sum, inv) => sum + inv.amount, 0);
      const newBalance = totalIncomes - totalExpenses - totalInvestments;
      
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
      // Calcula o retorno com base no tipo de juros (simples ou composto)
      const years = months / 12;
      let futureValue: number;
      
      if (investment.isCompound) {
        // Usa juros compostos
        futureValue = calculateCompoundInterest(
          investment.amount,
          investment.period === 'monthly' ? investment.rate * 12 : investment.rate,
          years,
          'monthly'
        );
      } else {
        // Usa juros simples
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
