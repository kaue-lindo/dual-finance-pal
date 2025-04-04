import { Income, Expense } from '../types';

// Calculate balance from income and expense data
export const calculateBalanceFromData = (incomes: Income[], expenses: Expense[]): number => {
  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  return totalIncome - totalExpenses;
};

// Calculate balance excluding investment returns
export const calculateBalanceExcludingInvestmentReturns = (incomes: Income[], expenses: Expense[]): number => {
  const totalIncome = incomes
    .filter(income => income.category !== 'investment_returns')
    .reduce((sum, income) => sum + income.amount, 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  return totalIncome - totalExpenses;
};

// Calculate real income without mixing with expenses
export const calculateRealIncome = (incomes: Income[]): number => {
  return incomes.reduce((sum, income) => sum + income.amount, 0);
};

// Calculate real income excluding investment returns
export const calculateRealIncomeExcludingInvestmentReturns = (incomes: Income[]): number => {
  return incomes
    .filter(income => income.category !== 'investment_returns')
    .reduce((sum, income) => sum + income.amount, 0);
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
