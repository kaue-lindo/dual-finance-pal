
import { useTransactionFetch } from './transaction/useTransactionFetch';
import { useTransactionDelete } from './transaction/useTransactionDelete';
import { useTransactionFuture } from './transaction/useTransactionFuture';

export const useTransactions = (
  currentUser: any,
  finances: Record<string, any>,
  setFinances: React.Dispatch<React.SetStateAction<Record<string, any>>>
) => {
  // Fetch transactions functionality
  const { fetchTransactions, fetchTransactionsByUserId } = useTransactionFetch(
    currentUser,
    finances,
    setFinances
  );

  // Delete transaction functionality
  const { deleteTransaction } = useTransactionDelete(currentUser, fetchTransactions);

  // Get future transactions (projections)
  const { getFutureTransactions } = useTransactionFuture(currentUser, finances);

  return {
    fetchTransactions,
    fetchTransactionsByUserId,
    deleteTransaction,
    getFutureTransactions
  };
};
