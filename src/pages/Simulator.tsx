import React, { useState, useEffect } from 'react';
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
  Repeat,
  AlertCircle,
  Home,
  ShoppingCart,
  DollarSign,
  BarChart
} from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import { generateSimulationData, SimulationDataPoint } from '@/utils/simulationUtils';

const Simulator = () => {
  const { 
    currentUser, 
    calculateBalance, 
    getFutureTransactions,
    getTotalInvestments,
    getProjectedInvestmentReturn 
  } = useFinance();
  const navigate = useNavigate();

  // Expense simulation
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [installments, setInstallments] = useState('1');
  const [customInstallments, setCustomInstallments] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringType, setRecurringType] = useState<'monthly' | 'weekly'>('monthly');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [useInvestments, setUseInvestments] = useState(false);
  
  // Results
  const [simulationResults, setSimulationResults] = useState<{
    currentBalance: number;
    afterExpense: number;
    monthlyData: SimulationDataPoint[];
  } | null>(null);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  if (!currentUser) {
    return null;
  }

  const getActualInstallments = () => {
    if (installments === 'custom') {
      return parseInt(customInstallments) || 1;
    }
    return parseInt(installments);
  };

  const handleSimulate = () => {
    if (!amount || !date) return;

    const expenseAmount = parseFloat(amount);
    const currentBalance = calculateBalance();
    const months = getActualInstallments();
    const totalInvestments = getTotalInvestments();
    
    // Get future transactions to incorporate into simulation
    const futureTransactions = getFutureTransactions();
    
    // Generate simulation data
    const monthlyData = generateSimulationData(
      currentBalance,
      expenseAmount,
      isRecurring,
      recurringType,
      months,
      futureTransactions,
      totalInvestments,
      getProjectedInvestmentReturn,
      true // simulatedExpense flag
    );

    let afterExpenseBalance = currentBalance - expenseAmount;
    
    // If user wants to use investments to cover expense and balance is negative
    if (useInvestments && afterExpenseBalance < 0) {
      const amountNeededFromInvestments = Math.min(Math.abs(afterExpenseBalance), totalInvestments);
      afterExpenseBalance = afterExpenseBalance + amountNeededFromInvestments;
    }

    setSimulationResults({
      currentBalance,
      afterExpense: afterExpenseBalance,
      monthlyData,
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-finance-dark-card p-3 border border-finance-dark-lighter rounded-md">
          <p className="text-gray-200 font-medium">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${formatCurrency(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
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
                  <SelectItem value="food">Alimentação</SelectItem>
                  <SelectItem value="transport">Transporte</SelectItem>
                  <SelectItem value="electronics">Eletrônicos</SelectItem>
                  <SelectItem value="appliances">Eletrodomésticos</SelectItem>
                  <SelectItem value="furniture">Móveis</SelectItem>
                  <SelectItem value="clothing">Vestuário</SelectItem>
                  <SelectItem value="entertainment">Entretenimento</SelectItem>
                  <SelectItem value="bills">Contas</SelectItem>
                  <SelectItem value="shopping">Compras</SelectItem>
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
                  <SelectContent className="bg-finance-dark-lighter border-finance-dark max-h-60 overflow-y-auto">
                    <SelectItem value="1">À vista</SelectItem>
                    <SelectItem value="2">2x</SelectItem>
                    <SelectItem value="3">3x</SelectItem>
                    <SelectItem value="4">4x</SelectItem>
                    <SelectItem value="5">5x</SelectItem>
                    <SelectItem value="6">6x</SelectItem>
                    <SelectItem value="10">10x</SelectItem>
                    <SelectItem value="12">12x</SelectItem>
                    <SelectItem value="18">18x</SelectItem>
                    <SelectItem value="24">24x</SelectItem>
                    <SelectItem value="36">36x</SelectItem>
                    <SelectItem value="48">48x</SelectItem>
                    <SelectItem value="60">60x</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>

                {installments === 'custom' && (
                  <div className="mt-2">
                    <Label htmlFor="customInstallments" className="text-white">Número de Parcelas</Label>
                    <Input
                      id="customInstallments"
                      type="number"
                      value={customInstallments}
                      onChange={(e) => setCustomInstallments(e.target.value)}
                      placeholder="Digite o número de parcelas"
                      className="finance-input mt-1"
                      min="1"
                    />
                  </div>
                )}
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

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-white" />
                <Label htmlFor="useInvestments" className="text-white">Usar investimentos se necessário</Label>
              </div>
              <div className="flex items-center">
                <Button 
                  variant={useInvestments ? "default" : "outline"}
                  size="sm"
                  className={`mr-2 ${useInvestments ? "bg-finance-blue" : "bg-finance-dark-lighter text-gray-400"}`}
                  onClick={() => setUseInvestments(true)}
                >
                  Sim
                </Button>
                <Button 
                  variant={!useInvestments ? "default" : "outline"}
                  size="sm"
                  className={`${!useInvestments ? "bg-finance-blue" : "bg-finance-dark-lighter text-gray-400"}`}
                  onClick={() => setUseInvestments(false)}
                >
                  Não
                </Button>
              </div>
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

              {useInvestments && simulationResults.currentBalance < parseFloat(amount) && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Usando investimentos:</span>
                  <span className="text-amber-400 font-bold">
                    {formatCurrency(Math.min(getTotalInvestments(), parseFloat(amount) - simulationResults.currentBalance))}
                  </span>
                </div>
              )}

              <div className="h-64 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={simulationResults.monthlyData}
                    margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="month" stroke="#999" />
                    <YAxis stroke="#999" />
                    <Tooltip content={CustomTooltip} />
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
                    <Line 
                      type="monotone" 
                      name="Investimentos"
                      dataKey="investments" 
                      stroke="#FF9F1C" 
                      strokeWidth={2}
                      dot={{ fill: '#FF9F1C', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="p-3 bg-finance-dark-lighter rounded-lg">
                <p className="text-gray-400 text-sm">
                  Esta simulação mostra como sua situação financeira estará nos próximos 
                  6 meses se você realizar esta {isRecurring ? 'despesa recorrente' : `compra${getActualInstallments() !== 1 ? ` parcelada em ${getActualInstallments()}x` : ''}`}.
                  {useInvestments && " Se necessário, seus investimentos serão usados para cobrir a despesa."}
                </p>
              </div>
              
              {simulationResults.monthlyData.some(data => data.withExpense < 0) && !useInvestments && (
                <div className="p-3 bg-red-950/40 rounded-lg border border-red-800/50">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={18} className="text-red-400 mt-0.5" />
                    <p className="text-red-400 text-sm">
                      Seu saldo ficará negativo em algum momento nos próximos meses
                      se realizar esta despesa. Considere reduzir o valor, aumentar suas fontes de receita
                      ou usar seus investimentos.
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end">
                <Button 
                  onClick={() => navigate('/future-graphs')}
                  variant="outline"
                  className="mr-2 bg-finance-dark-lighter border-finance-dark text-white"
                >
                  Ver Projeções
                </Button>
                <Button 
                  className="finance-btn"
                  onClick={() => navigate('/expenses')}
                >
                  Adicionar Despesa
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-finance-dark-card py-3 flex justify-around items-center">
        <button className="navbar-icon" onClick={() => navigate('/dashboard')}>
          <Home size={24} className="text-white" />
        </button>
        <button className="navbar-icon" onClick={() => navigate('/expenses')}>
          <ShoppingCart size={24} className="text-white" />
        </button>
        <div className="-mt-8">
          <button 
            className="w-12 h-12 rounded-full bg-finance-blue flex items-center justify-center"
            onClick={() => navigate('/add-income')}
          >
            <DollarSign size={24} className="text-white" />
          </button>
        </div>
        <button className="navbar-icon" onClick={() => navigate('/investments')}>
          <BarChart size={24} className="text-white" />
        </button>
        <button className="navbar-icon" onClick={() => navigate('/simulator')}>
          <TrendingUp size={24} className="text-white" />
        </button>
      </div>
    </div>
  );
};

export default Simulator;
