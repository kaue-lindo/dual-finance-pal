
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Income, IncomeCategory } from '../types';
import { incomeCategories } from '../constants';
import { calculateBalanceFromData } from '../utils/calculations';

export const useIncomes = (
  currentUser: any,
  finances: Record<string, any>,
  setFinances: React.Dispatch<React.SetStateAction<Record<string, any>>>
) => {
  const addIncome = async (income: Omit<Income, 'id'>) => {
    if (!currentUser) {
      toast.error('Usuário não encontrado. Faça login novamente.');
      return;
    }
    
    try {
      console.log("Adding income for user:", currentUser.id, income);
      
      // Get the current Supabase authentication session
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }
      
      const { data, error } = await supabase
        .from('finances')
        .insert({
          user_id: currentUser.id, // This is the finance profile ID
          auth_id: sessionData.session.user.id, // This is the actual auth user ID
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

      console.log("Successfully added income:", newIncome);

      setFinances(prev => {
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

  const getIncomeCategories = () => {
    return incomeCategories;
  };

  const getRealIncome = () => {
    if (!currentUser) return 0;
    
    const userFinances = finances[currentUser.id] || { incomes: [] };
    return userFinances.incomes.reduce((sum, income) => sum + income.amount, 0);
  };

  return {
    addIncome,
    getIncomeCategories,
    getRealIncome,
  };
};
