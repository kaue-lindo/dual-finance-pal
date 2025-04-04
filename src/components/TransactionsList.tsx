
import React from 'react';
import { FutureTransaction } from '@/context/finance/types';
import { formatCurrency } from '@/context/finance/utils/formatting';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Banknote, 
  Calendar, 
  Trash2
} from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';

interface TransactionsListProps {
  transactions: FutureTransaction[];
  onDelete?: (id: string) => Promise<void>;
  showDelete?: boolean;
  title?: string;
  emptyMessage?: string;
  limit?: number;
}

const TransactionsList = ({ 
  transactions, 
  onDelete, 
  showDelete = true,
  title = "Transações",
  emptyMessage = "Nenhuma transação encontrada",
  limit
}: TransactionsListProps) => {
  const { getUniqueTransactionsByMonth } = useFinance();
  
  // Aplicar a deduplicação de transações
  const currentMonthKey = `${new Date().getFullYear()}-${new Date().getMonth()}`;
  const uniqueTransactions = getUniqueTransactionsByMonth(transactions, currentMonthKey);
  
  const displayTransactions = limit ? uniqueTransactions.slice(0, limit) : uniqueTransactions;
  
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'income':
        return <ArrowUpCircle className="text-green-500" size={20} />;
      case 'expense':
        return <ArrowDownCircle className="text-red-500" size={20} />;
      case 'investment':
        return <Banknote className="text-blue-500" size={20} />;
      default:
        return <Calendar className="text-gray-500" size={20} />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'income':
        return 'text-green-500';
      case 'expense':
        return 'text-red-500';
      case 'investment':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <Card className="finance-card p-5 h-full">
      <h2 className="text-lg font-semibold text-white mb-4">{title}</h2>
      <Separator className="bg-gray-700 mb-4" />
      
      {displayTransactions.length === 0 ? (
        <div className="text-center text-gray-400 py-8">{emptyMessage}</div>
      ) : (
        <div className="space-y-4">
          {displayTransactions.map((transaction) => (
            <div key={transaction.id} className="bg-finance-dark-lighter p-3 rounded-lg flex items-center">
              <div className="mr-3">
                {getTransactionIcon(transaction.type)}
              </div>
              
              <div className="flex-1">
                <div className="font-medium text-white">{transaction.description}</div>
                <div className="text-sm text-gray-400">
                  {format(new Date(transaction.date), 'dd MMM yyyy', { locale: ptBR })}
                  {transaction.category && ` • ${transaction.category}`}
                </div>
              </div>
              
              <div className="flex flex-col items-end">
                <span className={`font-medium ${getTransactionColor(transaction.type)}`}>
                  {transaction.type === 'expense' ? '-' : '+'} {formatCurrency(transaction.amount)}
                </span>
                
                {showDelete && onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 mt-1 text-gray-400 hover:text-red-500"
                    onClick={() => onDelete(transaction.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                )}
              </div>
            </div>
          ))}
          
          {limit && transactions.length > limit && (
            <div className="text-center mt-4">
              <Button variant="link" className="text-finance-blue">
                Ver todas ({transactions.length})
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default TransactionsList;
