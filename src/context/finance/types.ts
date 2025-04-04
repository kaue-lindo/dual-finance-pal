import { User } from './constants';

export type IncomeCategory = 'salary' | 'food-allowance' | 'transportation-allowance' | 'investment_returns' | 'other';

export type RecurringType = 'daily' | 'weekly' | 'monthly';

export type RecurringInfo = {
  type: RecurringType;
  days?: number[]; // Days of month for monthly recurring
};

export type Expense = {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: Date;
  sourceCategory?: IncomeCategory;
  recurring?: RecurringInfo;
  installment?: {
    total: number;
    current: number;
    remaining: number;
  };
  parent_investment_id?: string;
};

export type Income = {
  id: string;
  description: string;
  amount: number;
  date: Date;
  category: IncomeCategory;
  recurring?: boolean | RecurringInfo;
};

export type Investment = {
  id: string;
  description: string;
  amount: number;
  rate: number; // Percentage
  period: 'monthly' | 'annual';
  startDate: Date;
  isCompound?: boolean; // Added to distinguish between simple and compound interest
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
  type: 'income' | 'expense' | 'investment';
  category: string;
  sourceCategory?: string;
  parent_investment_id?: string;
};

export interface FinanceContextType {
  currentUser: User | null;
  users: User[];
  finances: Record<string, UserFinances>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: any }>;
  signup: (email: string, password: string) => Promise<{ success: boolean; error?: any }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: any }>;
  logout: () => Promise<void>;
  addExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addIncome: (income: Income) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
  addInvestment: (investment: Investment) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;
  calculateBalance: () => number;
  getMonthlyExpenseTotal: () => number;
  getFutureTransactions: () => FutureTransaction[];
  simulateExpense: (expense: Expense) => Promise<number>;
  fetchTransactions: () => Promise<void>;
  fetchTransactionsByUserId: (userId: string) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  getIncomeCategories: () => string[];
  getExpenseCategories: () => string[];
  getTotalInvestments: () => number;
  getTotalInvestmentsWithReturns: () => number;
  getProjectedInvestmentReturn: (months: number) => number;
  getCategoryExpenses: () => Record<string, number>;
  getRealIncome: () => number;
  updateUserProfile: (userData: { name?: string; avatarUrl?: string }) => Promise<void>;
  getUserBalance: (userId: string) => number;
  getUserFinances: (userId: string) => UserFinances;
  supabaseUser: any;
  selectedProfile: string | null;
  selectProfile: (userId: string) => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
  getUniqueTransactionsByMonth: (transactions: any[], month: string) => any[];
}
