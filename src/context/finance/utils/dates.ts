
/**
 * Get the current month name in Portuguese
 */
export function getCurrentMonth(): string {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  
  const date = new Date();
  return months[date.getMonth()];
}

/**
 * Get start and end date for a date range spanning the given number of months
 * @param months Number of months to include in the range (0 = current month only)
 */
export function getDateRange(months = 0): { start: Date, end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + months + 1, 0);
  
  return { start, end };
}

/**
 * Check if a date is within the current month
 */
export function isCurrentMonth(date: Date): boolean {
  const now = new Date();
  return date.getMonth() === now.getMonth() && 
         date.getFullYear() === now.getFullYear();
}

/**
 * Get an array of dates for all days in a month
 */
export function getDaysInMonth(year: number, month: number): Date[] {
  const days = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }
  
  return days;
}
