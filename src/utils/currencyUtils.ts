
import { ptBR, enUS } from 'date-fns/locale';

export type CurrencyType = 'BRL' | 'USD' | 'EUR';

export const currencySymbols: Record<CurrencyType, string> = {
  BRL: 'R$',
  USD: '$',
  EUR: '€'
};

export const formatCurrencyValue = (
  value: number,
  currency: CurrencyType = 'BRL',
  options: Intl.NumberFormatOptions = {}
): string => {
  const locales: Record<CurrencyType, string> = {
    BRL: 'pt-BR',
    USD: 'en-US',
    EUR: 'de-DE'
  };

  const defaultOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options
  };

  return new Intl.NumberFormat(locales[currency], defaultOptions).format(value);
};

export const getCurrencyLocale = (currency: CurrencyType) => {
  switch (currency) {
    case 'BRL':
      return ptBR;
    case 'USD':
    case 'EUR':
    default:
      return enUS;
  }
};
