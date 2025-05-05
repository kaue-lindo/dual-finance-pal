
import React, { createContext, useContext, useState, useEffect } from 'react';
import { FinanceContextType, UserFinances, FutureTransaction } from './types';
import { defaultFinances } from './constants';
import { useAuth } from './hooks/useAuth';
import { useExpenses } from './hooks/useExpenses';
import { useIncomes } from './hooks/useIncomes';
import { useInvestments } from './hooks/useInvestments';
import { useTransactions } from './hooks/useTransactions';
import { useUserProfile } from './hooks/useUserProfile';
import { getUniqueTransactionsByMonth } from '@/utils/transaction-utils';

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
  
  const expenses = useExpenses(currentUser, finances, setFinances);
  const incomes = useIncomes(currentUser, finances, setFinances);
  const investments = useInvestments(currentUser, finances, setFinances);
  const transactions = useTransactions(currentUser, finances, setFinances);
  const userProfile = useUserProfile(currentUser, setCurrentUser);

  // Create a fetchTransactions reference for investments to use
  const fetchTransactionsForInvestments = transactions.fetchTransactions;

  // Pass the fetchTransactionsForInvestments to investments
  Object.defineProperty(investments, 'fetchTransactions', {
    value: fetchTransactionsForInvestments
  });

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
    const targetUserId = userId || (currentUser ? currentUser.id : '');
    if (!targetUserId) return 0;
    
    const userFinances = finances[targetUserId];
    if (!userFinances || !userFinances.investments) return 0;
    
    return userFinances.investments.reduce((total, investment) => {
      // Only count non-finalized investments
      if (!investment.isFinalized) {
        return total + investment.amount;
      }
      return total;
    }, 0);
  };

  // Function to get total investments with returns for a specific user
  const getTotalInvestmentsWithReturnsForUser = (userId?: string) => {
    const targetUserId = userId || (currentUser ? currentUser.id : '');
    if (!targetUserId) return 0;
    
    const userFinances = finances[targetUserId];
    if (!userFinances || !userFinances.investments) return 0;
    
    const today = new Date();
    
    return userFinances.investments.reduce((total, investment) => {
      // Skip finalized investments
      if (investment.isFinalized) return total;
      
      const startDate = new Date(investment.startDate);
      
      // Skip investments that haven't started yet
      if (startDate > today) {
        return total + investment.amount; // Just return the principal
      }
      
      const monthsDiff = (today.getFullYear() - startDate.getFullYear()) * 12 + 
                       (today.getMonth() - startDate.getMonth());
      
      const isPeriodMonthly = investment.period === 'monthly';
      const isCompound = investment.isCompound !== false;
      
      // Use the investment utility to calculate the current value
      const futureValue = investment.amount * Math.pow(
        1 + (isPeriodMonthly ? investment.rate / 100 : investment.rate / 1200), 
        Math.max(0, monthsDiff)
      );
      
      return total + futureValue;
    }, 0);
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
        getProjectedInvestmentReturn: investments.getProjectedInvestmentReturn,
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
