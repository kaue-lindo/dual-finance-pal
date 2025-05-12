import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Investment, FutureTransaction, IncomeCategory } from '../types';
import { calculateInvestmentReturn, calculateInvestmentGrowthForMonth } from '../utils/projections';
import { generateId } from '../utils/formatting';

export const useInvestments = (
  currentUser: any,
  finances: Record<string, any>,
  setFinances: React.Dispatch<React.SetStateAction<Record<string, any>>>
) => {
  // Store a reference to the fetchTransactions function
  let fetchTransactionsRef: () => Promise<void> = async () => {};

  // Function to set the fetchTransactions reference
  const setFetchTransactions = (fn: () => Promise<void>) => {
    fetchTransactionsRef = fn;
  };

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
        isCompound: data.is_compound,
        isFinalized: false
      };
      
      setFinances(prev => {
        const userFinances = prev[currentUser.id] || {
          incomes: [],
          expenses: [],
          investments: [],
          balance: 0
        };
        
        return {
          ...prev,
          [currentUser.id]: {
            ...userFinances,
            investments: [...userFinances.investments, newInvestment]
          },
        };
      });
      
      await saveInvestmentValues(newInvestment);
      
      toast.success('Investimento adicionado com sucesso!');
    } catch (error) {
      console.error('Error in addInvestment:', error);
      toast.error('Erro ao adicionar investimento. Tente novamente.');
    }
  };

  const saveInvestmentValues = async (investment: Investment) => {
    if (!currentUser) return;
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        return;
      }
      
      const months = 12;
      const today = new Date();
      
      for (let i = 1; i <= months; i++) {
        const futureDate = new Date(investment.startDate);
        futureDate.setMonth(futureDate.getMonth() + i);
        
        // Skip if this future date is before the investment start date
        if (futureDate < investment.startDate) {
          continue;
        }
        
        // Skip if investment is finalized and this date is after finalization
        if (investment.isFinalized && investment.finalizedDate && futureDate > investment.finalizedDate) {
          continue;
        }
        
        const isPeriodMonthly = investment.period === 'monthly';
        const isCompound = investment.isCompound !== false;
        
        // Calculate total value with interest
        const totalValue = calculateInvestmentGrowthForMonth(
          investment.amount, 
          investment.rate, 
          isPeriodMonthly, 
          i, 
          isCompound
        );
        
        await supabase
          .from('finances')
          .insert({
            user_id: currentUser.id,
            auth_id: sessionData.session.user.id,
            type: 'investment_value',
            description: `${investment.description} (Valor Atualizado)`,
            amount: totalValue,
            category: 'investment_value',
            date: futureDate.toISOString(),
            recurring_type: 'investment-value',
            source_category: 'investment',
            parent_investment_id: investment.id
          });
      }
    } catch (error) {
      console.error('Error saving investment values:', error);
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
      
      // Also delete all associated investment values
      await supabase
        .from('finances')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('auth_id', sessionData.session.user.id)
        .eq('source_category', 'investment')
        .eq('parent_investment_id', id);
      
      toast.success('Investimento removido com sucesso');
      
      setFinances(prev => {
        const currentFinances = prev[currentUser.id];
        if (!currentFinances) return prev;
        
        const newInvestments = currentFinances.investments.filter(inv => inv.id !== id);
        
        return {
          ...prev,
          [currentUser.id]: {
            ...currentFinances,
            investments: newInvestments
          },
        };
      });
    } catch (error) {
      console.error('Error in deleteInvestment:', error);
      toast.error('Erro ao remover investimento');
    }
  };

  // Improved function to finalize an investment and add its total value to balance
  const finalizeInvestment = async (id: string) => {
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

      // Calculate current investment value including returns
      const today = new Date();
      const startDate = new Date(investment.startDate);
      const monthsDiff = (today.getFullYear() - startDate.getFullYear()) * 12 + 
                        (today.getMonth() - startDate.getMonth());
      
      const isPeriodMonthly = investment.period === 'monthly';
      const isCompound = investment.isCompound !== false;
      
      // Calculate final investment value (principal + returns)
      const finalValue = calculateInvestmentGrowthForMonth(
        investment.amount, 
        investment.rate, 
        isPeriodMonthly, 
        Math.max(0, monthsDiff), 
        isCompound
      );

      // Calculate just the return value (without principal)
      const returnValue = finalValue - investment.amount;
      
      // Mark investment as finalized in Supabase
      const { error: updateError } = await supabase
        .from('finances')
        .update({
          recurring_type: 'finalized'
        })
        .eq('id', id)
        .eq('auth_id', sessionData.session.user.id);
      
      if (updateError) {
        console.error('Error finalizing investment in Supabase:', updateError);
        toast.error('Erro ao finalizar investimento');
        return;
      }
      
      // Add the principal amount as income (original investment)
      const principalIncomeId = generateId();
      await supabase
        .from('finances')
        .insert({
          id: principalIncomeId,
          user_id: currentUser.id,
          auth_id: sessionData.session.user.id,
          type: 'income',
          description: `Resgate principal: ${investment.description}`,
          amount: investment.amount,
          category: 'investment_principal',
          date: today.toISOString(),
          source_category: 'investment',
          parent_investment_id: id
        });
      
      // Add the returns as a separate income entry
      const returnsIncomeId = generateId();
      await supabase
        .from('finances')
        .insert({
          id: returnsIncomeId,
          user_id: currentUser.id,
          auth_id: sessionData.session.user.id,
          type: 'income',
          description: `Rendimento de: ${investment.description}`,
          amount: returnValue,
          category: 'investment_returns',
          date: today.toISOString(),
          source_category: 'investment',
          parent_investment_id: id
        });
      
      toast.success('Investimento finalizado com sucesso');
      
      // Update local state
      setFinances(prev => {
        const currentFinances = prev[currentUser.id];
        if (!currentFinances) return prev;
        
        const updatedInvestments = currentFinances.investments.map(inv => {
          if (inv.id === id) {
            return {
              ...inv, 
              isFinalized: true, 
              finalizedDate: today
            };
          }
          return inv;
        });
        
        // Add principal as income
        const principalIncome = {
          id: principalIncomeId,
          description: `Resgate principal: ${investment.description}`,
          amount: investment.amount,
          date: today,
          category: 'investment_principal' as IncomeCategory
        };

        // Add returns as income
        const returnsIncome = {
          id: returnsIncomeId,
          description: `Rendimento de: ${investment.description}`,
          amount: returnValue,
          date: today,
          category: 'investment_returns' as IncomeCategory
        };
        
        return {
          ...prev,
          [currentUser.id]: {
            ...currentFinances,
            investments: updatedInvestments,
            incomes: [...currentFinances.incomes, principalIncome, returnsIncome],
            balance: currentFinances.balance + finalValue
          },
        };
      });
      
      // Call fetchTransactions if available
      if (fetchTransactionsRef) {
        await fetchTransactionsRef();
      }
      
    } catch (error) {
      console.error('Error in finalizeInvestment:', error);
      toast.error('Erro ao finalizar investimento');
    }
  };

  // Fix the recursive type issue by explicitly defining the return type
  // and simplifying the implementation to avoid complex type inference
  const getProjectedInvestmentReturn = (months: number, userId?: string): number => {
    // Determine which user ID to use
    const targetUserId = userId || (currentUser ? currentUser.id : '');
    if (!targetUserId || !finances[targetUserId]) {
      return 0;
    }
    
    const userFinances = finances[targetUserId];
    
    // Early return if no investments or investments is not an array
    if (!userFinances?.investments || !Array.isArray(userFinances.investments) || userFinances.investments.length === 0) {
      return 0;
    }
    
    let totalReturn = 0;
    
    // Use standard for loop with index for maximum type safety
    for (let i = 0; i < userFinances.investments.length; i++) {
      const investment = userFinances.investments[i];
      
      // Skip finalized investments
      if (investment.isFinalized === true) {
        continue;
      }
      
      // Handle rate safely (could be string or number)
      let rateValue: number;
      if (typeof investment.rate === 'string') {
        rateValue = parseFloat(investment.rate);
        if (isNaN(rateValue)) {
          rateValue = 0; // Default if parsing fails
        }
      } else if (typeof investment.rate === 'number') {
        rateValue = investment.rate;
      } else {
        rateValue = 0; // Default for any other type
      }
      
      // Convert percentage to decimal
      const rate = rateValue / 100;
      
      // Get principal amount
      const principal = typeof investment.amount === 'number' ? investment.amount : 0;
      
      // Calculate monthly rate based on period
      let monthlyRate: number;
      if (investment.period === 'annual') {
        monthlyRate = Math.pow(1 + rate, 1/12) - 1;
      } else {
        monthlyRate = rate; // Already monthly
      }
      
      // Calculate return amount based on compound or simple interest
      let returnAmount = 0;
      
      if (investment.isCompound === true) {
        // Compound interest formula: P(1 + r)^t - P
        returnAmount = principal * Math.pow(1 + monthlyRate, months) - principal;
      } else {
        // Simple interest formula: P * r * t
        returnAmount = principal * monthlyRate * months;
      }
      
      // Add to total return
      totalReturn += returnAmount;
    }
    
    return totalReturn;
  };

  const getTotalInvestments = (userId?: string): number => {
    const targetUserId = userId || (currentUser ? currentUser.id : '');
    if (!targetUserId) return 0;
    
    const userFinances = finances[targetUserId] || { investments: [] };
    
    return userFinances.investments.reduce((total: number, investment: Investment) => {
      // Only count non-finalized investments
      if (!investment.isFinalized) {
        return total + investment.amount;
      }
      return total;
    }, 0);
  };

  const getTotalInvestmentsWithReturns = (userId?: string): number => {
    const targetUserId = userId || (currentUser ? currentUser.id : '');
    if (!targetUserId) return 0;
    
    const userFinances = finances[targetUserId] || { investments: [] };
    const today = new Date();
    
    return userFinances.investments.reduce((total: number, investment: Investment) => {
      // Skip finalized investments
      if (investment.isFinalized) return total;
      
      const startDate = new Date(investment.startDate);
      
      // Skip investments that haven't started yet
      if (startDate > today) {
        return total + investment.amount;
      }
      
      const monthsDiff = (today.getFullYear() - startDate.getFullYear()) * 12 + 
                       (today.getMonth() - startDate.getMonth());
      
      const isPeriodMonthly = investment.period === 'monthly';
      const isCompound = investment.isCompound !== false;
      
      // Calculate total value including returns
      const totalValue = calculateInvestmentGrowthForMonth(
        investment.amount,
        investment.rate,
        isPeriodMonthly,
        Math.max(0, monthsDiff),
        isCompound
      );
      
      return total + totalValue;
    }, 0);
  };

  return {
    addInvestment,
    deleteInvestment,
    finalizeInvestment,
    getTotalInvestments,
    getTotalInvestmentsWithReturns,
    getProjectedInvestmentReturn,
    setFetchTransactions
  };
};
