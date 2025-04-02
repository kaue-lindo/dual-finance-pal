
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { 
  formatCurrency as formatCurrencyBR, 
  formatPercentage as formatPercentageBR,
  getCurrentMonth as getMonthBR,
  getDateRange as getDateRangeBR
} from "@/context/finance/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatCurrency = formatCurrencyBR;
export const formatPercentage = formatPercentageBR;
export const getCurrentMonth = getMonthBR;
export const getDateRange = getDateRangeBR;

// Add the missing formatDate function
export function formatDate(date: Date, formatStr: string = 'dd/MM/yyyy'): string {
  return format(date, formatStr, { locale: ptBR });
}

// Add the formatCompactCurrency function
export function formatCompactCurrency(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  } else {
    return formatCurrency(value);
  }
}
