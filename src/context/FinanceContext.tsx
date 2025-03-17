
import React, { createContext, useContext, useState, useEffect } from 'react';

type User = {
  id: string;
  name: string;
  profileImage?: string;
};

type Expense = {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: Date;
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

type Income = {
  id: string;
  description: string;
  amount: number;
  date: Date;
  recurring?: boolean;
};

type Investment = {
  id: string;
  description: string;
  amount: number;
  rate: number; // Percentage
  period: 'monthly' | 'annual';
  startDate: Date;
};

type UserFinances = {
  incomes: Income[];
  expenses: Expense[];
  investments: Investment[];
  balance: number;
};

type FinanceContextType = {
  currentUser: User | null;
  users: User[];
  finances: Record<string, UserFinances>;
  login: (userId: string, remember: boolean) => void;
  logout: () => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  addIncome: (income: Omit<Income, 'id'>) => void;
  addInvestment: (investment: Omit<Investment, 'id'>) => void;
  calculateBalance: () => number;
  simulateExpense: (expense: Omit<Expense, 'id'>) => number;
};

// Predefined users
const predefinedUsers: User[] = [
  {
    id: 'user1',
    name: 'Usuário 1',
    profileImage: '/profile1.jpg',
  },
  {
    id: 'user2',
    name: 'Usuário 2',
    profileImage: '/profile2.jpg',
  },
];

// Default finances for users
const defaultFinances: Record<string, UserFinances> = {
  user1: {
    incomes: [],
    expenses: [],
    investments: [],
    balance: 0,
  },
  user2: {
    incomes: [],
    expenses: [],
    investments: [],
    balance: 0,
  },
};

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [finances, setFinances] = useState<Record<string, UserFinances>>(defaultFinances);

  // Load data from localStorage on initial render
  useEffect(() => {
    const savedUser = localStorage.getItem('financeCurrentUser');
    const savedFinances = localStorage.getItem('financeData');
    
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    
    if (savedFinances) {
      setFinances(JSON.parse(savedFinances));
    }
  }, []);

  // Save data to localStorage when it changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('financeCurrentUser', JSON.stringify(currentUser));
    }
    
    localStorage.setItem('financeData', JSON.stringify(finances));
  }, [currentUser, finances]);

  const login = (userId: string, remember: boolean) => {
    const user = predefinedUsers.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      if (remember) {
        localStorage.setItem('financeCurrentUser', JSON.stringify(user));
      }
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('financeCurrentUser');
  };

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    if (!currentUser) return;
    
    const newExpense: Expense = {
      ...expense,
      id: Date.now().toString(),
    };
    
    setFinances(prev => ({
      ...prev,
      [currentUser.id]: {
        ...prev[currentUser.id],
        expenses: [...prev[currentUser.id].expenses, newExpense],
      },
    }));
  };

  const addIncome = (income: Omit<Income, 'id'>) => {
    if (!currentUser) return;
    
    const newIncome: Income = {
      ...income,
      id: Date.now().toString(),
    };
    
    setFinances(prev => ({
      ...prev,
      [currentUser.id]: {
        ...prev[currentUser.id].incomes ? 
        {
          ...prev[currentUser.id],
          incomes: [...prev[currentUser.id].incomes, newIncome],
        } : 
        {
          ...prev[currentUser.id],
          incomes: [newIncome],
        },
      },
    }));
  };

  const addInvestment = (investment: Omit<Investment, 'id'>) => {
    if (!currentUser) return;
    
    const newInvestment: Investment = {
      ...investment,
      id: Date.now().toString(),
    };
    
    setFinances(prev => ({
      ...prev,
      [currentUser.id]: {
        ...prev[currentUser.id],
        investments: [...prev[currentUser.id].investments, newInvestment],
      },
    }));
  };

  const calculateBalance = () => {
    if (!currentUser) return 0;
    
    const userFinances = finances[currentUser.id];
    
    // Calculate total income
    const totalIncome = userFinances.incomes.reduce((sum, income) => sum + income.amount, 0);
    
    // Calculate total expenses
    const totalExpenses = userFinances.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    return totalIncome - totalExpenses;
  };

  const simulateExpense = (expense: Omit<Expense, 'id'>) => {
    if (!currentUser) return 0;
    
    // Current balance
    const currentBalance = calculateBalance();
    
    // Return the new balance after the simulated expense
    return currentBalance - expense.amount;
  };

  return (
    <FinanceContext.Provider
      value={{
        currentUser,
        users: predefinedUsers,
        finances,
        login,
        logout,
        addExpense,
        addIncome,
        addInvestment,
        calculateBalance,
        simulateExpense,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
