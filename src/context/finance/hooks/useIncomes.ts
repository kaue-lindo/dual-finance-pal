
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
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new Error(`Erro ao obter sessão: ${sessionError.message}`);
      }
      
      if (!sessionData.session) {
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }
      
      // Preparar os dados para inserção no Supabase
      const supabaseData: any = {
        user_id: currentUser.id,
        auth_id: sessionData.session.user.id,
        type: 'income',
        description: income.description,
        amount: income.amount,
        category: income.category,
        date: income.date.toISOString()
      };
      
      // Correção: Tratar o campo recurring de acordo com seu tipo
      if (typeof income.recurring === 'object' && income.recurring !== null) {
        // Se for um objeto, extrair type e days
        supabaseData.recurring = true; // Campo booleano no Supabase
        supabaseData.recurring_type = income.recurring.type;
        supabaseData.recurring_days = income.recurring.days || [];
      } else if (income.recurring === true) {
        // Se for apenas um booleano true
        supabaseData.recurring = true;
        supabaseData.recurring_type = 'monthly'; // Padrão para recorrência simples
        
        // Para recorrência mensal simples, usar o dia da data selecionada
        const selectedDay = income.date.getDate();
        supabaseData.recurring_days = [selectedDay];
      } else {
        // Se for false ou undefined
        supabaseData.recurring = false;
      }
      
      const { data, error } = await supabase
        .from('finances')
        .insert(supabaseData)
        .select()
        .single();

      if (error) {
        console.error('Error adding income:', error);
        toast.error(`Erro ao adicionar receita: ${error.message}`);
        return;
      }

      // Construir o objeto Income a partir dos dados retornados
      const newIncome: Income = {
        id: data.id,
        description: data.description,
        amount: parseFloat(data.amount.toString()),
        date: new Date(data.date),
        category: data.category as IncomeCategory
      };
      
      // Reconstruir o campo recurring com base nos dados salvos
      if (data.recurring) {
        if (data.recurring_type) {
          // Se tiver tipo de recorrência, é um objeto
          newIncome.recurring = {
            type: data.recurring_type as 'daily' | 'weekly' | 'monthly',
            days: data.recurring_days || []
          };
        } else {
          // Senão, é apenas um booleano
          newIncome.recurring = true;
        }
      } else {
        newIncome.recurring = false;
      }

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
      toast.error(error instanceof Error ? error.message : 'Erro ao adicionar receita');
    }
  };

  const deleteIncome = async (incomeId: string) => {
    if (!currentUser) {
      toast.error('Usuário não encontrado. Faça login novamente.');
      return;
    }
    
    try {
      // Get the current Supabase authentication session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new Error(`Erro ao obter sessão: ${sessionError.message}`);
      }
      
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
        toast.error(`Erro ao excluir receita: ${error.message}`);
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
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir receita');
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
    deleteIncome,
    getIncomeCategories,
    getRealIncome,
  };
};
