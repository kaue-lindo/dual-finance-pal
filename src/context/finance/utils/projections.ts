
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

// Calculate simple interest (no compounding)
export const calculateSimpleInterest = (
  principal: number,
  rate: number,
  years: number,
  period: 'monthly' | 'annual' = 'annual'
): number => {
  // Convert rate to decimal
  const decimalRate = rate / 100;
  // Adjust rate based on period
  const effectiveRate = period === 'monthly' ? decimalRate / 12 * 12 * years : decimalRate * years;
  // Calculate total with simple interest
  return principal * (1 + effectiveRate);
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
  isPeriodMonthly: boolean,
  month: number,
  isCompound: boolean = true
): number => {
  if (month === 0) return 0;
  
  const monthlyRate = isPeriodMonthly ? rate / 100 : (rate / 12) / 100;
  
  if (isCompound) {
    // Compound interest - calculate the total value after the given months
    const futureValue = principal * Math.pow(1 + monthlyRate, month);
    return futureValue - principal;
  } else {
    // Simple interest
    return principal * monthlyRate * month;
  }
};

// Calculate the future value of investments for chart display
export const calculateInvestmentReturnForMonth = (
  investments: any[],
  monthIndex: number
): number => {
  if (!investments || investments.length === 0) return 0;
  
  return investments.reduce((total, investment) => {
    const isPeriodMonthly = investment.period === 'monthly';
    const isCompound = investment.isCompound !== false;
    
    // For the first month, no return yet
    if (monthIndex === 0) return total;
    
    // Calculate previous month's total value (principal + growth)
    const prevMonthGrowth = calculateInvestmentGrowthForMonth(
      investment.amount, 
      investment.rate, 
      isPeriodMonthly, 
      monthIndex - 1, 
      isCompound
    );
    
    // Calculate current month's total value
    const currentMonthGrowth = calculateInvestmentGrowthForMonth(
      investment.amount, 
      investment.rate, 
      isPeriodMonthly, 
      monthIndex, 
      isCompound
    );
    
    // The monthly return is the difference between current and previous month's growth
    const monthlyReturn = currentMonthGrowth - prevMonthGrowth;
    
    return total + monthlyReturn;
  }, 0);
};
