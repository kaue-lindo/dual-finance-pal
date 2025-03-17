
import { Income, Expense } from './types';

export const calculateBalanceFromData = (incomes: Income[], expenses: Expense[]): number => {
  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  return totalIncome - totalExpenses;
};
