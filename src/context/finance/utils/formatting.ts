
/**
 * Format a number as Brazilian currency (R$)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Format a number as a percentage
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}

/**
 * Format a date in Brazilian style (DD/MM/YYYY)
 */
export function formatDate(date: Date): string {
  return new Intl.NumberFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}
