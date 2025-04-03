
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
  // Filter unique incomes by ID to prevent duplication
  const uniqueIncomes = incomes.filter((income, index, self) => 
    index === self.findIndex(i => i.id === income.id)
  );
  return uniqueIncomes.reduce((sum, income) => sum + income.amount, 0);
};

// Calculate real income excluding investment returns
export const calculateRealIncomeExcludingInvestmentReturns = (incomes: Income[]): number => {
  // Filter unique incomes by ID to prevent duplication
  const uniqueIncomes = incomes.filter((income, index, self) => 
    index === self.findIndex(i => i.id === income.id)
  );
  return uniqueIncomes
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

// New utility function to get unique transactions by month
export const getUniqueTransactionsByMonth = (transactions: any[], month: string) => {
  const transactionsMap = new Map();
  
  transactions.forEach(transaction => {
    // For recurring transactions, we need special handling
    if (transaction.id && transaction.id.includes('-recurring-')) {
      const baseId = transaction.id.split('-recurring-')[0];
      const transDate = new Date(transaction.date);
      const transMonth = `${transDate.getFullYear()}-${transDate.getMonth()}`;
      const key = `${baseId}-${transMonth}`;
      
      // Only add if we haven't seen this transaction in this month
      if (!transactionsMap.has(key)) {
        transactionsMap.set(key, transaction);
      }
    } else {
      // For non-recurring transactions, just use the ID
      if (!transactionsMap.has(transaction.id)) {
        transactionsMap.set(transaction.id, transaction);
      }
    }
  });
  
  return Array.from(transactionsMap.values());
};
