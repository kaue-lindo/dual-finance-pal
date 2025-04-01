
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import BottomNav from '@/components/ui/bottom-nav';
import { ArrowLeft, Calculator, TrendingUp, PieChart } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { toast } from 'sonner';

// Importação dos componentes refatorados
import SimulationForm from './simulator/SimulationForm';
import SimulationResultsComponent from './simulator/SimulationResults';
import DetailedOverview from './simulator/DetailedOverview';
import { SimulationData, SimulationResults, SimulationDataPoint, CategoryData, FinancialSummary } from './simulator/types';
import { generateSimulationData } from '@/utils/simulationUtils';

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

  // Estado inicial para o formulário de simulação
  const [simulationData, setSimulationData] = useState<SimulationData>({
    description: '',
    amount: '',
    category: '',
    installments: '1',
    customInstallments: '',
    isRecurring: false,
    recurringType: 'monthly',
    date: new Date(),
    useInvestments: false
  });
  
  // Estado para a aba ativa
  const [activeTab, setActiveTab] = useState('simulate');
  
  // Estado para os resultados da simulação
  const [simulationResults, setSimulationResults] = useState<SimulationResults | null>(null);

  // Estado para dados financeiros atuais
  const [financialData, setFinancialData] = useState<FinancialSummary>({
    currentBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    totalInvestments: 0
  });

  // Atualizar dados quando o usuário for carregado
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

  // Função auxiliar para obter o número real de parcelas
  const getActualInstallments = () => {
    if (simulationData.installments === 'custom') {
      return parseInt(simulationData.customInstallments) || 1;
    }
    return parseInt(simulationData.installments);
  };

  // Atualizar os dados da simulação
  const updateSimulationData = (data: Partial<SimulationData>) => {
    setSimulationData(prev => ({ ...prev, ...data }));
  };

  // Função para simular o impacto financeiro
  const handleSimulate = () => {
    if (!simulationData.amount || !simulationData.date || !simulationData.category) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const expenseAmount = parseFloat(simulationData.amount);
    const currentBalance = calculateBalance();
    const months = getActualInstallments();
    const totalInvestments = getTotalInvestments();
    const monthlyIncome = getRealIncome();
    const monthlyExpenses = getMonthlyExpenseTotal();
    
    // Calcular pagamento mensal
    const monthlyPayment = simulationData.isRecurring ? expenseAmount : expenseAmount / months;
    
    // Calcular déficit mensal (se houver)
    const monthlyDeficit = Math.max(0, monthlyPayment - (monthlyIncome - monthlyExpenses));
    
    // Get future transactions to incorporate into simulation
    const futureTransactions = getFutureTransactions();
    
    // Generate simulation data
    const monthlyData = generateSimulationData(
      currentBalance,
      expenseAmount,
      simulationData.isRecurring,
      simulationData.recurringType,
      months,
      futureTransactions,
      totalInvestments,
      getProjectedInvestmentReturn,
      true // simulatedExpense flag
    );

    let afterExpenseBalance = currentBalance - (simulationData.isRecurring ? monthlyPayment : expenseAmount);
    
    // If user wants to use investments to cover expense and balance is negative
    if (simulationData.useInvestments && afterExpenseBalance < 0) {
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

  // Função para adicionar a despesa
  const handleAddExpense = async () => {
    if (!simulationData.description || !simulationData.amount || !simulationData.date || !simulationData.category) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      // Preparar objeto de despesa
      const newExpense = {
        description: simulationData.description,
        amount: parseFloat(simulationData.amount),
        category: simulationData.category,
        date: new Date(simulationData.date),
        recurring: simulationData.isRecurring ? {
          type: simulationData.recurringType,
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
      setSimulationData({
        description: '',
        amount: '',
        category: '',
        installments: '1',
        customInstallments: '',
        isRecurring: false,
        recurringType: 'monthly',
        date: new Date(),
        useInvestments: false
      });
      
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

  // Obter dados de categorias para o gráfico
  const categoryExpenses = getCategoryExpenses();
  const categoryData: CategoryData[] = categoryExpenses.map(item => ({
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
            <SimulationForm 
              simulationData={simulationData}
              updateSimulationData={updateSimulationData}
              financialSummary={financialData}
              onSimulate={handleSimulate}
            />
          </TabsContent>
          
          <TabsContent value="results">
            <SimulationResultsComponent
              results={simulationResults}
              useInvestments={simulationData.useInvestments}
              isRecurring={simulationData.isRecurring}
              actualInstallments={getActualInstallments()}
              totalInvestments={financialData.totalInvestments}
              amount={simulationData.amount}
              onAddExpense={handleAddExpense}
              onViewDetails={() => setActiveTab('overview')}
              onGoToSimulation={() => setActiveTab('simulate')}
            />
          </TabsContent>
          
          <TabsContent value="overview">
            <DetailedOverview
              results={simulationResults}
              categoryData={categoryData}
              onGoToSimulation={() => setActiveTab('simulate')}
            />
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav currentPath="/cashflow" />
    </div>
  );
};

export default Simulator;
