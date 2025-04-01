import { User } from './constants';

export type IncomeCategory = 'salary' | 'food-allowance' | 'transportation-allowance' | 'investment_returns' | 'other';

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
  recurring?: boolean | {
    type: 'daily' | 'weekly' | 'monthly';
    days?: number[]; // Days of month for monthly recurring
  };
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
};

export type FinanceContextType = {
  currentUser: User | null;
  users: User[];
  finances: Record<string, UserFinances>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: any }>;
  signup: (email: string, password: string) => Promise<{ success: boolean; error?: any }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: any }>;
  logout: () => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => Promise<void>;
  addIncome: (income: Omit<Income, 'id'>) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
  addInvestment: (investment: Omit<Investment, 'id'>) => void;
  deleteInvestment: (id: string) => void;
  calculateBalance: () => number;
  getMonthlyExpenseTotal: () => number;
  getFutureTransactions: () => FutureTransaction[];
  simulateExpense: (expense: Omit<Expense, 'id'>) => number;
  fetchTransactions: () => Promise<void>;
  fetchTransactionsByUserId: (userId: string) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  getIncomeCategories: () => { value: IncomeCategory; label: string }[];
  getExpenseCategories: () => { value: string; label: string }[];
  getTotalInvestments: () => number;
  getProjectedInvestmentReturn: (months?: number) => number;
  getCategoryExpenses: (userId?: string) => { category: string; amount: number }[];
  getRealIncome: () => number;
  updateUserProfile: (userData: { name?: string; avatarUrl?: string }) => void;
  getUserBalance: (userId: string) => number;
  getUserFinances: (userId: string) => UserFinances;
  supabaseUser: any;
  selectedProfile: string | null;
  selectProfile: (userId: string) => void;
  isAuthenticated: boolean;
  loading: boolean;
};
