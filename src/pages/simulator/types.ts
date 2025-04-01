
import { IncomeCategory } from "@/context/finance/types";

export interface SimulationData {
  description: string;
  amount: string;
  category: string;
  installments: string;
  customInstallments: string;
  isRecurring: boolean;
  recurringType: 'monthly' | 'weekly';
  date: Date | undefined;
  useInvestments: boolean;
}

export interface SimulationResults {
  currentBalance: number;
  afterExpense: number;
  monthlyData: SimulationDataPoint[];
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyPayment: number;
  monthlyDeficit: number;
  totalExpense: number;
}

export interface SimulationDataPoint {
  month: string;
  balance: number;
  withExpense: number;
  investments: number;
}

export interface CategoryData {
  name: string;
  value: number;
  color: string;
}

export interface FinancialSummary {
  currentBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  totalInvestments: number;
}
