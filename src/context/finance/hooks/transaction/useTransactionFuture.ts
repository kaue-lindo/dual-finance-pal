import { FutureTransaction, Expense, Income, Investment } from '../../types';
import { processRecurringExpenses, processRecurringIncomes, processInstallments } from '../../utils/recurring';
import { calculateInvestmentGrowthForMonth, calculateInvestmentReturnForMonth } from '../../utils/projections';
import { getUniqueTransactionsByMonth } from '@/utils/transaction-utils';

export const useTransactionFuture = (
  currentUser: any,
  finances: Record<string, any>
) => {
  // Get future transactions (for projections and charts)
  const getFutureTransactions = (): FutureTransaction[] => {
    if (!currentUser) return [];
    
    const userFinances = finances[currentUser.id] || { expenses: [], incomes: [], investments: [] };
    const today = new Date();
    const futureTransactions: FutureTransaction[] = [];
    
    const monthsToLookAhead = 24;
    
    // Process expenses
    processExpenses(userFinances.expenses, futureTransactions, today, monthsToLookAhead);
    
    // Process incomes
    processIncomes(userFinances.incomes, futureTransactions, today, monthsToLookAhead);
    
    // Process investments
    processInvestments(userFinances.investments, futureTransactions, monthsToLookAhead);
    
    // Sort transactions by date
    const sortedTransactions = futureTransactions.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    return sortedTransactions;
  };

  // Helper function to process expenses
  const processExpenses = (expenses: Expense[], futureTransactions: FutureTransaction[], today: Date, monthsToLookAhead: number) => {
    // Create a Set to track unique expense IDs to prevent duplicates
    const processedIds = new Set<string>();
    
    expenses.forEach(expense => {
      const expenseDate = new Date(expense.date);
      
      // Skip if we've already processed this expense
      if (processedIds.has(expense.id)) return;
      processedIds.add(expense.id);
      
      // Add the original expense
      futureTransactions.push({
        id: expense.id,
        date: expenseDate,
        description: expense.description,
        amount: expense.amount,
        type: 'expense',
        category: expense.category,
        sourceCategory: expense.sourceCategory,
        parentId: expense.id
      });
      
      // Process installments
      if (expense.installment && expense.installment.remaining > 0) {
        processInstallments(expense, futureTransactions);
      }
      
      // Process recurring expenses
      if (expense.recurring) {
        processRecurringExpenses(expense, futureTransactions, today, monthsToLookAhead);
      }
    });
  };

  // Helper function to process incomes
  const processIncomes = (incomes: Income[], futureTransactions: FutureTransaction[], today: Date, monthsToLookAhead: number) => {
    // Create a Set to track unique income IDs to prevent duplicates
    const processedIds = new Set<string>();
    
    incomes.forEach(income => {
      const incomeDate = new Date(income.date);
      
      // Skip if we've already processed this income
      if (processedIds.has(income.id)) return;
      processedIds.add(income.id);
      
      // Determine description based on recurrence type (if any)
      let description = income.description;
      if (income.recurring) {
        if (typeof income.recurring === 'object' && income.recurring.type) {
          const recurringType = income.recurring.type;
          if (recurringType === 'daily') {
            description = `${income.description} (Diário)`;
          } else if (recurringType === 'weekly') {
            description = `${income.description} (Semanal)`;
          } else if (recurringType === 'monthly') {
            description = `${income.description} (Mensal)`;
          }
        } else if (income.recurring === true) {
          description = `${income.description} (Mensal)`;
        }
      }
      
      // Add the original income
      futureTransactions.push({
        id: income.id,
        date: incomeDate,
        description: description,
        amount: income.amount,
        type: 'income',
        category: income.category,
        parentId: income.id
      });
      
      // Process recurring incomes
      if (income.recurring) {
        processRecurringIncomes(income, futureTransactions, today, monthsToLookAhead, incomeDate);
      }
    });
  };

  // Helper function to process investments
  const processInvestments = (investments: Investment[], futureTransactions: FutureTransaction[], monthsToLookAhead: number) => {
    const today = new Date();
    
    // Keep track of accumulated investment returns for each investment
    const accumulatedReturns: Record<string, number> = {};
    
    investments.forEach(investment => {
      const months = monthsToLookAhead;
      const investmentDate = new Date(investment.startDate);
      
      // Initialize accumulated returns for this investment
      accumulatedReturns[investment.id] = 0;
      
      // Skip adding initial investment if it's in the past
      if (investmentDate >= today || isSameMonth(investmentDate, today)) {
        // Add the initial investment
        futureTransactions.push({
          id: `${investment.id}-initial`,
          date: investmentDate,
          description: `${investment.description} (Investimento Inicial)`,
          amount: investment.amount,
          type: 'investment',
          category: 'investment',
          parentId: investment.id
        });
      }
      
      // Calculate and add projected returns for future months
      for (let i = 1; i <= months; i++) {
        const futureDate = new Date(today);
        futureDate.setMonth(futureDate.getMonth() + i);
        
        // Skip if investment hasn't started by this future date
        if (investmentDate > futureDate) {
          continue;
        }
        
        const isPeriodMonthly = investment.period === 'monthly';
        const isCompound = investment.isCompound !== false;
        
        // Calculate how many months the investment will have been active by the future date
        const monthsActive = 
          (futureDate.getFullYear() - investmentDate.getFullYear()) * 12 + 
          (futureDate.getMonth() - investmentDate.getMonth());
        
        // Only process if investment has been active for at least a month
        if (monthsActive <= 0) continue;
        
        // Calculate future value based on compound interest
        const futureValue = calculateInvestmentGrowthForMonth(
          investment.amount,
          investment.rate,
          isPeriodMonthly,
          monthsActive,
          isCompound
        );
        
        // Monthly return is the difference from last month
        const prevMonthReturn = accumulatedReturns[investment.id];
        const totalReturn = futureValue - investment.amount;
        const monthlyReturn = totalReturn - prevMonthReturn;
        
        // Update accumulated returns
        accumulatedReturns[investment.id] = totalReturn;
        
        // Add projected return as a transaction
        if (monthlyReturn > 0) {
          futureTransactions.push({
            id: `${investment.id}-growth-${i}`,
            date: futureDate,
            description: `${investment.description} (Rendimento Mensal)`,
            amount: monthlyReturn,
            type: 'income',
            category: 'investment_returns',
            sourceCategory: 'investment',
            parentId: investment.id
          });
        }
      }
    });
  };
  
  // Helper function to check if two dates are in the same month
  function isSameMonth(date1: Date, date2: Date) {
    return date1.getFullYear() === date2.getFullYear() && 
           date1.getMonth() === date2.getMonth();
  }

  return {
    getFutureTransactions
  };
};
