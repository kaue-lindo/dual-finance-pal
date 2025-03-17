
import { IncomeCategory } from './types';

export type User = {
  id: string;
  name: string;
  profileImage?: string;
};

// Income categories mapping
export const incomeCategories = [
  { value: 'salary' as IncomeCategory, label: 'Salário' },
  { value: 'food-allowance' as IncomeCategory, label: 'Vale Alimentação' },
  { value: 'transportation-allowance' as IncomeCategory, label: 'Vale Transporte' },
  { value: 'other' as IncomeCategory, label: 'Outros' },
];

// Expense categories that should be allocated from specific income sources
export const categoryAllocationMap: Record<string, IncomeCategory> = {
  'food': 'food-allowance',
  'transport': 'transportation-allowance',
  // All others will default to 'salary' or 'other'
};

// Predefined users
export const predefinedUsers: User[] = [
  {
    id: 'user1',
    name: 'Usuário 1',
    profileImage: '/profile1.jpg',
  },
  {
    id: 'user2',
    name: 'Usuário 2',
    profileImage: '/profile2.jpg',
  },
];

// Default finances for users
export const defaultFinances: Record<string, any> = {
  user1: {
    incomes: [],
    expenses: [],
    investments: [],
    balance: 0,
  },
  user2: {
    incomes: [],
    expenses: [],
    investments: [],
    balance: 0,
  },
};
