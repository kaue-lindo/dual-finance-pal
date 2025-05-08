
// Function to calculate investment return for a specific month
export const calculateInvestmentReturnForMonth = (investments: any[], month: number): number => {
  return investments.reduce((total, investment) => {
    const investmentStartDate = new Date(investment.startDate);
    const today = new Date();
    
    // Calculate months since investment start
    const monthsSinceStart = 
      (today.getFullYear() - investmentStartDate.getFullYear()) * 12 + 
      (today.getMonth() - investmentStartDate.getMonth());
    
    // Only include investments that have already started
    if (monthsSinceStart < 0) {
      return total;
    }
    
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
  
  // Get current date and investment start date
  const today = new Date();
  const startDate = new Date(investment.startDate);
  
  // Check if investment has already started
  if (startDate > today) {
    return 0; // Investment hasn't started yet, no returns
  }
  
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

// Helper function to convert between time units (normalized to months)
export const convertToMonths = (amount: number, unit: string): number => {
  switch (unit) {
    case 'days':
      return amount / 30;
    case 'weeks':
      return amount / 4;
    case 'months':
      return amount;
    case 'years':
      return amount * 12;
    default:
      return amount;
  }
};

// Helper function to convert from months to any time unit
export const convertFromMonths = (months: number, targetUnit: string): number => {
  switch (targetUnit) {
    case 'days':
      return months * 30;
    case 'weeks':
      return months * 4;
    case 'months':
      return months;
    case 'years':
      return months / 12;
    default:
      return months;
  }
};
