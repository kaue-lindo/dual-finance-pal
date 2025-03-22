
import React, { createContext, useContext, useState, useEffect } from 'react';
import { FinanceContextType, UserFinances } from './types';
import { defaultFinances } from './constants';
import { useAuth } from './hooks/useAuth';
import { useExpenses } from './hooks/useExpenses';
import { useIncomes } from './hooks/useIncomes';
import { useInvestments } from './hooks/useInvestments';
import { useTransactions } from './hooks/useTransactions';
import { useUserProfile } from './hooks/useUserProfile';

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

  useEffect(() => {
    if (currentUser && !loading) {
      console.log("Fetching transactions for current user:", currentUser.id);
      transactions.fetchTransactions();
      
      // Fetch transactions for all users to enable comparison
      users.forEach(user => {
        if (user.id !== currentUser.id) {
          console.log("Fetching transactions for comparison user:", user.id);
          transactions.fetchTransactionsByUserId(user.id);
        }
      });
    }
  }, [currentUser, loading]);

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
        addIncome: incomes.addIncome,
        addInvestment: investments.addInvestment,
        deleteInvestment: investments.deleteInvestment,
        calculateBalance: expenses.calculateBalance,
        getMonthlyExpenseTotal: expenses.getMonthlyExpenseTotal,
        getFutureTransactions: transactions.getFutureTransactions,
        simulateExpense: expenses.simulateExpense,
        fetchTransactions: transactions.fetchTransactions,
        fetchTransactionsByUserId: transactions.fetchTransactionsByUserId,
        deleteTransaction: transactions.deleteTransaction,
        getIncomeCategories: incomes.getIncomeCategories,
        getTotalInvestments: investments.getTotalInvestments,
        getProjectedInvestmentReturn: investments.getProjectedInvestmentReturn,
        getCategoryExpenses: expenses.getCategoryExpenses,
        getRealIncome: incomes.getRealIncome,
        updateUserProfile: userProfile.updateUserProfile,
        getUserBalance: expenses.getUserBalance,
        getUserFinances: (userId) => finances[userId] || defaultFinances[userId],
        supabaseUser,
        selectedProfile,
        selectProfile,
        isAuthenticated
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
