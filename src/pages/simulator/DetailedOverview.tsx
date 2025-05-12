
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SimulationResults, CategoryData } from './types';
import { formatCurrency } from '@/context/finance/utils/formatting';
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
  Legend,
  PieChart,
  Pie,
  Sector
} from 'recharts';
import { PieChart as PieChartIcon, Calculator, ArrowUpDown, BarChart3, BarChart2, Layers, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DetailedOverviewProps {
  results: SimulationResults | null;
  categoryData: CategoryData[];
  onGoToSimulation: () => void;
}

// Enhanced tooltip for pie chart
const renderActiveShape = (props: any) => {
  const { 
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value
  } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.9}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 15}
        outerRadius={outerRadius + 18}
        fill={fill}
        opacity={0.8}
      />
      <text x={cx} y={cy - 15} textAnchor="middle" fill="#fff" fontSize={14}>
        {payload.name}
      </text>
      <text x={cx} y={cy + 15} textAnchor="middle" fill="#fff" fontWeight="bold" fontSize={14}>
        {formatCurrency(value)}
      </text>
      <text x={cx} y={cy + 35} textAnchor="middle" fill="#999" fontSize={12}>
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    </g>
  );
};

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-finance-dark-card p-3 border border-finance-dark-lighter rounded-md shadow-lg">
        <p className="text-gray-200 font-medium mb-1">{`${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} className="text-sm flex justify-between gap-3" style={{ color: entry.fill }}>
            <span>{entry.name}:</span>
            <span className="font-medium">{formatCurrency(entry.value)}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CustomLineTooltip = ({ active, payload, label }: any) => {
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

const DetailedOverview: React.FC<DetailedOverviewProps> = ({
  results,
  categoryData,
  onGoToSimulation
}) => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('charts');

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  if (!results || !results.monthlyData || results.monthlyData.length === 0) {
    return (
      <Card className="finance-card p-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <PieChartIcon size={48} className="text-finance-blue opacity-50" />
          <p className="text-gray-400">Faça uma simulação primeiro para ver os detalhes</p>
          <Button onClick={onGoToSimulation} className="finance-btn">
            Ir para Simulação
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="finance-card bg-finance-dark-card border border-finance-dark-lighter rounded-xl shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <PieChartIcon size={22} className="text-finance-blue flex-shrink-0" />
        <h2 className="text-xl font-semibold text-white truncate">Visão Detalhada</h2>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="charts" className="flex items-center gap-1">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Gráficos</span>
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-1">
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">Detalhes</span>
          </TabsTrigger>
          <TabsTrigger value="monthly" className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Mensal</span>
          </TabsTrigger>
        </TabsList>
      
        <TabsContent value="charts" className="space-y-6">
          {/* Gráfico de despesas por categoria */}
          <div>
            <h3 className="text-white font-medium mb-3 flex items-center">
              <span className="w-2 h-2 bg-finance-blue rounded-full mr-2 flex-shrink-0"></span>
              <span className="truncate">Despesas por Categoria</span>
            </h3>
            <div className="h-80 bg-gradient-to-b from-finance-dark-lighter to-finance-dark p-4 rounded-lg shadow-inner">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                    onMouseEnter={onPieEnter}
                    paddingAngle={2}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Gráfico de projeção mensal */}
          <div>
            <h3 className="text-white font-medium mb-3 flex items-center">
              <span className="w-2 h-2 bg-finance-blue rounded-full mr-2 flex-shrink-0"></span>
              <span className="truncate">Projeção Mensal</span>
            </h3>
            <div className="h-80 bg-gradient-to-b from-finance-dark-lighter to-finance-dark p-4 rounded-lg shadow-inner">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={results.monthlyData}
                  margin={{ top: 10, right: 10, left: 5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#999" 
                    tick={{ fill: '#aaa', fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="#999" 
                    tick={{ fill: '#aaa', fontSize: 12 }} 
                    tickFormatter={(value) => formatCurrency(value).replace('R$', '')}
                  />
                  <Tooltip content={<CustomLineTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="balance" 
                    name="Saldo Normal" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    dot={{ fill: '#10B981', r: 4, strokeWidth: 1 }}
                    activeDot={{ r: 8 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="withExpense" 
                    name="Com Despesa" 
                    stroke={results.monthlyDeficit < 0 ? "#3B82F6" : "#EF4444"} 
                    strokeWidth={3}
                    dot={{ fill: results.monthlyDeficit < 0 ? "#3B82F6" : "#EF4444", r: 4, strokeWidth: 1 }}
                    activeDot={{ r: 8 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="investments" 
                    name="Investimentos" 
                    stroke="#FF9F1C" 
                    strokeWidth={3}
                    dot={{ fill: '#FF9F1C', r: 4, strokeWidth: 1 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-4 bg-finance-dark-lighter rounded-lg border border-finance-dark">
            <p className="text-gray-300 text-sm">
              Esta visão detalhada permite analisar o impacto da nova despesa em relação às suas despesas atuais
              e ver como seu saldo evoluirá ao longo do tempo completo da simulação.
            </p>
          </div>
        </TabsContent>
      
        <TabsContent value="details" className="space-y-6">
          {/* Resumo detalhado em cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Card className="p-3 bg-finance-dark-lighter">
              <h4 className="text-sm text-gray-400 mb-2">Impacto Imediato</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Saldo Atual:</span>
                  <span className="text-white font-medium">{formatCurrency(results.currentBalance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Valor da Despesa:</span>
                  <span className="text-red-400 font-medium">{formatCurrency(results.totalExpense)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Saldo Após Despesa:</span>
                  <span className={`font-medium ${results.afterExpense < 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {formatCurrency(results.afterExpense)}
                  </span>
                </div>
              </div>
            </Card>
            
            <Card className="p-3 bg-finance-dark-lighter">
              <h4 className="text-sm text-gray-400 mb-2">Impacto Mensal</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Entrada Mensal:</span>
                  <span className="text-green-400 font-medium">{formatCurrency(results.monthlyIncome)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Gastos Mensais:</span>
                  <span className="text-red-400 font-medium">{formatCurrency(results.monthlyExpenses)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Nova Despesa:</span>
                  <span className="text-amber-400 font-medium">{formatCurrency(results.monthlyPayment)}</span>
                </div>
              </div>
            </Card>
            
            <Card className="p-3 bg-finance-dark-lighter">
              <h4 className="text-sm text-gray-400 mb-2">Fluxo Projetado</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Saldo Inicial:</span>
                  <span className="text-white font-medium">
                    {formatCurrency(results.monthlyData[0].withExpense)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Saldo Final:</span>
                  <span className={`font-medium ${
                    results.monthlyData[results.monthlyData.length - 1].withExpense < 0 
                      ? 'text-red-400' 
                      : 'text-green-400'
                  }`}>
                    {formatCurrency(results.monthlyData[results.monthlyData.length - 1].withExpense)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Variação:</span>
                  <span className={`font-medium ${
                    results.monthlyData[results.monthlyData.length - 1].withExpense - 
                    results.monthlyData[0].withExpense < 0 
                      ? 'text-red-400' 
                      : 'text-green-400'
                  }`}>
                    {formatCurrency(
                      results.monthlyData[results.monthlyData.length - 1].withExpense - 
                      results.monthlyData[0].withExpense
                    )}
                  </span>
                </div>
              </div>
            </Card>
            
            <Card className="p-3 bg-finance-dark-lighter">
              <h4 className="text-sm text-gray-400 mb-2">Investimentos</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Valor Inicial:</span>
                  <span className="text-white font-medium">
                    {formatCurrency(results.monthlyData[0].investments)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Valor Final:</span>
                  <span className="text-amber-400 font-medium">
                    {formatCurrency(results.monthlyData[results.monthlyData.length - 1].investments)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Rendimento:</span>
                  <span className="text-green-400 font-medium">
                    {formatCurrency(
                      results.monthlyData[results.monthlyData.length - 1].investments - 
                      results.monthlyData[0].investments
                    )}
                  </span>
                </div>
              </div>
            </Card>
          </div>
          
          {/* Gráfico de barras para categoria de despesas */}
          <div>
            <h3 className="text-white font-medium mb-3 flex items-center">
              <span className="w-2 h-2 bg-finance-blue rounded-full mr-2 flex-shrink-0"></span>
              <span className="truncate">Comparativo de Despesas por Categoria</span>
            </h3>
            <div className="h-80 bg-finance-dark-lighter p-3 rounded-lg">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryData}
                  margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="name" stroke="#999" tickFormatter={(value) => value.length > 8 ? `${value.substring(0, 8)}...` : value} />
                  <YAxis stroke="#999" tickFormatter={(value) => formatCurrency(value).replace('R$', '')} />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="value" name="Valor" radius={[4, 4, 0, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="monthly" className="space-y-6">
          {/* Tabela detalhada - responsiva */}
          <div>
            <h3 className="text-white font-medium mb-3 flex items-center">
              <span className="w-2 h-2 bg-finance-blue rounded-full mr-2 flex-shrink-0"></span>
              <span className="truncate">Projeção Mensal Detalhada</span>
            </h3>
            <div className="overflow-x-auto bg-finance-dark-lighter p-2 rounded-lg shadow-inner">
              <table className="w-full border-collapse min-w-[600px]">
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
                    <tr key={index} className={`border-b border-gray-800 hover:bg-finance-dark transition-colors ${
                      month.withExpense < 0 ? 'bg-red-900/10' : ''
                    }`}>
                      <td className="px-4 py-3 text-sm text-white">{month.month}</td>
                      <td className="px-4 py-3 text-sm text-right text-green-400">{formatCurrency(month.balance)}</td>
                      <td className={`px-4 py-3 text-sm text-right ${month.withExpense < 0 ? 'text-red-400' : 'text-blue-400'}`}>
                        {formatCurrency(month.withExpense)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-amber-400">
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
          
          {/* Summary of table data */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3 bg-finance-dark-lighter">
              <h4 className="text-sm text-gray-400 mb-2">Meses Positivos</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-300">Meses:</span>
                  <span className="text-white font-medium">
                    {results.monthlyData.filter(month => month.withExpense >= 0).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Percentual:</span>
                  <span className="text-green-400 font-medium">
                    {((results.monthlyData.filter(month => month.withExpense >= 0).length / 
                      results.monthlyData.length) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </Card>
            
            <Card className="p-3 bg-finance-dark-lighter">
              <h4 className="text-sm text-gray-400 mb-2">Meses Negativos</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-300">Meses:</span>
                  <span className="text-white font-medium">
                    {results.monthlyData.filter(month => month.withExpense < 0).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Percentual:</span>
                  <span className="text-red-400 font-medium">
                    {((results.monthlyData.filter(month => month.withExpense < 0).length / 
                      results.monthlyData.length) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
        <Button 
          onClick={onGoToSimulation}
          variant="outline"
          className="bg-finance-dark-lighter border-finance-dark text-white hover:bg-finance-dark transition-colors"
        >
          <Calculator className="w-4 h-4 mr-2 flex-shrink-0" />
          Nova Simulação
        </Button>
        
        <Button 
          className="bg-finance-blue hover:bg-finance-blue/80 text-white transition-colors mt-2 sm:mt-0"
          onClick={() => navigate('/cashflow')}
        >
          <ArrowUpDown className="w-4 h-4 mr-2 flex-shrink-0" />
          Ver Fluxo de Caixa
        </Button>
      </div>
    </Card>
  );
};

export default DetailedOverview;
