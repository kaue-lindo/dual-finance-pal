
import React, { createContext, useContext, useState, useEffect } from 'react';
import { CurrencyType } from '@/utils/currencyUtils';
import { supabase } from '@/integrations/supabase/client';

interface CompanyInfo {
  name: string;
  contactEmail: string;
  description: string;
}

interface ConfigContextType {
  currency: CurrencyType;
  setCurrency: (currency: CurrencyType) => void;
  companyInfo: CompanyInfo;
  updateCompanyInfo: (info: Partial<CompanyInfo>) => void;
}

const defaultCompanyInfo: CompanyInfo = {
  name: 'Dual Finance',
  contactEmail: 'contato@dualfinance.com',
  description: 'Gestão financeira inteligente para seus investimentos e finanças pessoais. Nossa plataforma ajuda você a manter o controle sobre sua vida financeira com ferramentas avançadas e fáceis de usar.'
};

const defaultConfig: ConfigContextType = {
  currency: 'BRL',
  setCurrency: () => {},
  companyInfo: defaultCompanyInfo,
  updateCompanyInfo: () => {}
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
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(defaultCompanyInfo);

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedCurrency = localStorage.getItem('appCurrency');
    if (savedCurrency) {
      setCurrency(savedCurrency as CurrencyType);
    }

    const savedCompanyInfo = localStorage.getItem('companyInfo');
    if (savedCompanyInfo) {
      setCompanyInfo(JSON.parse(savedCompanyInfo));
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('appCurrency', currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem('companyInfo', JSON.stringify(companyInfo));
  }, [companyInfo]);

  const updateCompanyInfo = (info: Partial<CompanyInfo>) => {
    setCompanyInfo(prev => ({ ...prev, ...info }));
  };

  return (
    <ConfigContext.Provider
      value={{
        currency,
        setCurrency,
        companyInfo,
        updateCompanyInfo
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
};
