import { Income, Expense, RecurringInfo, RecurringType, FutureTransaction } from '../types';
import { format, addMonths, getDaysInMonth } from 'date-fns';

// Helper function to process recurring income
export const processRecurringIncomes = (
  income: Income, 
  futureTransactions: FutureTransaction[], 
  today: Date, 
  monthsToLookAhead: number
) => {
  if (!income.recurring) return;
  
  const incomeDate = new Date(income.date);
  const nextMonths = [];
  
  for (let i = 1; i <= monthsToLookAhead; i++) {
    nextMonths.push(new Date(today.getFullYear(), today.getMonth() + i, 1));
  }
  
  // Process based on recurring type
  if (typeof income.recurring === 'boolean' && income.recurring === true) {
    // Default to monthly if just boolean true
    processMonthlyRecurringIncome(income, futureTransactions, nextMonths, incomeDate);
  } else if (typeof income.recurring === 'object') {
    const recurringInfo = income.recurring as RecurringInfo;
    switch(recurringInfo.type) {
      case 'monthly':
        processMonthlyRecurringIncome(income, futureTransactions, nextMonths, incomeDate, recurringInfo.days);
        break;
      case 'weekly':
        processWeeklyRecurringIncome(income, futureTransactions, nextMonths);
        break;
      case 'daily':
        processDailyRecurringIncome(income, futureTransactions, nextMonths);
        break;
      default:
        processMonthlyRecurringIncome(income, futureTransactions, nextMonths, incomeDate);
    }
  }
};

// Helper for monthly recurring incomes
const processMonthlyRecurringIncome = (
  income: Income,
  futureTransactions: FutureTransaction[],
  nextMonths: Date[],
  incomeDate: Date,
  specificDays?: number[]
) => {
  const days = specificDays && specificDays.length > 0 
    ? specificDays 
    : [incomeDate.getDate()];
  
  nextMonths.forEach(month => {
    days.forEach(day => {
      // Handle case when day is larger than days in month
      const daysInMonth = getDaysInMonth(new Date(month.getFullYear(), month.getMonth()));
      const adjustedDay = Math.min(day, daysInMonth);
      
      const futureDate = new Date(month.getFullYear(), month.getMonth(), adjustedDay);
      
      futureTransactions.push({
        id: `${income.id}-recurring-${month.getMonth()}-${day}`,
        date: futureDate,
        description: `${income.description} (Mensal)`,
        amount: income.amount,
        type: 'income',
        category: income.category
      });
    });
  });
};

// Helper for weekly recurring incomes
const processWeeklyRecurringIncome = (
  income: Income,
  futureTransactions: FutureTransaction[],
  nextMonths: Date[]
) => {
  nextMonths.forEach(month => {
    for (let week = 0; week < 4; week++) {
      const futureDate = new Date(month.getFullYear(), month.getMonth(), 1 + (week * 7));
      
      futureTransactions.push({
        id: `${income.id}-recurring-weekly-${month.getMonth()}-${week}`,
        date: futureDate,
        description: `${income.description} (Semanal)`,
        amount: income.amount,
        type: 'income',
        category: income.category
      });
    }
  });
};

// Helper for daily recurring incomes
const processDailyRecurringIncome = (
  income: Income,
  futureTransactions: FutureTransaction[],
  nextMonths: Date[]
) => {
  nextMonths.forEach(month => {
    const daysInMonth = getDaysInMonth(new Date(month.getFullYear(), month.getMonth()));
    
    for (let day = 1; day <= daysInMonth; day++) {
      const futureDate = new Date(month.getFullYear(), month.getMonth(), day);
      
      futureTransactions.push({
        id: `${income.id}-recurring-daily-${month.getMonth()}-${day}`,
        date: futureDate,
        description: `${income.description} (Diário)`,
        amount: income.amount,
        type: 'income',
        category: income.category
      });
    }
  });
};

// Helper function to process recurring expenses
export const processRecurringExpenses = (
  expense: Expense, 
  futureTransactions: FutureTransaction[], 
  today: Date, 
  monthsToLookAhead: number
) => {
  if (!expense.recurring) return;
  
  const nextMonths = [];
  for (let i = 0; i <= monthsToLookAhead; i++) {
    nextMonths.push(new Date(today.getFullYear(), today.getMonth() + i, 1));
  }
  
  nextMonths.forEach(month => {
    if (expense.recurring?.type === 'monthly' && expense.recurring.days && expense.recurring.days.length > 0) {
      expense.recurring.days.forEach(day => {
        const futureDate = new Date(month.getFullYear(), month.getMonth(), day);
        
        // Só adiciona transações futuras ou a partir do primeiro dia do mês atual
        if (futureDate >= new Date(today.getFullYear(), today.getMonth(), 1)) {
          futureTransactions.push({
            id: `${expense.id}-recurring-${month.getMonth()}-${day}`,
            date: futureDate,
            description: `${expense.description} (Mensal)`,
            amount: expense.amount,
            type: 'expense',
            category: expense.category,
            sourceCategory: expense.sourceCategory
          });
        }
      });
    } else if (expense.recurring?.type === 'weekly') {
      for (let week = 0; week < 4; week++) {
        const futureDate = new Date(month.getFullYear(), month.getMonth(), 1 + (week * 7));
        
        if (futureDate >= new Date(today.getFullYear(), today.getMonth(), 1)) {
          futureTransactions.push({
            id: `${expense.id}-recurring-weekly-${month.getMonth()}-${week}`,
            date: futureDate,
            description: `${expense.description} (Semanal)`,
            amount: expense.amount,
            type: 'expense',
            category: expense.category,
            sourceCategory: expense.sourceCategory
          });
        }
      }
    } else if (expense.recurring?.type === 'daily') {
      // Para despesas diárias, gera uma transação para cada dia do mês
      const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
      
      for (let day = 1; day <= daysInMonth; day++) {
        const futureDate = new Date(month.getFullYear(), month.getMonth(), day);
        
        if (futureDate >= new Date(today.getFullYear(), today.getMonth(), 1)) {
          futureTransactions.push({
            id: `${expense.id}-recurring-daily-${month.getMonth()}-${day}`,
            date: futureDate,
            description: `${expense.description} (Diário)`,
            amount: expense.amount,
            type: 'expense',
            category: expense.category,
            sourceCategory: expense.sourceCategory
          });
        }
      }
    }
  });
};

// Helper function to process installments for expenses
export const processInstallments = (
  expense: Expense, 
  futureTransactions: FutureTransaction[]
) => {
  if (!expense.installment || expense.installment.remaining <= 0) return;
  
  const installmentAmount = expense.amount;
  const expenseDate = new Date(expense.date);
  
  for (let i = 1; i <= expense.installment.remaining; i++) {
    const futureDate = new Date(expenseDate);
    futureDate.setMonth(futureDate.getMonth() + i);
    
    futureTransactions.push({
      id: `${expense.id}-installment-${i}`,
      date: futureDate,
      description: `${expense.description} (${expense.installment.current + i}/${expense.installment.total})`,
      amount: installmentAmount,
      type: 'expense',
      category: expense.category,
      sourceCategory: expense.sourceCategory
    });
  }
};
