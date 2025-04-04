
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowUp, ArrowDown, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { getCategoryColor, formatCategoryName } from '@/utils/chartUtils';
import { getUniqueTransactionsByMonth } from '@/utils/transaction-utils';

interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: 'income' | 'expense' | 'investment';
  category?: string;
}

interface TransactionsListProps {
  transactions: Transaction[];
  limit?: number;
  showBalance?: boolean;
  onTransactionClick?: (transaction: Transaction) => void;
}

const TransactionsList: React.FC<TransactionsListProps> = ({
  transactions,
  limit,
  showBalance = false,
  onTransactionClick
}) => {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-400">Nenhuma transação encontrada</p>
      </div>
    );
  }

  // Ensure all transactions have valid dates
  const validTransactions = transactions.filter(t => t.date instanceof Date && !isNaN(t.date.getTime()));
  
  // Sort transactions by date (most recent first)
  const sortedTransactions = [...validTransactions].sort((a, b) => b.date.getTime() - a.date.getTime());
  
  // Apply deduplication to prevent showing duplicate transactions
  const uniqueTransactions = getUniqueTransactionsByMonth(sortedTransactions);
  
  // Apply limit if specified
  const displayTransactions = limit ? uniqueTransactions.slice(0, limit) : uniqueTransactions;

  return (
    <div className="space-y-3">
      {displayTransactions.map((transaction, index) => (
        <Card 
          key={`${transaction.id}-${index}`} 
          className="finance-card p-4 cursor-pointer"
          onClick={() => onTransactionClick?.(transaction)}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                transaction.type === 'income' 
                  ? 'bg-green-500/20' 
                  : transaction.type === 'investment' 
                    ? 'bg-blue-500/20' 
                    : 'bg-red-500/20'
              }`}>
                {transaction.type === 'income' ? (
                  <ArrowUp className="h-5 w-5 text-green-500" />
                ) : transaction.type === 'investment' ? (
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                ) : (
                  <ArrowDown className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div>
                <p className="text-white font-medium">{transaction.description}</p>
                <div className="flex text-xs space-x-2">
                  <span className="text-gray-400">
                    {format(transaction.date, 'dd MMM yyyy', { locale: ptBR })}
                  </span>
                  {transaction.category && (
                    <span style={{ color: getCategoryColor(transaction.category) }}>
                      {formatCategoryName(transaction.category)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <span className={`font-bold ${
              transaction.type === 'income' 
                ? 'text-green-500' 
                : transaction.type === 'investment' 
                  ? 'text-blue-500' 
                  : 'text-red-500'
            }`}>
              {transaction.type === 'income' 
                ? '+' 
                : transaction.type === 'investment' 
                  ? '•' 
                  : '-'
              }
              {formatCurrency(transaction.amount)}
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default TransactionsList;
