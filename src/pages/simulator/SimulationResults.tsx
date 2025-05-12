
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SimulationResults, SimulationDataPoint } from './types';
import { formatCurrency } from '@/context/finance/utils/formatting';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { TrendingUp, AlertCircle, CheckCircle, PieChart, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimulationResultsProps {
  results: SimulationResults | null;
  useInvestments: boolean;
  isRecurring: boolean;
  actualInstallments: number;
  totalInvestments: number;
  amount: string;
  onAddExpense: () => void;
  onViewDetails: () => void;
  onGoToSimulation: () => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-finance-dark-card p-3 border border-finance-dark-lighter rounded-md shadow-lg">
        <p className="text-gray-200 font-medium border-b border-gray-700 pb-1 mb-2">{`${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} className="text-sm flex justify-between items-center py-0.5" style={{ color: entry.color }}>
            <span className="mr-4">{`${entry.name}:`}</span>
            <span className="font-medium">{formatCurrency(entry.value)}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const SimulationResultsComponent: React.FC<SimulationResultsProps> = ({
  results,
  useInvestments,
  isRecurring,
  actualInstallments,
  totalInvestments,
  amount,
  onAddExpense,
  onViewDetails,
  onGoToSimulation
}) => {
  if (!results) {
    return (
      <Card className="finance-card p-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <TrendingUp size={48} className="text-finance-blue opacity-50" />
          <p className="text-gray-400">Faça uma simulação para ver os resultados aqui</p>
          <Button onClick={onGoToSimulation} className="finance-btn">
            Ir para Simulação
          </Button>
        </div>
      </Card>
    );
  }

  // Calculate some trends for displaying indicators
  const monthlyTrend = results.monthlyData.length > 1 
    ? results.monthlyData[results.monthlyData.length-1].withExpense - results.monthlyData[0].withExpense 
    : 0;
  
  const investmentsTrend = results.monthlyData.length > 1
    ? results.monthlyData[results.monthlyData.length-1].investments - results.monthlyData[0].investments
    : 0;

  // Calculate the final state after the entire simulation period
  const finalState = results.monthlyData[results.monthlyData.length - 1];
  const willBeNegative = results.monthlyData.some(data => data.withExpense < 0);

  return (
    <Card className="finance-card">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={20} className="text-finance-blue" />
        <h2 className="text-lg font-semibold text-white">Resultado da Simulação</h2>
      </div>

      <div className="space-y-5">
        {/* Summary cards with improved styling */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card className="p-4 bg-gradient-to-br from-finance-dark-lighter to-finance-dark border-0 shadow-lg">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Situação Atual</p>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-white text-lg">{formatCurrency(results.currentBalance)}</p>
            </div>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-finance-dark-lighter to-finance-dark border-0 shadow-lg">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Após a Despesa</p>
            <div className="flex items-center justify-between">
              <p className={`font-semibold text-lg ${results.afterExpense >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(results.afterExpense)}
              </p>
              <span className={cn("p-1 rounded-full", results.afterExpense >= 0 ? "bg-green-500/20" : "bg-red-500/20")}>
                {results.afterExpense >= results.currentBalance ? 
                  <ArrowUp className="w-4 h-4 text-green-400" /> : 
                  <ArrowDown className="w-4 h-4 text-red-400" />}
              </span>
            </div>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-finance-dark-lighter to-finance-dark border-0 shadow-lg">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Fluxo Mensal</p>
            <div className="flex items-center justify-between">
              <div className="grid grid-cols-2 gap-2 w-full">
                <div>
                  <p className="text-xs text-gray-400">Entrada</p>
                  <p className="font-medium text-green-400">{formatCurrency(results.monthlyIncome)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Saída</p>
                  <p className="font-medium text-red-400">{formatCurrency(results.monthlyExpenses)}</p>
                </div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-gradient-to-br from-finance-dark-lighter to-finance-dark border-0 shadow-lg">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Parcela Mensal</p>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-amber-400 text-lg">
                {formatCurrency(results.monthlyPayment)}
              </p>
              <span className="text-xs text-gray-400 bg-amber-500/10 px-2 py-1 rounded">
                {isRecurring ? 'Recorrente' : (actualInstallments > 1 ? `${actualInstallments}x` : 'À vista')}
              </span>
            </div>
          </Card>
        </div>

        {/* Final status after simulation period */}
        <Card className="p-4 bg-finance-dark-lighter border border-finance-dark-lighter">
          <div className="flex justify-between items-center mb-2">
            <p className="text-gray-400 text-sm">Saldo final após simulação:</p>
            <p className={`font-semibold text-lg ${finalState.withExpense >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(finalState.withExpense)}
            </p>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-gray-400 text-sm">Investimentos projetados:</p>
            <p className="font-semibold text-amber-400">
              {formatCurrency(finalState.investments)}
            </p>
          </div>
        </Card>

        {/* Enhanced chart with improved styling */}
        <div className="h-80 mt-6 bg-finance-dark-lighter p-4 rounded-xl border border-finance-dark-lighter">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={results.monthlyData}
              margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis 
                dataKey="month" 
                stroke="#999"
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#444' }}
              />
              <YAxis 
                stroke="#999" 
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#444' }}
                tickFormatter={(value) => formatCurrency(value).replace('R$', '')}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: 10 }} />
              <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
              <Line 
                type="monotone" 
                name="Sem o gasto"
                dataKey="balance" 
                stroke="#4ade80" 
                strokeWidth={2.5}
                dot={{ fill: '#4ade80', r: 4 }}
                activeDot={{ r: 6 }}
                animationDuration={1000}
              />
              <Line 
                type="monotone" 
                name="Com o gasto"
                dataKey="withExpense" 
                stroke="#0e84de" 
                strokeWidth={2.5}
                dot={{ fill: '#0e84de', r: 4 }}
                activeDot={{ r: 6 }}
                animationDuration={1000}
              />
              <Line 
                type="monotone" 
                name="Investimentos"
                dataKey="investments" 
                stroke="#FF9F1C" 
                strokeWidth={2.5}
                dot={{ fill: '#FF9F1C', r: 4 }}
                activeDot={{ r: 6 }}
                animationDuration={1000}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {useInvestments && results.currentBalance < parseFloat(amount) && (
          <div className="flex justify-between p-4 bg-amber-900/20 border border-amber-800/30 rounded-lg">
            <span className="text-amber-300 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              Usando investimentos:
            </span>
            <span className="text-amber-300 font-bold">
              {formatCurrency(Math.min(totalInvestments, parseFloat(amount) - results.currentBalance))}
            </span>
          </div>
        )}

        <div className="p-4 bg-finance-dark-lighter rounded-lg">
          <p className="text-gray-300 text-sm">
            Esta simulação mostra como sua situação financeira estará nos próximos 
            {results.monthlyData.length} meses se você realizar esta {isRecurring ? 'despesa recorrente' : `compra${actualInstallments !== 1 ? ` parcelada em ${actualInstallments}x` : ''}`}.
            {useInvestments && " Se necessário, seus investimentos serão usados para cobrir a despesa."}
          </p>
        </div>
        
        {willBeNegative && !useInvestments && (
          <div className="p-4 bg-red-950/40 rounded-lg border border-red-800/50">
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
            onClick={onViewDetails}
            variant="outline"
            className="bg-finance-dark-lighter border-finance-dark text-white hover:bg-finance-dark/80 transition-colors"
          >
            <PieChart className="w-4 h-4 mr-2" />
            Ver Detalhes
          </Button>
          <Button 
            className="finance-btn bg-finance-blue hover:bg-finance-blue/80"
            onClick={onAddExpense}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Adicionar Despesa
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default SimulationResultsComponent;
