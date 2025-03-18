
import { Income, Expense } from './types';

export const calculateBalanceFromData = (incomes: Income[], expenses: Expense[]): number => {
  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  return totalIncome - totalExpenses;
};

// Calculate real income without mixing with expenses
export const calculateRealIncome = (incomes: Income[]): number => {
  return incomes.reduce((sum, income) => sum + income.amount, 0);
};

// Calculate expenses separately
export const calculateTotalExpenses = (expenses: Expense[]): number => {
  return expenses.reduce((sum, expense) => sum + expense.amount, 0);
};

// Calculate monthly installment amount from total
export const calculateMonthlyPayment = (total: number, months: number): number => {
  if (months <= 0) return total;
  return total / months;
};

// Calculate projected value based on growth rate
export const calculateProjectedValue = (principal: number, rate: number, months: number): number => {
  // Convert annual rate to monthly
  const monthlyRate = rate / 12 / 100;
  return principal * Math.pow(1 + monthlyRate, months);
};
