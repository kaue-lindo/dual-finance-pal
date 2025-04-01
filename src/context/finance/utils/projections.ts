// Calculate projected value based on growth rate
export const calculateProjectedValue = (principal: number, rate: number, months: number): number => {
  // Convert percentage rate to decimal and to monthly rate
  const monthlyRate = rate / 100 / 12;
  return principal * Math.pow(1 + monthlyRate, months);
};

// Calculate compound interest growth over time with more accurate compounding
export const calculateCompoundInterest = (
  principal: number,
  annualRate: number,
  years: number,
  period: 'monthly' | 'yearly' | 'annual' = 'yearly'
): number => {
  const isMonthly = period === 'monthly';
  const rate = isMonthly ? annualRate / 12 / 100 : annualRate / 100;
  const n = isMonthly ? 12 : 1;
  
  // Compound interest formula: A = P(1 + r/n)^(nt)
  const futureValue = principal * Math.pow(1 + rate, n * years);
  
  return futureValue;
};

// Calculate simple interest (no compounding)
export const calculateSimpleInterest = (
  principal: number,
  annualRate: number,
  years: number,
  period: 'monthly' | 'yearly' | 'annual' = 'yearly'
): number => {
  const isMonthly = period === 'monthly';
  const rate = isMonthly ? annualRate / 12 / 100 : annualRate / 100;
  const n = isMonthly ? 12 * years : years;
  
  // Simple interest formula: A = P(1 + rt)
  const futureValue = principal * (1 + rate * n);
  
  return futureValue;
};

// Get projected monthly returns for an investment
export const getMonthlyReturn = (
  principal: number,
  rate: number,
  isPeriodMonthly: boolean
): number => {
  // Convert to appropriate monthly rate
  const monthlyRate = isPeriodMonthly ? rate / 100 : (rate / 12) / 100;
  return principal * monthlyRate;
};

// Calculate investment growth for a specific month (for simulations)
export const calculateInvestmentGrowthForMonth = (
  principal: number,
  rate: number,
  isMonthlyRate: boolean,
  monthsElapsed: number,
  isCompound: boolean
): number => {
  if (monthsElapsed <= 0) return principal;
  
  // Converter a taxa para mensal se for anual
  const monthlyRate = isMonthlyRate ? rate / 100 : rate / 12 / 100;
  
  if (isCompound) {
    // Juros compostos: A = P(1 + r)^t
    return principal * Math.pow(1 + monthlyRate, monthsElapsed);
  } else {
    // Juros simples: A = P(1 + r*t)
    return principal * (1 + monthlyRate * monthsElapsed);
  }
};

// Calculate the future value of investments for chart display
export const calculateInvestmentReturnForMonth = (
  investments: any[],
  monthIndex: number
): number => {
  if (!investments || investments.length === 0) return 0;
  
  let totalMonthlyReturn = 0;
  
  investments.forEach(investment => {
    const isPeriodMonthly = investment.period === 'monthly';
    const isCompound = investment.isCompound !== false;
    const rate = investment.rate || 0;
    
    // Para taxas muito altas, limitar para evitar valores irreais
    const safeRate = Math.min(rate, isPeriodMonthly ? 10 : 30);
    
    // Calcular o rendimento mensal com base na taxa segura
    const monthlyRate = isPeriodMonthly ? safeRate / 100 : safeRate / 12 / 100;
    const monthlyReturn = investment.amount * monthlyRate;
    
    // Adicionar ao total
    totalMonthlyReturn += monthlyReturn;
  });
  
  // Arredondar para 2 casas decimais para evitar problemas de precisão
  return Math.round(totalMonthlyReturn * 100) / 100;
};
