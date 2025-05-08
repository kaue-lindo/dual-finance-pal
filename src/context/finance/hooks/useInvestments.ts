
import { useState } from 'react';
import { Investment } from '../types';
import { generateId } from '../utils/formatting';
import { calculateInvestmentReturnForMonth } from '../utils/projections';
import { convertToMonths } from '../utils/projections';
import { useProjection } from '@/hooks/use-projection';

export const useInvestments = (
  currentUser: any,
  finances: Record<string, any>,
  setFinances: React.Dispatch<React.SetStateAction<Record<string, any>>>
) => {
  const [fetchTransactions, setFetchTransactionsFn] = useState<(() => void) | null>(null);
  const { projectionTimeUnit, projectionTimeAmount } = useProjection();

  // Add a new investment
  const addInvestment = (investment: Omit<Investment, 'id'>) => {
    if (!currentUser) {
      console.warn('Cannot add investment: No current user');
      return;
    }

    const id = generateId();
    const newInvestment = {
      ...investment,
      id,
      isFinalized: false,
    };

    setFinances(prevFinances => {
      const updatedFinances = { ...prevFinances };
      const userFinances = updatedFinances[currentUser.id] || { incomes: [], expenses: [], investments: [] };

      updatedFinances[currentUser.id] = {
        ...userFinances,
        investments: [...userFinances.investments, newInvestment],
      };

      return updatedFinances;
    });

    // Refresh transactions if available
    if (fetchTransactions) {
      fetchTransactions();
    }

    return newInvestment;
  };

  // Delete an investment
  const deleteInvestment = (investmentId: string) => {
    if (!currentUser) {
      console.warn('Cannot delete investment: No current user');
      return;
    }

    setFinances(prevFinances => {
      const updatedFinances = { ...prevFinances };
      const userFinances = updatedFinances[currentUser.id];

      if (userFinances && userFinances.investments) {
        updatedFinances[currentUser.id] = {
          ...userFinances,
          investments: userFinances.investments.filter((i: Investment) => i.id !== investmentId),
        };
      }

      return updatedFinances;
    });

    // Refresh transactions if available
    if (fetchTransactions) {
      fetchTransactions();
    }
  };

  // Finalize an investment
  const finalizeInvestment = (investmentId: string, finalAmount: number) => {
    if (!currentUser) {
      console.warn('Cannot finalize investment: No current user');
      return;
    }

    setFinances(prevFinances => {
      const updatedFinances = { ...prevFinances };
      const userFinances = updatedFinances[currentUser.id];

      if (userFinances && userFinances.investments) {
        updatedFinances[currentUser.id] = {
          ...userFinances,
          investments: userFinances.investments.map((i: Investment) => {
            if (i.id === investmentId) {
              return {
                ...i,
                isFinalized: true,
                finalizedAmount: finalAmount,
                finalizedDate: new Date().toISOString(),
              };
            }
            return i;
          }),
        };
      }

      return updatedFinances;
    });

    // Refresh transactions if available
    if (fetchTransactions) {
      fetchTransactions();
    }
  };

  // Get total investments
  const getTotalInvestments = (userId?: string) => {
    const targetUserId = userId || (currentUser ? currentUser.id : '');
    
    if (!targetUserId) return 0;
    
    const userFinances = finances[targetUserId];
    
    if (!userFinances || !userFinances.investments) return 0;
    
    return userFinances.investments.reduce((total: number, investment: Investment) => {
      // Check if investment is finalized
      if (investment.isFinalized) {
        return total;
      }
      return total + investment.amount;
    }, 0);
  };

  // Get total investments with returns
  const getTotalInvestmentsWithReturns = (userId?: string) => {
    const targetUserId = userId || (currentUser ? currentUser.id : '');
    
    if (!targetUserId) return 0;
    
    const userFinances = finances[targetUserId];
    
    if (!userFinances || !userFinances.investments) return 0;
    
    const totalPrincipal = getTotalInvestments(targetUserId);
    const totalReturn = getProjectedInvestmentReturn(12, targetUserId); // Default to 12 months
    
    return totalPrincipal + totalReturn;
  };
  
  const getProjectedInvestmentReturn = (months: number, userId?: string) => {
    const targetUserId = userId || (currentUser ? currentUser.id : '');
    
    if (!targetUserId) return 0;
    
    const userFinances = finances[targetUserId];
    
    if (!userFinances || !userFinances.investments) return 0;
    
    // Filter only active investments
    const activeInvestments = userFinances.investments.filter(
      (i: Investment) => !i.isFinalized
    );
    
    // Calculate the total projected return for the specified number of months
    return activeInvestments.reduce((total: number, investment: Investment) => {
      // Convert investment rate/period to monthly rate
      const isPeriodMonthly = investment.period === 'monthly';
      const isCompound = investment.isCompound !== false;
      
      // Calculate the date difference between now and investment start
      const startDate = new Date(investment.startDate);
      const today = new Date();
      
      // If investment hasn't started yet, no return
      if (startDate > today) {
        return total;
      }
      
      // Calculate months since investment start
      const monthsSinceStart = 
        (today.getFullYear() - startDate.getFullYear()) * 12 + 
        (today.getMonth() - startDate.getMonth());
      
      // Get rate
      const ratePerPeriod = investment.rate / 100;
      const monthlyRate = isPeriodMonthly ? ratePerPeriod : ratePerPeriod / 12;
      
      // Calculate future value
      let futureValue = investment.amount;
      
      if (isCompound) {
        futureValue = investment.amount * Math.pow(1 + monthlyRate, months);
      } else {
        futureValue = investment.amount * (1 + monthlyRate * months);
      }
      
      // Return only the growth amount (not the principal)
      return total + (futureValue - investment.amount);
    }, 0);
  };

  // Set the fetchTransactions function when it becomes available
  const setFetchTransactions = (fn: () => void) => {
    setFetchTransactionsFn(() => fn);
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
