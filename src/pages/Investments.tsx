
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, TrendingUp } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/utils';
import InvestmentCalculator from '@/components/InvestmentCalculator';
import BottomNav from '@/components/ui/bottom-nav';

const Investments = () => {
  const { currentUser, finances, deleteInvestment } = useFinance();
  const navigate = useNavigate();

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  const userFinances = finances[currentUser.id];
  const investments = userFinances.investments || [];

  const totalInvested = investments.reduce((sum, investment) => sum + investment.amount, 0);

  const calculateProjectedReturn = (investment: {
    amount: number;
    rate: number;
    period: 'monthly' | 'annual';
    isCompound?: boolean;
  }) => {
    const { amount, rate, period, isCompound } = investment;
    
    if (isCompound !== false) {
      const annualRate = period === 'monthly' ? (1 + rate / 100) ** 12 - 1 : rate / 100;
      return amount * (1 + annualRate);
    } else {
      const annualRate = period === 'monthly' ? rate * 12 / 100 : rate / 100;
      return amount * (1 + annualRate);
    }
  };

  const totalProjected = investments.reduce(
    (sum, investment) => sum + calculateProjectedReturn(investment),
    0
  );

  return (
    <div className="min-h-screen bg-finance-dark pb-20">
      <div className="finance-card rounded-b-xl">
        <div className="flex justify-between items-center mb-4">
          <Button variant="ghost" size="icon" className="navbar-icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={24} className="text-white" />
          </Button>
          <h1 className="text-xl font-bold text-white">Investimentos</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="mt-6 px-4">
        <Card className="finance-card">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-finance-blue flex items-center justify-center">
                <TrendingUp size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Total Investido</h2>
                <p className="text-gray-400">Rendimento anual projetado</p>
              </div>
            </div>

            <div className="flex justify-between items-end">
              <div>
                <p className="text-3xl font-bold text-white">{formatCurrency(totalInvested)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Projeção Anual</p>
                <p className="text-lg font-bold text-green-500">
                  +{formatCurrency(totalProjected - totalInvested)}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <InvestmentCalculator />

        {investments.length > 0 ? (
          <div className="mt-6">
            <h2 className="text-lg font-bold text-white px-1 mb-3">Seus Investimentos</h2>
            {investments.map((investment) => (
              <Card key={investment.id} className="finance-card mb-3">
                <div className="flex justify-between">
                  <div className="max-w-[60%]">
                    <h3 className="text-white font-medium truncate">{investment.description}</h3>
                    <p className="text-gray-400 text-sm truncate">
                      {investment.period === 'monthly' ? 'Mensal' : 'Anual'} • {investment.rate}% • 
                      {investment.isCompound !== false ? ' Juros Compostos' : ' Juros Simples'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">{formatCurrency(investment.amount)}</p>
                    <p className="text-green-500 text-sm">
                      +{formatCurrency(calculateProjectedReturn(investment) - investment.amount)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                  onClick={() => deleteInvestment(investment.id)}
                >
                  Remover
                </Button>
              </Card>
            ))}
          </div>
        ) : (
          <div className="mt-10 text-center">
            <p className="text-gray-400">Você ainda não tem investimentos</p>
          </div>
        )}
      </div>
      
      <BottomNav />
    </div>
  );
};

export default Investments;
