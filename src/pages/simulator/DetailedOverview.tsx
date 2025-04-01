
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SimulationResults, CategoryData } from './types';
import { formatCurrency } from '@/lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { PieChart as PieChartIcon, Calculator, ArrowUpDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DetailedOverviewProps {
  results: SimulationResults | null;
  categoryData: CategoryData[];
  onGoToSimulation: () => void;
}

const DetailedOverview: React.FC<DetailedOverviewProps> = ({
  results,
  categoryData,
  onGoToSimulation
}) => {
  const navigate = useNavigate();

  return (
    <Card className="finance-card bg-finance-dark-card border border-finance-dark-lighter rounded-xl shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <PieChartIcon size={22} className="text-finance-blue" />
        <h2 className="text-xl font-semibold text-white">Visão Detalhada</h2>
      </div>
      
      <div className="space-y-6">
        {/* Gráfico de despesas por categoria */}
        <div>
          <h3 className="text-white font-medium mb-3 flex items-center">
            <span className="w-2 h-2 bg-finance-blue rounded-full mr-2"></span>
            Despesas por Categoria
          </h3>
          <div className="h-64 bg-finance-dark-lighter p-3 rounded-lg">
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
                <Bar dataKey="value" name="Valor" radius={[4, 4, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Gráfico de projeção mensal */}
        {results && results.monthlyData && results.monthlyData.length > 0 && (
          <div>
            <h3 className="text-white font-medium mb-3 flex items-center">
              <span className="w-2 h-2 bg-finance-blue rounded-full mr-2"></span>
              Projeção Mensal
            </h3>
            <div className="h-64 bg-finance-dark-lighter p-3 rounded-lg">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={results.monthlyData}
                  margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="month" stroke="#999" />
                  <YAxis stroke="#999" />
                  <Tooltip 
                    formatter={(value) => [`${formatCurrency(value as number)}`, '']}
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="balance" 
                    name="Saldo Normal" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    activeDot={{ r: 8 }} 
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="withExpense" 
                    name="Com Despesa" 
                    stroke={results.monthlyDeficit < 0 ? "#EF4444" : "#3B82F6"} 
                    strokeWidth={2}
                    activeDot={{ r: 8 }} 
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="investments" 
                    name="Investimentos" 
                    stroke="#8B5CF6" 
                    strokeWidth={2}
                    activeDot={{ r: 8 }} 
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        
        {/* Tabela detalhada */}
        {results && results.monthlyData && results.monthlyData.length > 0 && (
          <div>
            <h3 className="text-white font-medium mb-3 flex items-center">
              <span className="w-2 h-2 bg-finance-blue rounded-full mr-2"></span>
              Projeção Mensal Detalhada
            </h3>
            <div className="overflow-x-auto bg-finance-dark-lighter p-2 rounded-lg">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-finance-dark border-b border-gray-700">
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-400">Mês</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-400">Saldo Normal</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-400">Com Despesa</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-400">Investimentos</th>
                    <th className="px-4 py-2 text-right text-sm font-medium text-gray-400">Diferença</th>
                  </tr>
                </thead>
                <tbody>
                  {results.monthlyData.map((month, index) => (
                    <tr key={index} className="border-b border-gray-800 hover:bg-finance-dark transition-colors">
                      <td className="px-4 py-3 text-sm text-white">{month.month}</td>
                      <td className="px-4 py-3 text-sm text-right text-green-400">{formatCurrency(month.balance)}</td>
                      <td className={`px-4 py-3 text-sm text-right ${month.withExpense < 0 ? 'text-red-400' : 'text-blue-400'}`}>
                        {formatCurrency(month.withExpense)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-purple-400">
                        {formatCurrency(month.investments)}
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
        
        <div className="p-4 bg-finance-dark-lighter rounded-lg border border-finance-dark">
          <p className="text-gray-300 text-sm">
            Esta visão detalhada permite analisar o impacto da nova despesa em relação às suas despesas atuais
            e ver como seu saldo evoluirá ao longo do tempo.
          </p>
        </div>
        
        <div className="flex justify-center gap-3">
          <Button 
            onClick={onGoToSimulation}
            variant="outline"
            className="bg-finance-dark-lighter border-finance-dark text-white hover:bg-finance-dark transition-colors"
          >
            <Calculator className="w-4 h-4 mr-2" />
            Nova Simulação
          </Button>
          {results && (
            <Button 
              className="bg-finance-blue hover:bg-finance-blue-dark text-white transition-colors"
              onClick={() => navigate('/cashflow')}
            >
              <ArrowUpDown className="w-4 h-4 mr-2" />
              Ver Fluxo de Caixa
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default DetailedOverview;
