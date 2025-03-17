
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/components/ui/use-toast';

const InvestmentCalculator = () => {
  const { currentUser, addInvestment } = useFinance();
  const { toast } = useToast();

  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState('');
  const [period, setPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [description, setDescription] = useState('');
  const [result, setResult] = useState<number | null>(null);

  const calculateInvestment = () => {
    if (!amount || !rate) {
      toast({
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
      toast({
        title: 'Erro',
        description: 'Por favor, preencha todos os campos',
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

    toast({
      title: 'Sucesso',
      description: 'Investimento adicionado com sucesso',
    });

    // Reset form
    setDescription('');
    setAmount('');
    setRate('');
    setPeriod('monthly');
    setResult(null);
  };

  return (
    <Card className="finance-card mt-4">
      <div className="space-y-4">
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
              className="finance-input pl-10"
            />
          </div>
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
