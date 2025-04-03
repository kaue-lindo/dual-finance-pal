
import { Income, Expense, Investment } from '../types';

// Calculate balance from income and expense data
export const calculateBalanceFromData = (incomes: Income[], expenses: Expense[]): number => {
  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
  
  // Make sure we don't double-count expenses
  const uniqueExpenses = expenses.filter((expense, index, self) => 
    index === self.findIndex(e => e.id === expense.id)
  );
  const totalExpenses = uniqueExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  return totalIncome - totalExpenses;
};

// Calculate balance excluding investment returns
export const calculateBalanceExcludingInvestmentReturns = (incomes: Income[], expenses: Expense[]): number => {
  const totalIncome = incomes
    .filter(income => income.category !== 'investment_returns')
    .reduce((sum, income) => sum + income.amount, 0);
  
  // Make sure we don't double-count expenses
  const uniqueExpenses = expenses.filter((expense, index, self) => 
    index === self.findIndex(e => e.id === expense.id)
  );
  const totalExpenses = uniqueExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  
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
  // Make sure we don't double-count expenses
  const uniqueExpenses = expenses.filter((expense, index, self) => 
    index === self.findIndex(e => e.id === expense.id)
  );
  return uniqueExpenses.reduce((sum, expense) => sum + expense.amount, 0);
};

// Calculate investments total with accumulated returns
export const calculateInvestmentsWithReturns = (investments: Investment[], incomes: Income[]): number => {
  // Get base investments amount
  const baseInvestments = investments.reduce((sum, investment) => sum + investment.amount, 0);
  
  // Get accumulated returns from incomes that are categorized as investment returns
  const investmentReturns = incomes
    .filter(income => income.category === 'investment_returns')
    .reduce((sum, income) => sum + income.amount, 0);
  
  return baseInvestments + investmentReturns;
};

// Calculate monthly installment amount from total
export const calculateMonthlyPayment = (total: number, months: number): number => {
  if (months <= 0) return total;
  return total / months;
};
