
import React, { createContext, useContext, useState, useEffect } from 'react';
import { FinanceContextType, UserFinances, FutureTransaction, TransactionType } from './types';
import { defaultFinances } from './constants';
import { useAuth } from './hooks/useAuth';
import { useExpenses } from './hooks/useExpenses';
import { useIncomes } from './hooks/useIncomes';
import { useInvestments } from './hooks/useInvestments';
import { useTransactions } from './hooks/useTransactions';
import { useUserProfile } from './hooks/useUserProfile';
import { getUniqueTransactionsByMonth } from '@/utils/transaction-utils';
import { useConfig } from '@/context/ConfigContext';

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [finances, setFinances] = useState<Record<string, UserFinances>>(defaultFinances);
  const { 
    currentUser, 
    setCurrentUser, 
    loading, 
    login, 
    signup,
    signInWithGoogle,
    logout, 
    users,
    supabaseUser,
    selectedProfile,
    selectProfile,
    isAuthenticated
  } = useAuth();
  
  const config = useConfig();
  
  const expenses = useExpenses(currentUser, finances, setFinances);
  const incomes = useIncomes(currentUser, finances, setFinances);
  const investments = useInvestments(currentUser, finances, setFinances);
  const transactions = useTransactions(currentUser, finances, setFinances);
  const userProfile = useUserProfile(currentUser, setCurrentUser);

  // Connect the fetchTransactions function to useInvestments
  useEffect(() => {
    if (investments && transactions.fetchTransactions) {
      investments.setFetchTransactions(transactions.fetchTransactions);
    }
  }, [investments, transactions]);

  // Fetch transactions when user changes or auth state changes
  useEffect(() => {
    if (currentUser && !loading && isAuthenticated) {
      console.log("Fetching transactions for current user:", currentUser.id);
      transactions.fetchTransactions();
    }
  }, [currentUser, loading, isAuthenticated]);

  // Make sure each user has a finance record
  useEffect(() => {
    if (users.length > 0) {
      const updatedFinances = {...finances};
      
      users.forEach(user => {
        if (!updatedFinances[user.id]) {
          updatedFinances[user.id] = {
            incomes: [],
            expenses: [],
            investments: [],
            balance: 0
          };
        }
      });
      
      setFinances(updatedFinances);
    }
  }, [users]);

  // Function to get total investments for a specific user
  const getTotalInvestmentsForUser = (userId?: string) => {
    return investments.getTotalInvestments(userId);
  };

  // Function to get total investments with returns for a specific user
  const getTotalInvestmentsWithReturnsForUser = (userId?: string) => {
    return investments.getTotalInvestmentsWithReturns(userId);
  };

  // Function to get projected investment return for specific period and user
  const getProjectedInvestmentReturnForUser = (months: number, userId?: string) => {
    return investments.getProjectedInvestmentReturn(months, userId);
  };

  // Function to get category expenses for a specific user
  const getCategoryExpensesForUser = (userId?: string) => {
    const targetUserId = userId || (currentUser ? currentUser.id : '');
    if (!targetUserId) return [];
    
    const userFinances = finances[targetUserId];
    if (!userFinances || !userFinances.expenses) return [];
    
    const categoryMap = new Map();
    
    userFinances.expenses.forEach(expense => {
      const category = expense.category || 'others';
      const currentAmount = categoryMap.get(category) || 0;
      categoryMap.set(category, currentAmount + expense.amount);
    });
    
    return Array.from(categoryMap, ([category, amount]) => ({
      category,
      amount
    }));
  };

  return (
    <FinanceContext.Provider
      value={{
        currentUser,
        users,
        finances,
        login,
        signup,
        signInWithGoogle,
        logout,
        addExpense: expenses.addExpense,
        deleteExpense: expenses.deleteExpense,
        addIncome: incomes.addIncome,
        deleteIncome: incomes.deleteIncome,
        addInvestment: investments.addInvestment,
        deleteInvestment: investments.deleteInvestment,
        finalizeInvestment: investments.finalizeInvestment,
        calculateBalance: expenses.calculateBalance,
        getMonthlyExpenseTotal: expenses.getMonthlyExpenseTotal,
        getFutureTransactions: transactions.getFutureTransactions,
        simulateExpense: expenses.simulateExpense,
        fetchTransactions: transactions.fetchTransactions,
        fetchTransactionsByUserId: transactions.fetchTransactionsByUserId,
        deleteTransaction: transactions.deleteTransaction,
        getIncomeCategories: incomes.getIncomeCategories,
        getExpenseCategories: expenses.getExpenseCategories,
        getTotalInvestments: getTotalInvestmentsForUser,
        getTotalInvestmentsWithReturns: getTotalInvestmentsWithReturnsForUser,
        getProjectedInvestmentReturn: getProjectedInvestmentReturnForUser,
        getCategoryExpenses: getCategoryExpensesForUser,
        getRealIncome: incomes.getRealIncome,
        updateUserProfile: userProfile.updateUserProfile,
        getUserBalance: expenses.getUserBalance,
        getUserFinances: (userId) => finances[userId] || defaultFinances[userId],
        supabaseUser,
        selectedProfile,
        selectProfile,
        isAuthenticated,
        loading,
        getUniqueTransactionsByMonth
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
