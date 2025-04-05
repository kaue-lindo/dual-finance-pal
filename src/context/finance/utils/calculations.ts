
export const calculateBalanceFromData = (incomes: any[], expenses: any[]) => {
  const totalIncome = incomes.reduce((total, income) => total + income.amount, 0);
  const totalExpense = expenses.reduce((total, expense) => total + expense.amount, 0);
  
  return totalIncome - totalExpense;
};

export const calculateBalanceExcludingInvestmentReturns = (incomes: any[], expenses: any[]) => {
  const totalIncome = incomes.reduce((total, income) => {
    if (income.category === 'investment_returns') {
      return total;
    }
    return total + income.amount;
  }, 0);
  
  const totalExpense = expenses.reduce((total, expense) => total + expense.amount, 0);
  
  return totalIncome - totalExpense;
};

// Importamos a função do arquivo utils/transaction-utils.ts
import { getUniqueTransactionsByMonth } from '@/utils/transaction-utils';

export { getUniqueTransactionsByMonth };
