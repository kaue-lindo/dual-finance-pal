
import { User } from './constants';

export type IncomeCategory = 'salary' | 'food-allowance' | 'transportation-allowance' | 'other';

export type Expense = {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: Date;
  sourceCategory?: IncomeCategory;
  recurring?: {
    type: 'daily' | 'weekly' | 'monthly';
    days?: number[]; // Days of month for monthly recurring
  };
  installment?: {
    total: number;
    current: number;
    remaining: number;
  };
};

export type Income = {
  id: string;
  description: string;
  amount: number;
  date: Date;
  category: IncomeCategory;
  recurring?: boolean;
};

export type Investment = {
  id: string;
  description: string;
  amount: number;
  rate: number; // Percentage
  period: 'monthly' | 'annual';
  startDate: Date;
};

export type UserFinances = {
  incomes: Income[];
  expenses: Expense[];
  investments: Investment[];
  balance: number;
};

export type FutureTransaction = {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  sourceCategory?: string;
};

export type FinanceContextType = {
  currentUser: User | null;
  users: User[];
  finances: Record<string, UserFinances>;
  login: (userId: string, remember: boolean) => void;
  logout: () => void;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  addIncome: (income: Omit<Income, 'id'>) => Promise<void>;
  addInvestment: (investment: Omit<Investment, 'id'>) => void;
  calculateBalance: () => number;
  getMonthlyExpenseTotal: () => number;
  getFutureTransactions: () => FutureTransaction[];
  simulateExpense: (expense: Omit<Expense, 'id'>) => number;
  fetchTransactions: () => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  getIncomeCategories: () => { value: IncomeCategory; label: string }[];
};
