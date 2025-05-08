
import React, { createContext, useContext, useState, useEffect } from 'react';
import { CurrencyType } from '@/utils/currencyUtils';

interface CompanyInfo {
  name: string;
  contactEmail: string;
  description: string;
  foundingYear: string;
  mission: string;
  website: string;
}

interface ConfigContextType {
  currency: CurrencyType;
  setCurrency: (currency: CurrencyType) => void;
  companyInfo: CompanyInfo;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

const defaultCompanyInfo: CompanyInfo = {
  name: 'Dual Finance',
  contactEmail: 'contato@dualfinance.com',
  description: 'Gestão financeira inteligente para seus investimentos e finanças pessoais. Nossa plataforma ajuda você a manter o controle sobre sua vida financeira com ferramentas avançadas e fáceis de usar.',
  foundingYear: '2024',
  mission: 'Fornecer ferramentas financeiras intuitivas e eficientes para ajudar os usuários a tomar decisões financeiras inteligentes.',
  website: 'www.dualfinance.com'
};

const defaultConfig: ConfigContextType = {
  currency: 'BRL',
  setCurrency: () => {},
  companyInfo: defaultCompanyInfo,
  theme: 'dark',
  setTheme: () => {}
};

const ConfigContext = createContext<ConfigContextType>(defaultConfig);

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<CurrencyType>('BRL');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  
  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedCurrency = localStorage.getItem('appCurrency');
    if (savedCurrency) {
      setCurrency(savedCurrency as CurrencyType);
    }
    
    const savedTheme = localStorage.getItem('appTheme');
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      setTheme(savedTheme);
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('appCurrency', currency);
  }, [currency]);
  
  useEffect(() => {
    localStorage.setItem('appTheme', theme);
  }, [theme]);

  return (
    <ConfigContext.Provider
      value={{
        currency,
        setCurrency,
        companyInfo: defaultCompanyInfo,
        theme,
        setTheme
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
};
