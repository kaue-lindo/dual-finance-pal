
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useTransactionDelete = (
  currentUser: any,
  fetchTransactions: () => Promise<void>
) => {
  const deleteTransaction = async (id: string) => {
    if (!currentUser) return;
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }
      
      if (!id.includes('-installment-') && !id.includes('-recurring-') && !id.includes('-growth-')) {
        console.log('Deleting transaction with ID:', id);
        
        const { error } = await supabase
          .from('finances')
          .delete()
          .eq('id', id)
          .eq('auth_id', sessionData.session.user.id);

        if (error) {
          console.error('Error deleting transaction:', error);
          toast.error('Erro ao remover transação');
          return;
        }
        
        await fetchTransactions();
        toast.success('Transação removida com sucesso');
      } else {
        let baseId;
        if (id.includes('-installment-')) {
          baseId = id.split('-installment-')[0];
        } else if (id.includes('-recurring-')) {
          baseId = id.split('-recurring-')[0];
        } else if (id.includes('-growth-')) {
          toast.success('Transação removida da visualização');
          return;
        }
        
        if (baseId) {
          console.log('Deleting base transaction with ID:', baseId);
          
          const { error } = await supabase
            .from('finances')
            .delete()
            .eq('id', baseId)
            .eq('auth_id', sessionData.session.user.id);

          if (error) {
            console.error('Error deleting base transaction:', error);
            toast.error('Erro ao remover transação');
          } else {
            await fetchTransactions();
            toast.success('Transação e suas futuras ocorrências removidas com sucesso');
          }
        }
      }
    } catch (error) {
      console.error('Error in deleteTransaction:', error);
      toast.error('Erro ao remover transação');
    }
  };

  return {
    deleteTransaction
  };
};
