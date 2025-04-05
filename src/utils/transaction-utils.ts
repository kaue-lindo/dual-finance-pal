
import { format } from 'date-fns';

// Deduplicate transactions to avoid showing duplicates in UI
export const getUniqueTransactionsByMonth = (transactions: any[], keyPrefix: string = '') => {
  // Create a Map to track unique transactions
  const uniqueTransactionsMap = new Map();
  
  // Process each transaction
  transactions.forEach(transaction => {
    if (!transaction.date) return;
    
    const transactionDate = new Date(transaction.date);
    // Create a composite key for deduplication: month-type-description-amount-category
    const month = format(transactionDate, 'yyyy-MM');
    const day = transactionDate.getDate();
    
    // Include the day in the key to distinguish between different days of the same month
    const key = `${keyPrefix}-${month}-${day}-${transaction.type}-${transaction.description}-${transaction.amount}-${transaction.category || 'unknown'}`;
    
    // Check if this transaction is a recurring one (recorrente/installment)
    const isRecurring = transaction.id?.includes('-recurring-') || 
                        transaction.id?.includes('-installment-');
    
    // Special handling for recurring transactions - exclude them if they're duplicates
    if (isRecurring) {
      // For recurring transactions, we need to check if we already have the base transaction
      const baseId = transaction.id?.split('-recurring-')[0] || transaction.id?.split('-installment-')[0];
      
      // If the base transaction exists in our collection, skip this recurring instance
      const hasBaseTransaction = Array.from(uniqueTransactionsMap.values())
        .some(t => t.id === baseId || t.id?.startsWith(baseId));
      
      if (hasBaseTransaction) {
        // We already have the base transaction, so skip this recurring instance
        return;
      }
    }
                        
    // If we have an original transaction with the same properties, prefer it over recurring ones
    if (!uniqueTransactionsMap.has(key)) {
      uniqueTransactionsMap.set(key, transaction);
    } else {
      // If we already have a transaction with this key, check if it's recurring
      const existingTransaction = uniqueTransactionsMap.get(key);
      const isExistingRecurring = existingTransaction.id?.includes('-recurring-') || 
                                  existingTransaction.id?.includes('-installment-');
      
      // If the existing one is recurring but the new one isn't, replace it
      // OR if both are recurring but this one has a more "original-looking" ID, prefer it
      if ((isExistingRecurring && !isRecurring) || 
          (isExistingRecurring && isRecurring && transaction.id < existingTransaction.id)) {
        uniqueTransactionsMap.set(key, transaction);
      }
    }
  });
  
  // Convert the map values back to an array
  const uniqueTransactions = Array.from(uniqueTransactionsMap.values());
  
  // Sort by date (most recent first)
  return uniqueTransactions.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
};

// Helper function to calculate correct expense/income totals for a period
export const calculatePeriodTotals = (transactions: any[]) => {
  // First ensure we have no duplicates
  const uniqueTransactions = getUniqueTransactionsByMonth(transactions, 'calc-totals');
  
  let totalIncome = 0;
  let totalExpense = 0;
  let totalInvestment = 0;
  
  uniqueTransactions.forEach(transaction => {
    const amount = parseFloat(transaction.amount?.toString() || '0');
    
    if (transaction.type === 'income') {
      totalIncome += amount;
    } else if (transaction.type === 'expense') {
      totalExpense += amount;
    } else if (transaction.type === 'investment') {
      totalInvestment += amount;
    }
  });
  
  return {
    totalIncome,
    totalExpense,
    totalInvestment,
    balance: totalIncome - totalExpense - totalInvestment
  };
};
