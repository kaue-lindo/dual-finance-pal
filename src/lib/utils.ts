
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { 
  formatCurrency as formatCurrencyBR, 
  formatPercentage as formatPercentageBR,
  getCurrentMonth as getMonthBR,
  getDateRange as getDateRangeBR
} from "@/context/finance/utils"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatCurrency = formatCurrencyBR;
export const formatPercentage = formatPercentageBR;
export const getCurrentMonth = getMonthBR;
export const getDateRange = getDateRangeBR;
