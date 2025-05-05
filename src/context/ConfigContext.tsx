
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
  projectionTimeUnit: 'days' | 'weeks' | 'months' | 'years';
  setProjectionTimeUnit: (unit: 'days' | 'weeks' | 'months' | 'years') => void;
  projectionTimeAmount: number;
  setProjectionTimeAmount: (amount: number) => void;
}

const defaultCompanyInfo: CompanyInfo = {
  name: 'Minha Empresa',
  contactEmail: 'contato@empresa.com',
  description: 'Gestão financeira inteligente'
};

const defaultConfig: ConfigContextType = {
  currency: 'BRL',
  setCurrency: () => {},
  companyInfo: defaultCompanyInfo,
  updateCompanyInfo: () => {},
  projectionTimeUnit: 'months',
  setProjectionTimeUnit: () => {},
  projectionTimeAmount: 12,
  setProjectionTimeAmount: () => {}
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
  const [projectionTimeUnit, setProjectionTimeUnit] = useState<'days' | 'weeks' | 'months' | 'years'>('months');
  const [projectionTimeAmount, setProjectionTimeAmount] = useState(12);

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

    const savedTimeUnit = localStorage.getItem('projectionTimeUnit');
    if (savedTimeUnit) {
      setProjectionTimeUnit(savedTimeUnit as 'days' | 'weeks' | 'months' | 'years');
    }

    const savedTimeAmount = localStorage.getItem('projectionTimeAmount');
    if (savedTimeAmount) {
      setProjectionTimeAmount(parseInt(savedTimeAmount));
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('appCurrency', currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem('companyInfo', JSON.stringify(companyInfo));
  }, [companyInfo]);

  useEffect(() => {
    localStorage.setItem('projectionTimeUnit', projectionTimeUnit);
  }, [projectionTimeUnit]);

  useEffect(() => {
    localStorage.setItem('projectionTimeAmount', projectionTimeAmount.toString());
  }, [projectionTimeAmount]);

  const updateCompanyInfo = (info: Partial<CompanyInfo>) => {
    setCompanyInfo(prev => ({ ...prev, ...info }));
  };

  return (
    <ConfigContext.Provider
      value={{
        currency,
        setCurrency,
        companyInfo,
        updateCompanyInfo,
        projectionTimeUnit,
        setProjectionTimeUnit,
        projectionTimeAmount,
        setProjectionTimeAmount
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
};
