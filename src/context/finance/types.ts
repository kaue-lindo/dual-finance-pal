
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
  isFinalized?: boolean; // Flag to indicate if investment has been finalized
  finalizedDate?: Date; // Date when investment was finalized
};

export type UserFinances = {
  incomes: Income[];
  expenses: Expense[];
  investments: Investment[];
  balance: number;
};

export type TransactionType = 'income' | 'expense' | 'investment' | 'investment_value';

export type FutureTransaction = {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  sourceCategory?: string;
  parent_investment_id?: string;
  parentId?: string; // Added to track the original transaction's ID
};

export interface FinanceContextType {
  currentUser: User | null;
  users: User[];
  finances: Record<string, UserFinances>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: any }>;
  signup: (email: string, password: string) => Promise<{ success: boolean; error?: any }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: any }>;
  logout: () => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addIncome: (income: Omit<Income, 'id'>) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
  addInvestment: (investment: Omit<Investment, 'id'>) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;
  finalizeInvestment: (id: string) => Promise<void>; // Add function to finalize investment
  calculateBalance: () => number;
  getMonthlyExpenseTotal: () => number;
  getFutureTransactions: () => FutureTransaction[];
  simulateExpense: (expense: Omit<Expense, 'id'>) => number;
  fetchTransactions: () => Promise<void>;
  fetchTransactionsByUserId: (userId: string) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  getIncomeCategories: () => { value: string; label: string }[];
  getExpenseCategories: () => { value: string; label: string }[];
  getTotalInvestments: (userId?: string) => number;
  getTotalInvestmentsWithReturns: (userId?: string) => number;
  getProjectedInvestmentReturn: (months: number, userId?: string) => number;
  getCategoryExpenses: (userId?: string) => { category: string; amount: number }[];
  getRealIncome: () => number;
  updateUserProfile: (userData: { name?: string; avatarUrl?: string }) => Promise<User>;
  getUserBalance: (userId: string) => number;
  getUserFinances: (userId: string) => UserFinances;
  supabaseUser: any;
  selectedProfile: string | null;
  selectProfile: (userId: string) => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
  getUniqueTransactionsByMonth: (transactions: any[], month: string) => any[];
}
