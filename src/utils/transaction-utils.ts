
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
    const key = `${keyPrefix}-${month}-${transaction.type}-${transaction.description}-${transaction.amount}-${transaction.category || 'unknown'}`;
    
    // Check if this transaction or a similar one already exists in our map
    if (!uniqueTransactionsMap.has(key)) {
      uniqueTransactionsMap.set(key, transaction);
    } else {
      // If we already have a transaction with this key, prefer the original one over recurring
      const existingTransaction = uniqueTransactionsMap.get(key);
      const isExistingRecurring = existingTransaction.id?.includes('-recurring-') || 
                                existingTransaction.id?.includes('-installment-');
      const isNewRecurring = transaction.id?.includes('-recurring-') || 
                           transaction.id?.includes('-installment-');
      
      // If the existing one is recurring but the new one isn't, replace it
      if (isExistingRecurring && !isNewRecurring) {
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
