
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Income, IncomeCategory } from '../types';
import { calculateBalanceFromData } from '../utils/calculations';

export const useIncomes = (
  currentUser: any,
  finances: Record<string, any>,
  setFinances: React.Dispatch<React.SetStateAction<Record<string, any>>>
) => {
  const addIncome = async (income: Omit<Income, 'id'>) => {
    if (!currentUser) return;
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }
      
      // Convert recurring info to the format expected by the database
      let recurringType = null;
      let recurringDays = null;
      
      if (income.recurring) {
        if (typeof income.recurring === 'object') {
          recurringType = income.recurring.type;
          recurringDays = income.recurring.days;
        } else {
          recurringType = 'monthly';
          recurringDays = [new Date(income.date).getDate()];
        }
      }
      
      const { data, error } = await supabase
        .from('finances')
        .insert({
          user_id: currentUser.id,
          auth_id: sessionData.session.user.id,
          type: 'income',
          description: income.description,
          amount: income.amount,
          category: income.category,
          date: income.date.toISOString(),
          recurring: !!income.recurring,
          recurring_type: recurringType,
          recurring_days: recurringDays
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
        category: data.category as IncomeCategory,
        date: new Date(data.date),
        recurring: data.recurring ? (data.recurring_type ? { 
          type: data.recurring_type as 'daily' | 'weekly' | 'monthly', 
          days: data.recurring_days 
        } : true) : undefined
      };
      
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
  
  const deleteIncome = async (incomeId: string) => {
    if (!currentUser) return;
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }
      
      // Excluir do Supabase
      const { error } = await supabase
        .from('finances')
        .delete()
        .eq('id', incomeId)
        .eq('user_id', currentUser.id)
        .eq('type', 'income');
      
      if (error) {
        console.error('Error deleting income:', error);
        toast.error('Erro ao excluir receita');
        return;
      }
      
      // Atualizar o estado local
      setFinances(prev => {
        const userFinances = prev[currentUser.id] || {
          incomes: [],
          expenses: [],
          investments: [],
          balance: 0
        };
        
        const updatedIncomes = userFinances.incomes.filter(income => income.id !== incomeId);
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
      
      toast.success('Receita excluída com sucesso');
    } catch (error) {
      console.error('Error in deleteIncome:', error);
      toast.error('Erro ao excluir receita');
    }
  };
  
  const getRealIncome = () => {
    if (!currentUser) return 0;
    
    const userFinances = finances[currentUser.id] || { incomes: [] };
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return userFinances.incomes.reduce((sum: number, income: Income) => {
      const incomeDate = new Date(income.date);
      
      // Only include incomes from the current month
      if (incomeDate.getMonth() === currentMonth && incomeDate.getFullYear() === currentYear) {
        return sum + income.amount;
      }
      
      // Add recurring incomes
      if (income.recurring) {
        // If recurring is a boolean (true), it's a monthly income
        if (typeof income.recurring === 'boolean' && income.recurring) {
          return sum + income.amount;
        }
        
        // If recurring is an object, handle different types
        if (typeof income.recurring === 'object') {
          if (income.recurring.type === 'daily') {
            const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
            return sum + (income.amount * daysInMonth);
          }
          
          if (income.recurring.type === 'weekly') {
            return sum + (income.amount * 4); // Approximate 4 weeks per month
          }
          
          if (income.recurring.type === 'monthly' && income.recurring.days) {
            return sum + (income.amount * income.recurring.days.length);
          }
        }
      }
      
      return sum;
    }, 0);
  };
  
  const getIncomeCategories = () => {
    return [
      { value: 'salary', label: 'Salário' },
      { value: 'food-allowance', label: 'Vale Alimentação' },
      { value: 'transportation-allowance', label: 'Vale Transporte' },
      { value: 'investment_returns', label: 'Retornos de Investimentos' },
      { value: 'other', label: 'Outros' }
    ];
  };
  
  return {
    addIncome,
    deleteIncome,
    getRealIncome,
    getIncomeCategories
  };
};
