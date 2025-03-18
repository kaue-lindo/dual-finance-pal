
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/use-toast';
import { toast } from 'sonner';

const InvestmentCalculator = () => {
  const { currentUser, addInvestment, calculateBalance } = useFinance();
  const { toast: uiToast } = useToast();

  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState('');
  const [period, setPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [description, setDescription] = useState('');
  const [result, setResult] = useState<number | null>(null);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [insufficientBalance, setInsufficientBalance] = useState(false);

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
      uiToast({
        title: 'Erro',
        description: 'Por favor, preencha o valor e a taxa',
        variant: 'destructive',
      });
      return;
    }

    const principal = parseFloat(amount);
    const interestRate = parseFloat(rate) / 100;
    let finalAmount = 0;

    if (period === 'monthly') {
      // Calculate for 12 months
      finalAmount = principal * Math.pow(1 + interestRate, 12);
    } else {
      // Annual rate already
      finalAmount = principal * (1 + interestRate);
    }

    setResult(finalAmount);
  };

  const saveInvestment = () => {
    if (!currentUser || !amount || !rate || !description) {
      uiToast({
        title: 'Erro',
        description: 'Por favor, preencha todos os campos',
        variant: 'destructive',
      });
      return;
    }

    if (insufficientBalance) {
      uiToast({
        title: 'Erro',
        description: 'Saldo insuficiente para realizar este investimento',
        variant: 'destructive',
      });
      return;
    }

    addInvestment({
      description,
      amount: parseFloat(amount),
      rate: parseFloat(rate),
      period,
      startDate: new Date(),
    });

    toast.success('Investimento adicionado com sucesso');

    // Reset form
    setDescription('');
    setAmount('');
    setRate('');
    setPeriod('monthly');
    setResult(null);
    
    // Update available balance after investment
    setAvailableBalance(calculateBalance() - parseFloat(amount));
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
          <Label htmlFor="investmentRate" className="text-white">Taxa de Rendimento (%)</Label>
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
          <Label className="text-white">Período</Label>
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

        <Button 
          onClick={calculateInvestment}
          className="w-full finance-btn"
        >
          Calcular Rendimento
        </Button>

        {result !== null && (
          <div className="mt-4 p-4 bg-finance-dark-lighter rounded-lg">
            <h3 className="text-white font-medium mb-2">Resultado</h3>
            <div className="flex justify-between">
              <span className="text-gray-400">Valor Final:</span>
              <span className="text-finance-blue font-bold">{formatCurrency(result)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Rendimento:</span>
              <span className="text-green-500 font-bold">{formatCurrency(result - parseFloat(amount))}</span>
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
