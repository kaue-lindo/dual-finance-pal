
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { 
  ArrowLeft, 
  Calculator, 
  TrendingUp,
  Calendar as CalendarIcon,
  Repeat
} from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';

const Simulator = () => {
  const { currentUser, calculateBalance, simulateExpense, getFutureTransactions } = useFinance();
  const navigate = useNavigate();

  // Expense simulation
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [installments, setInstallments] = useState('1');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringType, setRecurringType] = useState<'monthly' | 'weekly'>('monthly');
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  // Results
  const [simulationResults, setSimulationResults] = useState<{
    currentBalance: number;
    afterExpense: number;
    monthlyData: { month: string; balance: number, withExpense: number }[];
  } | null>(null);

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  const handleSimulate = () => {
    if (!amount || !date) return;

    const expenseAmount = parseFloat(amount);
    const currentBalance = calculateBalance();
    const months = parseInt(installments);
    const monthlyPayment = expenseAmount / months;
    
    // Get future transactions to incorporate into simulation
    const futureTransactions = getFutureTransactions();
    
    // Generate forecast for the next 6 months
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentMonth = new Date().getMonth();
    
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const monthIndex = (currentMonth + i) % 12;
      const monthYear = new Date().getFullYear() + Math.floor((currentMonth + i) / 12);
      const monthDate = new Date(monthYear, monthIndex, 1);
      const nextMonthDate = new Date(monthYear, monthIndex + 1, 0); // Last day of month
      
      // Calculate impact of existing future transactions for this month
      let futureTransactionsImpact = 0;
      futureTransactions.forEach(transaction => {
        const transactionDate = new Date(transaction.date);
        if (
          transactionDate >= monthDate && 
          transactionDate <= nextMonthDate
        ) {
          futureTransactionsImpact += transaction.type === 'income' ? 
            transaction.amount : -transaction.amount;
        }
      });
      
      // Calculate impact of the simulated expense for this month
      let simulatedExpenseImpact = 0;
      
      // For installments
      if (!isRecurring && i < months) {
        simulatedExpenseImpact = -monthlyPayment;
      }
      // For recurring expenses
      else if (isRecurring) {
        if (recurringType === 'monthly') {
          simulatedExpenseImpact = -expenseAmount;
        } else if (recurringType === 'weekly') {
          // Roughly 4 weeks per month
          simulatedExpenseImpact = -expenseAmount * 4;
        }
      }
      
      // Calculate balances
      const baseBalance = i === 0 ? 
        currentBalance : 
        monthlyData[i-1].balance + futureTransactionsImpact;
      
      const withExpenseBalance = i === 0 ? 
        currentBalance + simulatedExpenseImpact : 
        monthlyData[i-1].withExpense + futureTransactionsImpact + simulatedExpenseImpact;
      
      return {
        month: `${monthNames[monthIndex]}/${monthYear.toString().slice(2)}`,
        balance: baseBalance,
        withExpense: withExpenseBalance
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

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat size={18} className="text-white" />
                <Label htmlFor="recurring" className="text-white">Despesa Recorrente</Label>
              </div>
              <div className="flex items-center">
                <Button 
                  variant={isRecurring ? "default" : "outline"}
                  size="sm"
                  className={`mr-2 ${isRecurring ? "bg-finance-blue" : "bg-finance-dark-lighter text-gray-400"}`}
                  onClick={() => setIsRecurring(true)}
                >
                  Sim
                </Button>
                <Button 
                  variant={!isRecurring ? "default" : "outline"}
                  size="sm"
                  className={`${!isRecurring ? "bg-finance-blue" : "bg-finance-dark-lighter text-gray-400"}`}
                  onClick={() => setIsRecurring(false)}
                >
                  Não
                </Button>
              </div>
            </div>

            {isRecurring ? (
              <div>
                <Label className="text-white">Tipo de Recorrência</Label>
                <Select
                  value={recurringType}
                  onValueChange={(value) => setRecurringType(value as 'monthly' | 'weekly')}
                >
                  <SelectTrigger className="finance-input mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-finance-dark-lighter border-finance-dark">
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
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
            )}

            <div>
              <Label className="text-white">Data Inicial</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full finance-input mt-1 flex justify-between items-center"
                  >
                    {date ? format(date, 'dd/MM/yyyy') : 'Selecione uma data'}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-finance-dark-lighter border-finance-dark" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
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
                <span className={`font-bold ${simulationResults.afterExpense >= 0 ? 'text-green-400' : 'text-red-400'}`}>
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
                      formatter={(value) => [formatCurrency(value as number), '']}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      name="Sem o gasto"
                      dataKey="balance" 
                      stroke="#4ade80" 
                      strokeWidth={2}
                      dot={{ fill: '#4ade80', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      name="Com o gasto"
                      dataKey="withExpense" 
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
                  6 meses se você realizar esta {isRecurring ? 'despesa recorrente' : `compra${installments !== '1' ? ' parcelada' : ''}`}.
                </p>
              </div>
              
              {simulationResults.monthlyData.some(data => data.withExpense < 0) && (
                <div className="p-3 bg-red-950/40 rounded-lg border border-red-800/50">
                  <p className="text-red-400 text-sm font-semibold">
                    Atenção: Seu saldo ficará negativo em algum momento nos próximos meses
                    se realizar esta despesa.
                  </p>
                </div>
              )}
              
              <div className="flex justify-end">
                <Button 
                  onClick={() => navigate('/dashboard')}
                  variant="outline"
                  className="mr-2 bg-finance-dark-lighter border-finance-dark text-white"
                >
                  Cancelar
                </Button>
                <Button 
                  className="finance-btn"
                  onClick={() => isRecurring ? navigate('/expenses') : navigate('/expenses')}
                >
                  Adicionar Despesa
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Simulator;
