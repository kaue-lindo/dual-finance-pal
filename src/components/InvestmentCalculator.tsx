import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency, formatPercentage } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/use-toast';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { calculateCompoundInterest, calculateSimpleInterest } from '@/context/finance/utils/projections';

const InvestmentCalculator = () => {
  const { currentUser, addInvestment, calculateBalance } = useFinance();
  const { toast: uiToast } = useToast();

  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState('');
  const [period, setPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [description, setDescription] = useState('');
  const [result, setResult] = useState<number | null>(null);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [monthlyReturn, setMonthlyReturn] = useState<number | null>(null);
  const [annualReturn, setAnnualReturn] = useState<number | null>(null);
  const [insufficientBalance, setInsufficientBalance] = useState(false);
  const [isCompound, setIsCompound] = useState(true);

  useEffect(() => {
    if (currentUser) {
      setAvailableBalance(calculateBalance());
    }
  }, [currentUser, calculateBalance]);

  useEffect(() => {
    // Check if amount is greater than available balance
    if (amount && parseFloat(amount) > availableBalance) {
      setInsufficientBalance(true);
    } else {
      setInsufficientBalance(false);
    }
  }, [amount, availableBalance]);

  const calculateInvestment = () => {
    if (!amount || !rate) {
      toast.error('Por favor, preencha o valor e a taxa');
      return;
    }

    const principal = parseFloat(amount);
    const interestRate = parseFloat(rate);
    
    if (isNaN(principal) || isNaN(interestRate)) {
      toast.error('Por favor, insira valores numéricos válidos');
      return;
    }
    
    if (interestRate <= 0) {
      toast.error('A taxa de rendimento deve ser maior que zero');
      return;
    }
    
    // Limitar a taxa para evitar valores irreais
    const safeRate = Math.min(interestRate, period === 'monthly' ? 10 : 30);
    
    // Calculate monthly return (this is the same for both simple and compound)
    const effectiveMonthlyRate = period === 'monthly' ? safeRate / 100 : (safeRate / 12) / 100;
    const monthlyReturnValue = principal * effectiveMonthlyRate;
    setMonthlyReturn(monthlyReturnValue);
    
    // Calculate 1-year return based on interest type
    let oneYearReturn: number;
    
    if (isCompound) {
      // Calculate with compound interest
      oneYearReturn = calculateCompoundInterest(
        principal, 
        period === 'monthly' ? safeRate * 12 : safeRate, 
        1, 
        period
      );
    } else {
      // Calculate with simple interest
      oneYearReturn = calculateSimpleInterest(
        principal,
        period === 'monthly' ? safeRate * 12 : safeRate,
        1,
        period
      );
    }
    
    setAnnualReturn(oneYearReturn - principal);
    setResult(oneYearReturn);
  };

  const saveInvestment = () => {
    if (!currentUser || !amount || !rate || !description) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    if (insufficientBalance) {
      toast.error('Saldo insuficiente para realizar este investimento');
      return;
    }
    
    const amountValue = parseFloat(amount);
    const rateValue = parseFloat(rate);
    
    if (isNaN(amountValue) || isNaN(rateValue)) {
      toast.error('Por favor, insira valores numéricos válidos');
      return;
    }
    
    if (rateValue <= 0) {
      toast.error('A taxa de rendimento deve ser maior que zero');
      return;
    }
    
    // Limitar a taxa para evitar valores irreais
    const safeRate = Math.min(rateValue, period === 'monthly' ? 10 : 30);

    addInvestment({
      description,
      amount: amountValue,
      rate: safeRate,
      period,
      startDate: new Date(),
      isCompound
    });

    // Reset form
    setDescription('');
    setAmount('');
    setRate('');
    setPeriod('monthly');
    setResult(null);
    setMonthlyReturn(null);
    setAnnualReturn(null);
    
    // Update available balance after investment
    setAvailableBalance(calculateBalance() - amountValue);
  };

  return (
    <Card className="finance-card mt-4">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">Calcular Investimento</h2>
          <div className="text-sm text-finance-blue">
            Saldo disponível: {formatCurrency(availableBalance)}
          </div>
        </div>

        <div>
          <Label htmlFor="investmentDescription" className="text-white">Descrição</Label>
          <Input 
            id="investmentDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Tesouro Direto"
            className="finance-input mt-1"
          />
        </div>

        <div>
          <Label htmlFor="investmentAmount" className="text-white">Valor Investido</Label>
          <div className="relative mt-1">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">R$</span>
            <Input
              id="investmentAmount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className={`finance-input pl-10 ${insufficientBalance ? 'border-red-500' : ''}`}
            />
          </div>
          {insufficientBalance && (
            <p className="text-xs text-red-500 mt-1">Saldo insuficiente para este investimento</p>
          )}
        </div>

        <div>
          <Label htmlFor="investmentRate" className="text-white">
            Taxa de Rendimento ({period === 'monthly' ? 'Mensal' : 'Anual'})
          </Label>
          <div className="relative mt-1">
            <Input
              id="investmentRate"
              type="number"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="0,00"
              className="finance-input"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">%</span>
          </div>
        </div>

        <div>
          <Label className="text-white">Período da Taxa</Label>
          <RadioGroup 
            value={period} 
            onValueChange={(value) => setPeriod(value as 'monthly' | 'annual')}
            className="flex justify-between mt-1"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem 
                value="monthly" 
                id="monthly" 
                className="text-finance-blue border-finance-blue"
              />
              <Label htmlFor="monthly" className="text-white">Mensal</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem 
                value="annual" 
                id="annual" 
                className="text-finance-blue border-finance-blue"
              />
              <Label htmlFor="annual" className="text-white">Anual</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="flex items-center space-x-2 mt-4">
          <Switch 
            id="isCompound"
            checked={isCompound}
            onCheckedChange={setIsCompound}
          />
          <Label htmlFor="isCompound" className="text-white">
            Juros Compostos
            <span className="block text-xs text-gray-400">
              {isCompound ? 'Os rendimentos são reinvestidos mensalmente' : 'Apenas o valor principal gera rendimentos'}
            </span>
          </Label>
        </div>

        <Button 
          onClick={calculateInvestment}
          className="w-full finance-btn"
        >
          Calcular Rendimento
        </Button>

        {result !== null && (
          <div className="mt-4 p-4 bg-finance-dark-lighter rounded-lg">
            <h3 className="text-white font-medium mb-2">Resultado Projetado ({isCompound ? 'Juros Compostos' : 'Juros Simples'})</h3>
            <div className="flex justify-between">
              <span className="text-gray-400">Valor Investido:</span>
              <span className="text-white font-bold">{formatCurrency(parseFloat(amount))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Retorno Mensal:</span>
              <span className="text-green-500 font-bold">
                {formatCurrency(monthlyReturn || 0)} ({formatPercentage((monthlyReturn || 0) / parseFloat(amount) * 100)})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Retorno em 12 meses:</span>
              <span className="text-green-500 font-bold">
                {formatCurrency(annualReturn || 0)} ({formatPercentage((annualReturn || 0) / parseFloat(amount) * 100)})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Valor Final após 12 meses:</span>
              <span className="text-finance-blue font-bold">{formatCurrency(result)}</span>
            </div>
            <Button 
              onClick={saveInvestment}
              className="w-full finance-btn mt-4"
              disabled={insufficientBalance}
            >
              Salvar Investimento
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default InvestmentCalculator;
