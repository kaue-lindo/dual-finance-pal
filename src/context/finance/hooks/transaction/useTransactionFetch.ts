
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Income, Expense, Investment, IncomeCategory } from '../../types';
import { calculateBalanceExcludingInvestmentReturns } from '../../utils/calculations';

interface FinanceData {
  id: string;
  amount: number;
  date: string;
  recurring: boolean;
  recurring_days: any[];
  installment_total: number;
  installment_current: number;
  created_at: string;
  updated_at: string;
  is_compound: boolean;
  auth_id: string;
  user_id: string;
  type: string;
  description: string;
  category: string;
  recurring_type: string;
  source_category: string;
  parent_investment_id?: string;
}

export const useTransactionFetch = (
  currentUser: any,
  finances: Record<string, any>,
  setFinances: React.Dispatch<React.SetStateAction<Record<string, any>>>
) => {
  const fetchTransactions = async () => {
    if (!currentUser) return;
    await fetchTransactionsByUserId(currentUser.id);
  };

  const fetchTransactionsByUserId = async (userId: string) => {
    try {
      console.log("Fetching transactions for user:", userId);
      const { data: sessionData } = await supabase.auth.getSession();
      
      let query = supabase
        .from('finances')
        .select('*')
        .eq('user_id', userId);
      
      if (sessionData?.session?.user?.id) {
        query = query.eq('auth_id', sessionData.session.user.id);
      }
        
      const { data, error } = await query;

      if (error) {
        console.error('Error fetching finances:', error);
        return;
      }

      console.log("Fetched transaction data for user", userId, ":", data);
      const incomes: Income[] = [];
      const expenses: Expense[] = [];
      const investments: Investment[] = [];

      setFinances(prev => {
        if (!prev[userId]) {
          return {
            ...prev,
            [userId]: {
              incomes: [],
              expenses: [],
              investments: [],
              balance: 0
            }
          };
        }
        return prev;
      });

      (data as FinanceData[]).forEach(item => {
        if (item.type === 'income') {
          const recurring = item.recurring ? 
            (item.recurring_type ? {
              type: (item.recurring_type || 'monthly'),
              days: item.recurring_days || []
            } : true) : undefined;
          
          incomes.push({
            id: item.id,
            description: item.description,
            amount: parseFloat(item.amount.toString()),
            date: new Date(item.date),
            category: (item.category || 'other') as IncomeCategory,
            recurring
          });
        } else if (item.type === 'expense') {
          expenses.push({
            id: item.id,
            description: item.description,
            amount: parseFloat(item.amount.toString()),
            category: item.category || 'other',
            date: new Date(item.date),
            sourceCategory: item.source_category as IncomeCategory | undefined,
            recurring: item.recurring ? {
              type: (item.recurring_type || 'monthly'),
              days: item.recurring_days || []
            } : undefined,
            installment: item.installment_total ? {
              total: item.installment_total,
              current: item.installment_current,
              remaining: item.installment_total - item.installment_current
            } : undefined
          });
        } else if (item.type === 'investment') {
          investments.push({
            id: item.id,
            description: item.description,
            amount: parseFloat(item.amount.toString()),
            rate: item.recurring_days && item.recurring_days.length > 0 ? 
              parseFloat(item.recurring_days[0].toString()) : 5,
            period: item.recurring_type === 'compound' ? 'monthly' : (item.recurring_type as 'monthly' | 'annual' || 'monthly'),
            startDate: new Date(item.date),
            isCompound: item.is_compound
          });
        } else if (item.type === 'investment_update' && item.parent_investment_id) {
          const parentInvestmentIndex = investments.findIndex(inv => inv.id === item.parent_investment_id);
          
          if (parentInvestmentIndex >= 0) {
            const updatedAmount = parseFloat(investments[parentInvestmentIndex].amount.toString()) + 
                                parseFloat(item.amount.toString());
            
            investments[parentInvestmentIndex] = {
              ...investments[parentInvestmentIndex],
              amount: updatedAmount
            };
            
            console.log(`Reinvestimento aplicado: ${item.amount} adicionado ao investimento ${item.parent_investment_id}`);
          }
        }
      });

      setFinances(prev => {
        const existingFinances = prev[userId] || {
          incomes: [],
          expenses: [],
          investments: [],
          balance: 0
        };
        
        const existingInvestments = existingFinances.investments || [];
        const existingIds = new Set(investments.map(inv => inv.id));
        const uniqueExistingInvestments = existingInvestments.filter(inv => !existingIds.has(inv.id));
        const combinedInvestments = [...investments, ...uniqueExistingInvestments];
        
        const calculatedBalance = calculateBalanceExcludingInvestmentReturns(incomes, expenses);
        
        console.log(`Updated finances for user ${userId}:`, {
          incomes: incomes.length,
          expenses: expenses.length,
          investments: combinedInvestments.length,
          balance: calculatedBalance
        });
        
        return {
          ...prev,
          [userId]: {
            ...existingFinances,
            incomes,
            expenses,
            investments: combinedInvestments,
            balance: calculatedBalance
          }
        };
      });
    } catch (error) {
      console.error('Error in fetchTransactionsByUserId:', error);
    }
  };

  return {
    fetchTransactions,
    fetchTransactionsByUserId
  };
};
