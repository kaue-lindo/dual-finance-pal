
export const calculateBalanceFromData = (incomes: any[], expenses: any[]) => {
  const totalIncome = incomes.reduce((total, income) => total + income.amount, 0);
  const totalExpense = expenses.reduce((total, expense) => total + expense.amount, 0);
  
  return totalIncome - totalExpense;
};

export const calculateBalanceExcludingInvestmentReturns = (incomes: any[], expenses: any[]) => {
  const totalIncome = incomes.reduce((total, income) => {
    if (income.category === 'investment_returns') {
      return total;
    }
    return total + income.amount;
  }, 0);
  
  const totalExpense = expenses.reduce((total, expense) => total + expense.amount, 0);
  
  return totalIncome - totalExpense;
};

export const getUniqueTransactionsByMonth = (transactions: any[], month: string) => {
  // Create a Map to track the most recent transaction by description and type
  const uniqueTransactionsMap = new Map();
  
  // Process transactions to find the most recent ones with the same description and type
  transactions.forEach(transaction => {
    const transactionDate = new Date(transaction.date);
    const transactionKey = `${transaction.description}-${transaction.type}-${transaction.category}`;
    
    // If we don't have this transaction yet, or this one is newer, store it
    if (!uniqueTransactionsMap.has(transactionKey) || 
        transactionDate > new Date(uniqueTransactionsMap.get(transactionKey).date)) {
      uniqueTransactionsMap.set(transactionKey, transaction);
    }
  });
  
  // Convert map values back to an array
  const uniqueTransactions = Array.from(uniqueTransactionsMap.values());
  
  // Sort by date
  return uniqueTransactions.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
};
