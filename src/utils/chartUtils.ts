
import { IncomeCategory } from "@/context/finance/types";

// Color mapping for expense categories
export const categoryColors: Record<string, string> = {
  // Expense categories
  'food': '#FF6B6B',
  'transport': '#4ECDC4',
  'entertainment': '#FF9F1C',
  'bills': '#6A0572',
  'shopping': '#F72585',
  'electronics': '#7209B7',
  'appliances': '#3A0CA3',
  'furniture': '#4361EE',
  'clothing': '#4CC9F0',
  'other': '#9D4EDD',
  
  // Income categories
  'salary': '#2EC4B6',
  'food-allowance': '#8AC926',
  'transportation-allowance': '#FFCA3A',
  'investment-return': '#FFBE0B',
  'other-income': '#43AA8B',
};

// Get color for a specific category
export const getCategoryColor = (category: string): string => {
  return categoryColors[category] || '#9D4EDD'; // Default color if category not found
};

// Get an array of colors for a list of categories
export const getCategoryColors = (categories: string[]): string[] => {
  return categories.map(category => getCategoryColor(category));
};

// Format category name for display
export const formatCategoryName = (category: string): string => {
  switch (category) {
    case 'food':
      return 'Alimentação';
    case 'transport':
      return 'Transporte';
    case 'entertainment':
      return 'Entretenimento';
    case 'bills':
      return 'Contas';
    case 'shopping':
      return 'Compras';
    case 'electronics':
      return 'Eletrônicos';
    case 'appliances':
      return 'Eletrodomésticos';
    case 'furniture':
      return 'Móveis';
    case 'clothing':
      return 'Vestuário';
    case 'salary':
      return 'Salário';
    case 'food-allowance':
      return 'Vale Alimentação';
    case 'transportation-allowance':
      return 'Vale Transporte';
    case 'investment-return':
      return 'Retorno de Investimento';
    default:
      return 'Outros';
  }
};
