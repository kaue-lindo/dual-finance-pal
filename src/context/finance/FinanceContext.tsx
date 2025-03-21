
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
  const { currentUser, setCurrentUser, loading, login, logout, users } = useAuth();
  const expenses = useExpenses(currentUser, finances, setFinances);
  const incomes = useIncomes(currentUser, finances, setFinances);
  const investments = useInvestments(currentUser, finances, setFinances);
  const transactions = useTransactions(currentUser, finances, setFinances);
  const userProfile = useUserProfile(currentUser, setCurrentUser);

  useEffect(() => {
    if (currentUser && !loading) {
      transactions.fetchTransactions();
      
      // Fetch transactions for all users to enable comparison
      users.forEach(user => {
        if (user.id !== currentUser.id) {
          transactions.fetchTransactionsByUserId(user.id);
        }
      });
    }
  }, [currentUser, loading]);

  return (
    <FinanceContext.Provider
      value={{
        currentUser,
        users,
        finances,
        login,
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
        getUserFinances: (userId) => finances[userId] || defaultFinances[userId]
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
