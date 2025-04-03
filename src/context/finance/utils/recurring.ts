
import { Expense, Income, FutureTransaction, RecurringType, RecurringInfo } from '../types';
import { addMonths, addDays, format } from 'date-fns';

// Process recurring expenses and generate future expense transactions
export const processRecurringExpenses = (
  expense: Expense,
  futureTransactions: FutureTransaction[],
  today: Date,
  monthsToLookAhead: number
): void => {
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

// Process recurring incomes and generate future income transactions
export const processRecurringIncomes = (
  income: Income,
  futureTransactions: FutureTransaction[],
  today: Date,
  monthsToLookAhead: number,
  incomeDate: Date
): void => {
  if (!income.recurring) return;
  
  const nextMonths = [];
  for (let i = 1; i <= monthsToLookAhead; i++) {
    nextMonths.push(new Date(today.getFullYear(), today.getMonth() + i, 1));
  }
  
  nextMonths.forEach(month => {
    const recurringDays = (typeof income.recurring === 'object' && income.recurring.days && income.recurring.days.length > 0) ? 
      income.recurring.days : [incomeDate.getDate()];
    
    const recurringType = (typeof income.recurring === 'object' && income.recurring.type) ? 
      income.recurring.type : 'monthly';
    
    let recurringLabel = "Mensal";
    if (recurringType === 'daily') recurringLabel = "Diário";
    if (recurringType === 'weekly') recurringLabel = "Semanal";
    
    if (recurringType === 'monthly') {
      recurringDays.forEach(day => {
        const futureDate = new Date(month.getFullYear(), month.getMonth(), day);
        
        // Ensure description contains the recurring label
        const descriptionWithLabel = income.description.includes(recurringLabel) ? 
          income.description : 
          `${income.description} (${recurringLabel})`;
        
        futureTransactions.push({
          id: `${income.id}-recurring-${month.getMonth()}-${day}`,
          date: futureDate,
          description: descriptionWithLabel,
          amount: income.amount,
          type: 'income',
          category: income.category
        });
      });
    } else if (recurringType === 'weekly') {
      for (let week = 0; week < 4; week++) {
        const futureDate = new Date(month.getFullYear(), month.getMonth(), 1 + (week * 7));
        
        // Ensure description contains the recurring label
        const descriptionWithLabel = income.description.includes(recurringLabel) ? 
          income.description : 
          `${income.description} (${recurringLabel})`;
        
        futureTransactions.push({
          id: `${income.id}-recurring-weekly-${month.getMonth()}-${week}`,
          date: futureDate,
          description: descriptionWithLabel,
          amount: income.amount,
          type: 'income',
          category: income.category
        });
      }
    } else if (recurringType === 'daily') {
      const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
      
      for (let day = 1; day <= daysInMonth; day++) {
        const futureDate = new Date(month.getFullYear(), month.getMonth(), day);
        
        // Ensure description contains the recurring label
        const descriptionWithLabel = income.description.includes(recurringLabel) ? 
          income.description : 
          `${income.description} (${recurringLabel})`;
        
        futureTransactions.push({
          id: `${income.id}-recurring-daily-${month.getMonth()}-${day}`,
          date: futureDate,
          description: descriptionWithLabel,
          amount: income.amount,
          type: 'income',
          category: income.category
        });
      }
    } else {
      // Se não tiver tipo específico, usa a data base
      const futureDate = new Date(month.getFullYear(), month.getMonth(), incomeDate.getDate());
      
      // Ensure description contains the recurring label
      const descriptionWithLabel = income.description.includes(recurringLabel) ? 
        income.description : 
        `${income.description} (${recurringLabel})`;
      
      futureTransactions.push({
        id: `${income.id}-recurring-${month.getMonth()}`,
        date: futureDate,
        description: descriptionWithLabel,
        amount: income.amount,
        type: 'income',
        category: income.category
      });
    }
  });
};

// Process installment expenses and generate future installment transactions
export const processInstallments = (
  expense: Expense,
  futureTransactions: FutureTransaction[]
): void => {
  if (!expense.installment) return;
  
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
