
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { 
  formatPercentage as formatPercentageBR,
  getCurrentMonth as getMonthBR,
  getDateRange as getDateRangeBR
} from "@/context/finance/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { formatCurrencyValue } from "@/utils/currencyUtils"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Use the new formatter with default BRL
export const formatCurrency = (value: number) => formatCurrencyValue(value, 'BRL');
export const formatPercentage = formatPercentageBR;
export const getCurrentMonth = getMonthBR;
export const getDateRange = getDateRangeBR;

// Add the missing formatDate function
export function formatDate(date: Date, formatStr: string = 'dd/MM/yyyy'): string {
  return format(date, formatStr, { locale: ptBR });
}

// Add the formatCompactCurrency function
export function formatCompactCurrency(value: number): string {
  return formatCurrencyValue(value, 'BRL', { notation: 'compact' });
}
