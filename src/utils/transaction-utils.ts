
import { format } from 'date-fns';

// Deduplicate transactions to avoid showing duplicates in UI
export const getUniqueTransactionsByMonth = (transactions: any[], keyPrefix: string = '') => {
  // Group transactions by month, type, description and amount
  const groupedTransactions: Record<string, any[]> = {};
  
  transactions.forEach(transaction => {
    if (!transaction.date) return;
    
    const transactionDate = new Date(transaction.date);
    // Create a composite key for deduplication: month-type-description-amount-category
    const month = format(transactionDate, 'yyyy-MM');
    const key = `${keyPrefix}-${month}-${transaction.type}-${transaction.description}-${transaction.amount}-${transaction.category || 'unknown'}`;
    
    // Check if this is a recurring transaction
    const isRecurring = transaction.id?.includes('-recurring-') || 
                        transaction.id?.includes('-installment-') || 
                        transaction.description?.includes('(Mensal)') ||
                        transaction.description?.includes('(Diário)') ||
                        transaction.description?.includes('(Semanal)');
    
    // Only add if not already in the group with the same key
    if (!groupedTransactions[key]) {
      groupedTransactions[key] = [];
    }
    
    // Only add if not already in the group (exact same transaction)
    const exists = groupedTransactions[key].some(t => 
      t.id === transaction.id || 
      (t.description === transaction.description && 
       t.amount === transaction.amount && 
       t.type === transaction.type &&
       format(new Date(t.date), 'yyyy-MM-dd') === format(new Date(transaction.date), 'yyyy-MM-dd'))
    );
    
    if (!exists) {
      groupedTransactions[key].push(transaction);
    }
  });
  
  // For each group, prioritize non-recurring transactions
  const uniqueTransactions: any[] = [];
  
  Object.values(groupedTransactions).forEach(group => {
    // Sort to prioritize original transactions over recurring ones
    const sorted = [...group].sort((a, b) => {
      // Prioritize entries without recurring marks in the id
      const aHasRecurring = a.id?.includes('-recurring-') || a.id?.includes('-installment-');
      const bHasRecurring = b.id?.includes('-recurring-') || b.id?.includes('-installment-');
      
      if (aHasRecurring && !bHasRecurring) return 1;
      if (!aHasRecurring && bHasRecurring) return -1;
      
      return 0;
    });
    
    // Add the first entry (highest priority)
    if (sorted.length > 0) {
      uniqueTransactions.push(sorted[0]);
    }
  });
  
  return uniqueTransactions;
};
