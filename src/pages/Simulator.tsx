
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  Calculator, 
  TrendingUp
} from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Simulator = () => {
  const { currentUser, calculateBalance, simulateExpense } = useFinance();
  const navigate = useNavigate();

  // Expense simulation
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [installments, setInstallments] = useState('1');
  
  // Results
  const [simulationResults, setSimulationResults] = useState<{
    currentBalance: number;
    afterExpense: number;
    monthlyData: { month: string; balance: number }[];
  } | null>(null);

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  const handleSimulate = () => {
    if (!amount) return;

    const expenseAmount = parseFloat(amount);
    const currentBalance = calculateBalance();
    const months = parseInt(installments);
    const monthlyPayment = expenseAmount / months;
    
    // Generate forecast for the next 6 months
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentMonth = new Date().getMonth();
    
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const monthIndex = (currentMonth + i) % 12;
      const installmentImpact = i < months ? monthlyPayment : 0;
      const balance = currentBalance - (monthlyPayment * Math.min(i + 1, months));
      
      return {
        month: monthNames[monthIndex],
        balance,
      };
    });

    setSimulationResults({
      currentBalance,
      afterExpense: currentBalance - expenseAmount,
      monthlyData,
    });
  };

  return (
    <div className="min-h-screen bg-finance-dark pb-20">
      {/* Header */}
      <div className="finance-card rounded-b-xl">
        <div className="flex justify-between items-center mb-4">
          <Button variant="ghost" size="icon" className="navbar-icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={24} className="text-white" />
          </Button>
          <h1 className="text-xl font-bold text-white">Simulador</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="mt-6 px-4">
        <Card className="finance-card">
          <div className="flex items-center gap-2 mb-4">
            <Calculator size={20} className="text-finance-blue" />
            <h2 className="text-lg font-semibold text-white">Simular Novo Gasto</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="simulationDescription" className="text-white">Descrição</Label>
              <Input 
                id="simulationDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Novo Smartphone"
                className="finance-input mt-1"
              />
            </div>

            <div>
              <Label htmlFor="simulationCategory" className="text-white">Categoria</Label>
              <Select
                value={category}
                onValueChange={setCategory}
              >
                <SelectTrigger className="finance-input mt-1">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent className="bg-finance-dark-lighter border-finance-dark">
                  <SelectItem value="electronics">Eletrônicos</SelectItem>
                  <SelectItem value="appliances">Eletrodomésticos</SelectItem>
                  <SelectItem value="furniture">Móveis</SelectItem>
                  <SelectItem value="clothing">Vestuário</SelectItem>
                  <SelectItem value="other">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="simulationAmount" className="text-white">Valor Total</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">R$</span>
                <Input
                  id="simulationAmount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className="finance-input pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="simulationInstallments" className="text-white">Parcelas</Label>
              <Select
                value={installments}
                onValueChange={setInstallments}
              >
                <SelectTrigger className="finance-input mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-finance-dark-lighter border-finance-dark">
                  <SelectItem value="1">À vista</SelectItem>
                  <SelectItem value="2">2x</SelectItem>
                  <SelectItem value="3">3x</SelectItem>
                  <SelectItem value="4">4x</SelectItem>
                  <SelectItem value="5">5x</SelectItem>
                  <SelectItem value="6">6x</SelectItem>
                  <SelectItem value="12">12x</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleSimulate}
              className="w-full finance-btn"
            >
              Simular Impacto
            </Button>
          </div>
        </Card>

        {simulationResults && (
          <Card className="finance-card mt-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={20} className="text-finance-blue" />
              <h2 className="text-lg font-semibold text-white">Resultado da Simulação</h2>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Saldo Atual:</span>
                <span className="text-white font-bold">
                  {formatCurrency(simulationResults.currentBalance)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Após a Compra:</span>
                <span className="text-white font-bold">
                  {formatCurrency(simulationResults.afterExpense)}
                </span>
              </div>

              <div className="h-64 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={simulationResults.monthlyData}
                    margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="month" stroke="#999" />
                    <YAxis stroke="#999" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#27292f', borderColor: '#333' }}
                      labelStyle={{ color: '#fff' }}
                      formatter={(value) => [formatCurrency(value as number), 'Saldo']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="balance" 
                      stroke="#0e84de" 
                      strokeWidth={2}
                      dot={{ fill: '#0e84de', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="p-3 bg-finance-dark-lighter rounded-lg">
                <p className="text-gray-400 text-sm">
                  Esta simulação mostra como sua situação financeira estará nos próximos 
                  6 meses se você realizar esta compra{installments !== '1' ? ' parcelada' : ''}.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Simulator;
