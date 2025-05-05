
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Investment, FutureTransaction, IncomeCategory } from '../types';
import { calculateInvestmentReturn, calculateInvestmentGrowthForMonth } from '../utils/projections';

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

  // New function to finalize an investment and add its total value to balance
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
      
      const finalValue = calculateInvestmentGrowthForMonth(
        investment.amount, 
        investment.rate, 
        isPeriodMonthly, 
        Math.max(0, monthsDiff), 
        isCompound
      );
      
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
      
      // Add the finalized investment value as income
      const { error: incomeError } = await supabase
        .from('finances')
        .insert({
          user_id: currentUser.id,
          auth_id: sessionData.session.user.id,
          type: 'income',
          description: `Resgate do investimento: ${investment.description}`,
          amount: finalValue,
          category: 'investment_returns',
          date: today.toISOString(),
          source_category: 'investment',
          parent_investment_id: investment.id
        });
      
      if (incomeError) {
        console.error('Error adding investment income:', incomeError);
        toast.error('Erro ao adicionar rendimento do investimento');
        return;
      }
      
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
        
        const newIncome = {
          id: `${id}-finalized-${Date.now()}`,
          description: `Resgate do investimento: ${investment.description}`,
          amount: finalValue,
          date: today,
          category: 'investment_returns' as IncomeCategory
        };
        
        return {
          ...prev,
          [currentUser.id]: {
            ...currentFinances,
            investments: updatedInvestments,
            incomes: [...currentFinances.incomes, newIncome],
            balance: currentFinances.balance + finalValue
          },
        };
      });
      
      // Make sure this is defined in the props or context
      if (typeof fetchTransactions === 'function') {
        await fetchTransactions();
      }
      
    } catch (error) {
      console.error('Error in finalizeInvestment:', error);
      toast.error('Erro ao finalizar investimento');
    }
  };

  // Fixed function to avoid excessive instantiation
  const getProjectedInvestmentReturn = (months: number): number => {
    if (!currentUser) return 0;
    
    const userFinances = finances[currentUser.id] || { investments: [] };
    const today = new Date();
    let totalReturn = 0;
    
    userFinances.investments.forEach((investment: Investment) => {
      // Skip finalized investments
      if (investment.isFinalized) return;
      
      const startDate = new Date(investment.startDate);
      
      const projectedDate = new Date();
      projectedDate.setMonth(today.getMonth() + months);
      
      // Skip investments that haven't started by the projected date
      if (startDate > projectedDate) {
        return;
      }
      
      // Calculate how many months the investment will have been active
      let monthsActive = 0;
      if (startDate <= today) {
        // For investments already started, count from today plus projection months
        monthsActive = months;
      } else {
        // For future investments, count from start date to projected date
        monthsActive = (projectedDate.getFullYear() - startDate.getFullYear()) * 12 + 
                      (projectedDate.getMonth() - startDate.getMonth());
      }
      
      const isPeriodMonthly = investment.period === 'monthly';
      const isCompound = investment.isCompound !== false;
      
      // Calculate future value
      const futureValue = calculateInvestmentGrowthForMonth(
        investment.amount,
        investment.rate,
        isPeriodMonthly,
        monthsActive,
        isCompound
      );
      
      // Add just the returns (not the principal)
      const returnAmount = futureValue - investment.amount;
      totalReturn += returnAmount;
    });
    
    return totalReturn;
  };

  const getTotalInvestments = (): number => {
    if (!currentUser) return 0;
    
    const userFinances = finances[currentUser.id] || { investments: [] };
    
    return userFinances.investments.reduce((total: number, investment: Investment) => {
      // Only count non-finalized investments
      if (!investment.isFinalized) {
        return total + investment.amount;
      }
      return total;
    }, 0);
  };

  const getTotalInvestmentsWithReturns = (): number => {
    if (!currentUser) return 0;
    
    const userFinances = finances[currentUser.id] || { investments: [] };
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
    getProjectedInvestmentReturn
  };
};
