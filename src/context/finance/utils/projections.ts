
// Function to calculate investment return for a specific month
export const calculateInvestmentReturnForMonth = (investments: any[], month: number): number => {
  return investments.reduce((total, investment) => {
    const isPeriodMonthly = investment.period === 'monthly';
    const isCompound = investment.isCompound !== false;
    
    // Calculate future value
    const futureValue = calculateInvestmentGrowthForMonth(
      investment.amount,
      investment.rate,
      isPeriodMonthly,
      month,
      isCompound
    );
    
    // Return only the growth amount (not the principal)
    const returnAmount = futureValue - investment.amount;
    
    return total + returnAmount;
  }, 0);
};

// Function to calculate compound interest growth
export const calculateInvestmentGrowthForMonth = (
  principal: number,
  rate: number,
  isMonthly: boolean,
  months: number,
  isCompound: boolean
): number => {
  const actualRate = rate / 100; // Convert percentage to decimal
  
  // Adjust rate based on period (monthly or annual)
  const ratePerMonth = isMonthly ? actualRate : actualRate / 12;
  
  if (isCompound) {
    // Compound interest formula: A = P(1 + r)^t
    return principal * Math.pow(1 + ratePerMonth, months);
  } else {
    // Simple interest formula: A = P(1 + rt)
    return principal * (1 + ratePerMonth * months);
  }
};

// Calculate investment return for a specific investment over a specified period
export const calculateInvestmentReturn = (
  investment: any,
  months: number
): number => {
  const isPeriodMonthly = investment.period === 'monthly';
  const isCompound = investment.isCompound !== false;
  
  const futureValue = calculateInvestmentGrowthForMonth(
    investment.amount,
    investment.rate,
    isPeriodMonthly,
    months,
    isCompound
  );
  
  // Return only the growth (not the principal)
  return futureValue - investment.amount;
};
