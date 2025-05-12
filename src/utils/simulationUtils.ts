
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
      if (transaction.type === 'income') {
        impact += transaction.amount;
      } else if (transaction.type === 'expense') {
        impact -= transaction.amount;
      }
      // Investment transactions are handled separately
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
  simulatedExpense: boolean = true,
  simulationMonths: number = 6 // Default to 6 months but now configurable
): SimulationDataPoint[] => {
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyPayment = expenseAmount / months;
  
  // Create an array to hold our data points
  const simulationData: SimulationDataPoint[] = [];
  
  // Pre-filter transactions by type
  const incomeTransactions = futureTransactions.filter(t => t.type === 'income');
  const expenseTransactions = futureTransactions.filter(t => t.type === 'expense');
  const investmentTransactions = futureTransactions.filter(t => t.type === 'investment');
  const investmentReturnTransactions = incomeTransactions.filter(t => t.category === 'investment-return');
  const normalIncomeTransactions = incomeTransactions.filter(t => t.category !== 'investment-return');
  
  // Create the simulation data points for each month
  for (let i = 0; i < simulationMonths; i++) {
    const monthIndex = (currentMonth + i) % 12;
    const monthYear = currentYear + Math.floor((currentMonth + i) / 12);
    const monthDate = new Date(monthYear, monthIndex, 1);
    const nextMonthDate = new Date(monthYear, monthIndex + 1, 0); // Last day of month
    
    // Calculate income impact (excluding investment returns)
    const incomeImpact = calculateMonthlyBalanceImpact(
      normalIncomeTransactions, 
      monthDate, 
      nextMonthDate
    );
    
    // Calculate expense impact
    const expenseImpact = calculateMonthlyBalanceImpact(
      expenseTransactions, 
      monthDate, 
      nextMonthDate
    );
    
    // Calculate new investments for this month
    const newInvestmentsImpact = calculateMonthlyBalanceImpact(
      investmentTransactions,
      monthDate,
      nextMonthDate
    ) * -1; // Convert to positive for tracking purposes
    
    // Calculate investment returns for this month
    const investmentReturnsImpact = calculateMonthlyBalanceImpact(
      investmentReturnTransactions,
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
    
    // Calculate balances
    const netImpact = incomeImpact + expenseImpact + investmentReturnsImpact - newInvestmentsImpact;
    
    const baseBalance = i === 0 ? 
      currentBalance : 
      simulationData[i-1].balance + netImpact;
    
    const withExpenseBalance = i === 0 ? 
      currentBalance + simulatedExpenseImpact : 
      simulationData[i-1].withExpense + netImpact + simulatedExpenseImpact;
    
    // Accumulate investment returns for the investments metric
    const previousInvestments = i === 0 ? totalInvestments : simulationData[i-1].investments;
    const currentInvestments = previousInvestments + newInvestmentsImpact + investmentReturnsImpact;
    
    const dataPoint = {
      month: `${monthNames[monthIndex]}/${monthYear.toString().slice(2)}`,
      balance: baseBalance,
      withExpense: withExpenseBalance,
      investments: currentInvestments
    };
    
    simulationData.push(dataPoint);
  }
  
  return simulationData;
};
