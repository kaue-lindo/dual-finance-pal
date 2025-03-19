
// Calculate projected value based on growth rate
export const calculateProjectedValue = (principal: number, rate: number, months: number): number => {
  // Convert annual rate to monthly
  const monthlyRate = rate / 12 / 100;
  return principal * Math.pow(1 + monthlyRate, months);
};

// Calculate compound interest growth over time
export const calculateCompoundInterest = (
  principal: number, 
  rate: number, 
  years: number, 
  compoundingFrequency: 'monthly' | 'quarterly' | 'annually' = 'monthly'
): number => {
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
