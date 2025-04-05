
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
    
    // Check if this transaction is a recurring one (recorrente/installment)
    const isRecurring = transaction.id?.includes('-recurring-') || 
                        transaction.id?.includes('-installment-');
                        
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
