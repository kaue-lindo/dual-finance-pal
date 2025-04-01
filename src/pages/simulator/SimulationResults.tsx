
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SimulationResults, SimulationDataPoint } from './types';
import { formatCurrency } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, AlertCircle, CheckCircle, PieChart } from 'lucide-react';

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

  return (
    <Card className="finance-card">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={20} className="text-finance-blue" />
        <h2 className="text-lg font-semibold text-white">Resultado da Simulação</h2>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-finance-dark-lighter p-3 rounded-lg">
            <p className="text-gray-400 text-sm">Saldo Atual</p>
            <p className="font-semibold text-white text-lg">{formatCurrency(results.currentBalance)}</p>
          </div>
          <div className="bg-finance-dark-lighter p-3 rounded-lg">
            <p className="text-gray-400 text-sm">Após a Compra</p>
            <p className={`font-semibold text-lg ${results.afterExpense >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(results.afterExpense)}
            </p>
          </div>
          <div className="bg-finance-dark-lighter p-3 rounded-lg">
            <p className="text-gray-400 text-sm">Entrada Mensal</p>
            <p className="font-semibold text-green-400 text-lg">{formatCurrency(results.monthlyIncome)}</p>
          </div>
          <div className="bg-finance-dark-lighter p-3 rounded-lg">
            <p className="text-gray-400 text-sm">Gastos Mensais</p>
            <p className="font-semibold text-red-400 text-lg">{formatCurrency(results.monthlyExpenses)}</p>
          </div>
          <div className="bg-finance-dark-lighter p-3 rounded-lg">
            <p className="text-gray-400 text-sm">Parcela Mensal</p>
            <p className="font-semibold text-amber-400 text-lg">
              {formatCurrency(results.monthlyPayment)}
            </p>
          </div>
          <div className="bg-finance-dark-lighter p-3 rounded-lg">
            <p className="text-gray-400 text-sm">Prejuízo Mensal</p>
            <p className={`font-semibold text-lg ${results.monthlyDeficit > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {results.monthlyDeficit > 0 ? formatCurrency(results.monthlyDeficit) : "R$ 0,00"}
            </p>
          </div>
        </div>

        <div className="bg-finance-dark-lighter p-3 rounded-lg">
          <p className="text-gray-400 text-sm">Valor Total da Despesa</p>
          <p className="font-semibold text-lg text-white">{formatCurrency(results.totalExpense)}</p>
        </div>

        {useInvestments && results.currentBalance < parseFloat(amount) && (
          <div className="flex justify-between p-3 bg-amber-900/20 border border-amber-800/30 rounded-lg">
            <span className="text-amber-300">Usando investimentos:</span>
            <span className="text-amber-300 font-bold">
              {formatCurrency(Math.min(totalInvestments, parseFloat(amount) - results.currentBalance))}
            </span>
          </div>
        )}

        <div className="h-64 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={results.monthlyData}
              margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="month" stroke="#999" />
              <YAxis stroke="#999" />
              <Tooltip content={<CustomTooltip />} />
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
            6 meses se você realizar esta {isRecurring ? 'despesa recorrente' : `compra${actualInstallments !== 1 ? ` parcelada em ${actualInstallments}x` : ''}`}.
            {useInvestments && " Se necessário, seus investimentos serão usados para cobrir a despesa."}
          </p>
        </div>
        
        {results.monthlyData.some(data => data.withExpense < 0) && !useInvestments && (
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
            onClick={onViewDetails}
            variant="outline"
            className="bg-finance-dark-lighter border-finance-dark text-white"
          >
            <PieChart className="w-4 h-4 mr-2" />
            Ver Detalhes
          </Button>
          <Button 
            className="finance-btn"
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
