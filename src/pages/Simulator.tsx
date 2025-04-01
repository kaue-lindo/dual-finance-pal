
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
import BottomNav from '@/components/ui/bottom-nav';
import { 
  ArrowLeft, 
  Calculator, 
  TrendingUp,
  Calendar as CalendarIcon,
  Repeat,
  AlertCircle,
  CheckCircle,
  PieChart
} from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { formatCurrency } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import { format, addMonths } from 'date-fns';
import { generateSimulationData, SimulationDataPoint } from '@/utils/simulationUtils';
import { toast } from 'sonner';

const Simulator = () => {
  const { 
    currentUser, 
    calculateBalance, 
    getFutureTransactions,
    getTotalInvestments,
    getProjectedInvestmentReturn,
    getMonthlyExpenseTotal,
    getRealIncome,
    addExpense,
    getCategoryExpenses
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
  
  // Visualization tab
  const [activeTab, setActiveTab] = useState('simulate');
  
  // Results
  const [simulationResults, setSimulationResults] = useState<{
    currentBalance: number;
    afterExpense: number;
    monthlyData: SimulationDataPoint[];
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlyPayment: number;
    monthlyDeficit: number;
    totalExpense: number;
  } | null>(null);

  // Current financial data
  const [financialData, setFinancialData] = useState({
    currentBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    totalInvestments: 0
  });

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    } else {
      // Obter dados financeiros atuais
      setFinancialData({
        currentBalance: calculateBalance(),
        monthlyIncome: getRealIncome(),
        monthlyExpenses: getMonthlyExpenseTotal(),
        totalInvestments: getTotalInvestments()
      });
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
    if (!amount || !date || !category) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const expenseAmount = parseFloat(amount);
    const currentBalance = calculateBalance();
    const months = getActualInstallments();
    const totalInvestments = getTotalInvestments();
    const monthlyIncome = getRealIncome();
    const monthlyExpenses = getMonthlyExpenseTotal();
    
    // Calcular pagamento mensal
    const monthlyPayment = isRecurring ? expenseAmount : expenseAmount / months;
    
    // Calcular déficit mensal (se houver)
    const monthlyDeficit = Math.max(0, monthlyPayment - (monthlyIncome - monthlyExpenses));
    
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

    let afterExpenseBalance = currentBalance - (isRecurring ? monthlyPayment : expenseAmount);
    
    // If user wants to use investments to cover expense and balance is negative
    if (useInvestments && afterExpenseBalance < 0) {
      const amountNeededFromInvestments = Math.min(Math.abs(afterExpenseBalance), totalInvestments);
      afterExpenseBalance = afterExpenseBalance + amountNeededFromInvestments;
    }

    setSimulationResults({
      currentBalance,
      afterExpense: afterExpenseBalance,
      monthlyData,
      monthlyIncome,
      monthlyExpenses,
      monthlyPayment,
      monthlyDeficit,
      totalExpense: expenseAmount
    });
    
    // Mudar para a aba de resultados se o resultado for calculado
    if (activeTab === 'simulate') {
      setActiveTab('results');
    }
  };

  const handleAddExpense = async () => {
    if (!description || !amount || !date || !category) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      // Preparar objeto de despesa
      const newExpense = {
        description,
        amount: parseFloat(amount),
        category,
        date: new Date(date),
        recurring: isRecurring ? {
          type: recurringType,
          days: []
        } : undefined,
        installment: getActualInstallments() > 1 ? {
          total: getActualInstallments(),
          current: 1,
          remaining: getActualInstallments() - 1
        } : undefined
      };

      // Adicionar a despesa
      await addExpense(newExpense);
      
      toast.success("Despesa adicionada com sucesso");
      
      // Limpar o formulário
      setDescription('');
      setAmount('');
      setCategory('');
      setInstallments('1');
      setCustomInstallments('');
      setIsRecurring(false);
      setRecurringType('monthly');
      setDate(new Date());
      
      // Atualizar dados financeiros
      setFinancialData({
        currentBalance: calculateBalance(),
        monthlyIncome: getRealIncome(),
        monthlyExpenses: getMonthlyExpenseTotal(),
        totalInvestments: getTotalInvestments()
      });
      
      // Voltar para a aba de simulação
      setActiveTab('simulate');
      setSimulationResults(null);
      
    } catch (error) {
      console.error("Erro ao adicionar despesa:", error);
      toast.error("Erro ao adicionar despesa");
    }
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

  // Obter dados de categorias para o gráfico
  const categoryExpenses = getCategoryExpenses();
  const categoryData = categoryExpenses.map(item => ({
    name: item.category === 'food' ? 'Alimentação' :
          item.category === 'housing' ? 'Moradia' :
          item.category === 'transportation' ? 'Transporte' :
          item.category === 'health' ? 'Saúde' :
          item.category === 'education' ? 'Educação' :
          item.category === 'entertainment' ? 'Entretenimento' :
          item.category === 'clothing' ? 'Vestuário' :
          item.category === 'utilities' ? 'Contas' :
          'Outros',
    value: item.amount,
    color: item.category === 'food' ? '#FF9F1C' :
           item.category === 'housing' ? '#2EC4B6' :
           item.category === 'transportation' ? '#E71D36' :
           item.category === 'health' ? '#8AC926' :
           item.category === 'education' ? '#9D4EDD' :
           item.category === 'entertainment' ? '#3A86FF' :
           item.category === 'clothing' ? '#FB5607' :
           item.category === 'utilities' ? '#FFBE0B' :
           '#6A7280'
  }));

  return (
    <div className="min-h-screen bg-finance-dark pb-20">
      {/* Header */}
      <div className="finance-card rounded-b-xl">
        <div className="flex justify-between items-center mb-4">
          <Button variant="ghost" size="icon" className="navbar-icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={24} className="text-white" />
          </Button>
          <h1 className="text-xl font-bold text-white">Simulador Financeiro</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="mt-6 px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-finance-dark-lighter">
            <TabsTrigger value="simulate" className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              <span>Simular</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>Resultados</span>
            </TabsTrigger>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              <span>Visão Geral</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="simulate">
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
                      <SelectItem value="housing">Moradia</SelectItem>
                      <SelectItem value="transportation">Transporte</SelectItem>
                      <SelectItem value="health">Saúde</SelectItem>
                      <SelectItem value="education">Educação</SelectItem>
                      <SelectItem value="entertainment">Entretenimento</SelectItem>
                      <SelectItem value="clothing">Vestuário</SelectItem>
                      <SelectItem value="utilities">Contas</SelectItem>
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
                        onSelect={setDate as any}
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

              {/* Resumo da situação financeira atual */}
              <div className="mt-6 p-4 bg-finance-dark-lighter rounded-lg">
                <h3 className="text-white font-medium mb-3">Resumo Financeiro Atual</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Saldo:</span>
                    <span className="text-white font-medium">{formatCurrency(financialData.currentBalance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Entrada Mensal:</span>
                    <span className="text-green-400 font-medium">{formatCurrency(financialData.monthlyIncome)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Gastos Mensais:</span>
                    <span className="text-red-400 font-medium">{formatCurrency(financialData.monthlyExpenses)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Investimentos:</span>
                    <span className="text-amber-400 font-medium">{formatCurrency(financialData.totalInvestments)}</span>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="results">
            {simulationResults ? (
              <Card className="finance-card">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={20} className="text-finance-blue" />
                  <h2 className="text-lg font-semibold text-white">Resultado da Simulação</h2>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-finance-dark-lighter p-3 rounded-lg">
                      <p className="text-gray-400 text-sm">Saldo Atual</p>
                      <p className="font-semibold text-white text-lg">{formatCurrency(simulationResults.currentBalance)}</p>
                    </div>
                    <div className="bg-finance-dark-lighter p-3 rounded-lg">
                      <p className="text-gray-400 text-sm">Após a Compra</p>
                      <p className={`font-semibold text-lg ${simulationResults.afterExpense >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatCurrency(simulationResults.afterExpense)}
                      </p>
                    </div>
                    <div className="bg-finance-dark-lighter p-3 rounded-lg">
                      <p className="text-gray-400 text-sm">Entrada Mensal</p>
                      <p className="font-semibold text-green-400 text-lg">{formatCurrency(simulationResults.monthlyIncome)}</p>
                    </div>
                    <div className="bg-finance-dark-lighter p-3 rounded-lg">
                      <p className="text-gray-400 text-sm">Gastos Mensais</p>
                      <p className="font-semibold text-red-400 text-lg">{formatCurrency(simulationResults.monthlyExpenses)}</p>
                    </div>
                    <div className="bg-finance-dark-lighter p-3 rounded-lg">
                      <p className="text-gray-400 text-sm">Parcela Mensal</p>
                      <p className="font-semibold text-amber-400 text-lg">
                        {formatCurrency(simulationResults.monthlyPayment)}
                      </p>
                    </div>
                    <div className="bg-finance-dark-lighter p-3 rounded-lg">
                      <p className="text-gray-400 text-sm">Prejuízo Mensal</p>
                      <p className={`font-semibold text-lg ${simulationResults.monthlyDeficit > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {simulationResults.monthlyDeficit > 0 ? formatCurrency(simulationResults.monthlyDeficit) : "R$ 0,00"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-finance-dark-lighter p-3 rounded-lg">
                    <p className="text-gray-400 text-sm">Valor Total da Despesa</p>
                    <p className="font-semibold text-lg text-white">{formatCurrency(simulationResults.totalExpense)}</p>
                  </div>

                  {useInvestments && simulationResults.currentBalance < parseFloat(amount) && (
                    <div className="flex justify-between p-3 bg-amber-900/20 border border-amber-800/30 rounded-lg">
                      <span className="text-amber-300">Usando investimentos:</span>
                      <span className="text-amber-300 font-bold">
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
                  
                  <div className="flex justify-center gap-3">
                    <Button 
                      onClick={() => setActiveTab('overview')}
                      variant="outline"
                      className="bg-finance-dark-lighter border-finance-dark text-white"
                    >
                      <PieChart className="w-4 h-4 mr-2" />
                      Ver Detalhes
                    </Button>
                    <Button 
                      className="finance-btn"
                      onClick={handleAddExpense}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Adicionar Despesa
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="finance-card p-6 text-center">
                <div className="flex flex-col items-center gap-4">
                  <Calculator size={48} className="text-finance-blue opacity-50" />
                  <p className="text-gray-400">Faça uma simulação para ver os resultados aqui</p>
                  <Button onClick={() => setActiveTab('simulate')} className="finance-btn">
                    Ir para Simulação
                  </Button>
                </div>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="overview">
            <Card className="finance-card">
              <div className="flex items-center gap-2 mb-4">
                <PieChart size={20} className="text-finance-blue" />
                <h2 className="text-lg font-semibold text-white">Visão Detalhada</h2>
              </div>
              
              <div className="space-y-6">
                {/* Gráfico de despesas por categoria */}
                <div>
                  <h3 className="text-white font-medium mb-3">Despesas por Categoria</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={categoryData}
                        margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="name" stroke="#999" />
                        <YAxis stroke="#999" />
                        <Tooltip 
                          formatter={(value) => [`${formatCurrency(value as number)}`, 'Valor']}
                          contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                        />
                        <Bar dataKey="value" name="Valor">
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Tabela detalhada */}
                {simulationResults && (
                  <div>
                    <h3 className="text-white font-medium mb-3">Projeção Mensal Detalhada</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-finance-dark-lighter border-b border-gray-700">
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-400">Mês</th>
                            <th className="px-4 py-2 text-right text-sm font-medium text-gray-400">Saldo Normal</th>
                            <th className="px-4 py-2 text-right text-sm font-medium text-gray-400">Com Despesa</th>
                            <th className="px-4 py-2 text-right text-sm font-medium text-gray-400">Diferença</th>
                          </tr>
                        </thead>
                        <tbody>
                          {simulationResults.monthlyData.map((month, index) => (
                            <tr key={index} className="border-b border-gray-800">
                              <td className="px-4 py-3 text-sm text-white">{month.month}</td>
                              <td className="px-4 py-3 text-sm text-right text-green-400">{formatCurrency(month.balance)}</td>
                              <td className={`px-4 py-3 text-sm text-right ${month.withExpense < 0 ? 'text-red-400' : 'text-blue-400'}`}>
                                {formatCurrency(month.withExpense)}
                              </td>
                              <td className={`px-4 py-3 text-sm text-right ${month.withExpense - month.balance < 0 ? 'text-red-400' : 'text-green-400'}`}>
                                {formatCurrency(month.withExpense - month.balance)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                <div className="p-3 bg-finance-dark-lighter rounded-lg">
                  <p className="text-gray-400 text-sm">
                    Esta visão detalhada permite analisar o impacto da nova despesa em relação às suas despesas atuais
                    e ver como seu saldo evoluirá ao longo do tempo.
                  </p>
                </div>
                
                <div className="flex justify-center gap-3">
                  <Button 
                    onClick={() => setActiveTab('simulate')}
                    variant="outline"
                    className="bg-finance-dark-lighter border-finance-dark text-white"
                  >
                    <Calculator className="w-4 h-4 mr-2" />
                    Nova Simulação
                  </Button>
                  {simulationResults && (
                    <Button 
                      className="finance-btn"
                      onClick={() => navigate('/cashflow')}
                    >
                      <ArrowUpDown className="w-4 h-4 mr-2" />
                      Ver Fluxo de Caixa
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav currentPath="/cashflow" />
    </div>
  );
};

export default Simulator;
