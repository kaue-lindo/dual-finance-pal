
import { FutureTransaction } from "@/context/finance/types";
import { calculateInvestmentGrowthForMonth } from "@/context/finance/utils/projections";

// Calculate impact of all transactions on balance for a specific month
export const calculateMonthlyBalanceImpact = (
  futureTransactions: FutureTransaction[],
  startDate: Date, 
  endDate: Date
): number => {
  let impact = 0;

  futureTransactions.forEach(transaction => {
    const transactionDate = new Date(transaction.date);
    if (transactionDate >= startDate && transactionDate <= endDate) {
      impact += transaction.type === 'income' ? transaction.amount : -transaction.amount;
    }
  });

  return impact;
};

// Generate simulation data for charting
export interface SimulationDataPoint {
  month: string;
  balance: number;
  withExpense: number;
  investments: number;
}

export const generateSimulationData = (
  currentBalance: number,
  expenseAmount: number,
  isRecurring: boolean,
  recurringType: 'monthly' | 'weekly',
  months: number,
  futureTransactions: FutureTransaction[],
  totalInvestments: number,
  getProjectedInvestmentReturn: (months: number) => number,
  simulatedExpense: boolean = true
): SimulationDataPoint[] => {
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyPayment = expenseAmount / months;
  
  // Create an array to hold our data points
  const simulationData: SimulationDataPoint[] = [];
  
  return Array.from({ length: 6 }, (_, i) => {
    const monthIndex = (currentMonth + i) % 12;
    const monthYear = currentYear + Math.floor((currentMonth + i) / 12);
    const monthDate = new Date(monthYear, monthIndex, 1);
    const nextMonthDate = new Date(monthYear, monthIndex + 1, 0); // Last day of month
    
    // Calculate impact of existing future transactions for this month
    const futureTransactionsImpact = calculateMonthlyBalanceImpact(
      futureTransactions, 
      monthDate, 
      nextMonthDate
    );
    
    // Calculate impact of the simulated expense for this month
    let simulatedExpenseImpact = 0;
    
    if (simulatedExpense) {
      // For installments
      if (!isRecurring && i < months) {
        simulatedExpenseImpact = -monthlyPayment;
      }
      // For recurring expenses
      else if (isRecurring) {
        if (recurringType === 'monthly') {
          simulatedExpenseImpact = -expenseAmount;
        } else if (recurringType === 'weekly') {
          // Roughly 4 weeks per month
          simulatedExpenseImpact = -expenseAmount * 4;
        }
      }
    }
    
    // Calculate investment returns for this period
    const investmentReturn = i === 0 ? 0 : getProjectedInvestmentReturn(i);
    
    // Calculate balances
    const baseBalance = i === 0 ? 
      currentBalance : 
      simulationData[i-1].balance + futureTransactionsImpact + investmentReturn;
    
    const withExpenseBalance = i === 0 ? 
      currentBalance + simulatedExpenseImpact : 
      simulationData[i-1].withExpense + futureTransactionsImpact + simulatedExpenseImpact + investmentReturn;
    
    const dataPoint = {
      month: `${monthNames[monthIndex]}/${monthYear.toString().slice(2)}`,
      balance: baseBalance,
      withExpense: withExpenseBalance,
      investments: totalInvestments + investmentReturn
    };
    
    simulationData.push(dataPoint);
    return dataPoint;
  });
};
