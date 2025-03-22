import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Expense, Income, IncomeCategory } from '../types';
import { categoryAllocationMap } from '../constants';
import { calculateBalanceFromData } from '../utils/calculations';

export const useExpenses = (
  currentUser: any,
  finances: Record<string, any>,
  setFinances: React.Dispatch<React.SetStateAction<Record<string, any>>>
) => {
  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    if (!currentUser) return;
    
    const sourceCategory = categoryAllocationMap[expense.category] || 'salary';
    
    try {
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
          type: 'expense',
          description: expense.description,
          amount: expense.amount,
          category: expense.category,
          source_category: sourceCategory,
          date: expense.date.toISOString(),
          recurring: !!expense.recurring,
          recurring_type: expense.recurring?.type,
          recurring_days: expense.recurring?.days,
          installment_total: expense.installment?.total,
          installment_current: expense.installment?.current || 1
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding expense:', error);
        toast.error('Erro ao adicionar despesa');
        return;
      }

      const newExpense: Expense = {
        id: data.id,
        description: data.description,
        amount: parseFloat(data.amount.toString()),
        category: data.category || 'other',
        date: new Date(data.date),
        sourceCategory: data.source_category as IncomeCategory | undefined,
        recurring: data.recurring_type ? {
          type: data.recurring_type as 'daily' | 'weekly' | 'monthly',
          days: data.recurring_days
        } : undefined,
        installment: data.installment_total ? {
          total: data.installment_total,
          current: data.installment_current,
          remaining: data.installment_total - data.installment_current
        } : undefined
      };

      setFinances(prev => {
        const userFinances = prev[currentUser.id] || {
          incomes: [],
          expenses: [],
          investments: [],
          balance: 0
        };
        
        const updatedExpenses = [...userFinances.expenses, newExpense];
        const updatedIncomes = [...userFinances.incomes];
        
        return {
          ...prev,
          [currentUser.id]: {
            ...userFinances,
            expenses: updatedExpenses,
            balance: calculateBalanceFromData(updatedIncomes, updatedExpenses)
          }
        };
      });
      
      toast.success('Despesa adicionada com sucesso');
    } catch (error) {
      console.error('Error in addExpense:', error);
      toast.error('Erro ao adicionar despesa');
    }
  };

  const getMonthlyExpenseTotal = () => {
    if (!currentUser) return 0;
    
    const userFinances = finances[currentUser.id] || { expenses: [] };
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return userFinances.expenses.reduce((sum, expense) => {
      const expenseDate = new Date(expense.date);
      const isCurrentMonth = expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
      
      if (isCurrentMonth) {
        return sum + expense.amount;
      }
      
      if (expense.recurring) {
        if (expense.recurring.type === 'daily') {
          const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
          return sum + (expense.amount * daysInMonth);
        }
        
        if (expense.recurring.type === 'weekly') {
          return sum + (expense.amount * 4);
        }
        
        if (expense.recurring.type === 'monthly' && expense.recurring.days) {
          return sum + (expense.amount * expense.recurring.days.length);
        }
      }
      
      return sum;
    }, 0);
  };

  const simulateExpense = (expense: Omit<Expense, 'id'>) => {
    if (!currentUser) return 0;
    
    const currentBalance = calculateBalance();
    
    return currentBalance - expense.amount;
  };

  const calculateBalance = (): number => {
    return getUserBalance(currentUser?.id);
  };

  const getUserBalance = (userId: string): number => {
    if (!userId || !finances[userId]) return 0;
    
    const userFinances = finances[userId];
    
    const incomeTotal = userFinances.incomes.reduce((sum: number, income: any) => sum + income.amount, 0);
    const expenseTotal = userFinances.expenses.reduce((sum: number, expense: any) => sum + expense.amount, 0);
    const investmentTotal = userFinances.investments.reduce((sum: number, inv: any) => sum + inv.amount, 0);
    
    return incomeTotal - expenseTotal - investmentTotal;
  };

  const getCategoryExpenses = () => {
    if (!currentUser) return [];
    
    const userFinances = finances[currentUser.id] || { expenses: [] };
    const categoryMap: Record<string, number> = {};
    
    userFinances.expenses.forEach(expense => {
      const category = expense.category || 'other';
      categoryMap[category] = (categoryMap[category] || 0) + expense.amount;
    });
    
    return Object.entries(categoryMap).map(([category, amount]) => ({
      category,
      amount
    }));
  };

  return {
    addExpense,
    calculateBalance,
    getUserBalance,
    getMonthlyExpenseTotal,
    getCategoryExpenses,
    simulateExpense
  };
};
