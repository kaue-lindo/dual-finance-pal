
import { getUniqueTransactionsByMonth } from '@/utils/transaction-utils';

export const calculateBalanceFromData = (incomes: any[], expenses: any[]) => {
  // Use our deduplication utility to ensure correct calculations
  const uniqueIncomes = getUniqueTransactionsByMonth(incomes, 'calc-balance-income');
  const uniqueExpenses = getUniqueTransactionsByMonth(expenses, 'calc-balance-expense');
  
  const totalIncome = uniqueIncomes.reduce((total, income) => total + income.amount, 0);
  const totalExpense = uniqueExpenses.reduce((total, expense) => total + expense.amount, 0);
  
  return totalIncome - totalExpense;
};

export const calculateBalanceExcludingInvestmentReturns = (incomes: any[], expenses: any[]) => {
  // Use our deduplication utility to ensure correct calculations
  const uniqueIncomes = getUniqueTransactionsByMonth(incomes, 'calc-balance-excl-income');
  const uniqueExpenses = getUniqueTransactionsByMonth(expenses, 'calc-balance-excl-expense');
  
  const totalIncome = uniqueIncomes.reduce((total, income) => {
    if (income.category === 'investment_returns') {
      return total;
    }
    return total + income.amount;
  }, 0);
  
  const totalExpense = uniqueExpenses.reduce((total, expense) => total + expense.amount, 0);
  
  return totalIncome - totalExpense;
};

// Export the functions from our transaction-utils.ts file
export { getUniqueTransactionsByMonth, calculatePeriodTotals } from '@/utils/transaction-utils';
