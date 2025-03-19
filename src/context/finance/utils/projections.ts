
// Calculate projected value based on growth rate
export const calculateProjectedValue = (principal: number, rate: number, months: number): number => {
  // Convert percentage rate to decimal and to monthly rate
  const monthlyRate = rate / 100 / 12;
  return principal * Math.pow(1 + monthlyRate, months);
};

// Calculate compound interest growth over time with more accurate compounding
export const calculateCompoundInterest = (
  principal: number, 
  rate: number, 
  years: number, 
  compoundingFrequency: 'monthly' | 'quarterly' | 'annually' = 'monthly'
): number => {
  // Rate should be in percentage form (e.g., 5 for 5%)
  let periodsPerYear: number;
  switch (compoundingFrequency) {
    case 'monthly':
      periodsPerYear = 12;
      break;
    case 'quarterly':
      periodsPerYear = 4;
      break;
    case 'annually':
      periodsPerYear = 1;
      break;
  }
  
  const ratePerPeriod = rate / 100 / periodsPerYear;
  const totalPeriods = years * periodsPerYear;
  
  return principal * Math.pow(1 + ratePerPeriod, totalPeriods);
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
