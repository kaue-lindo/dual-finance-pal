
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useFinance } from '@/context/FinanceContext';
import { format, addMonths } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, PieChart, BarChart3, LineChart as LineChartIcon, Calendar, TrendingUp, Info } from 'lucide-react';
import { BarChart, Bar, PieChart as RechartsPie, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer } from 'recharts';
import { getCategoryColor, formatCategoryName } from '@/utils/chartUtils';
import { calculateInvestmentGrowthForMonth } from '@/context/finance/utils/projections';
import BottomNav from '@/components/ui/bottom-nav';

const InvestmentReturns = () => {
  const { 
    currentUser, 
    finances, 
    getUserFinances,
    getTotalInvestments,
    getProjectedInvestmentReturn
  } = useFinance();
  const navigate = useNavigate();
  const [projectionMonths, setProjectionMonths] = useState(12);
  const [returnProjectionData, setReturnProjectionData] = useState<any[]>([]);
  const [totalInvested, setTotalInvested] = useState(0);
  const [totalProjectedReturn, setTotalProjectedReturn] = useState(0);
  const [activeChartTab, setActiveChartTab] = useState('projection');

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    prepareChartData();
  }, [currentUser, finances, projectionMonths]);

  const prepareChartData = () => {
    if (!currentUser) return;
    
    const userFinances = getUserFinances(currentUser.id);
    const investments = userFinances.investments || [];
    
    const totalInvestedAmount = investments.reduce((sum, investment) => sum + investment.amount, 0);
    setTotalInvested(totalInvestedAmount);
    
    const data = [];
    const today = new Date();

    let previousMonthTotalValue = totalInvestedAmount;

    for (let i = 0; i <= projectionMonths; i++) {
      const month = addMonths(today, i);
      const monthLabel = format(month, 'MMM/yy');
      
      let totalValue = 0;
      let monthlyReturns = 0;
      
      investments.forEach(investment => {
        const isPeriodMonthly = investment.period === 'monthly';
        const isCompound = investment.isCompound !== false;
        
        const value = calculateInvestmentGrowthForMonth(
          investment.amount,
          investment.rate,
          isPeriodMonthly,
          i,
          isCompound
        );
        
        totalValue += value;
      });
      
      if (i > 0) {
        monthlyReturns = totalValue - previousMonthTotalValue;
      }
      
      previousMonthTotalValue = totalValue;
      
      data.push({
        month: monthLabel,
        value: totalValue,
        principal: totalInvestedAmount,
        returns: totalValue - totalInvestedAmount,
        monthlyReturn: monthlyReturns
      });
    }
    
    setReturnProjectionData(data);
    
    const projectedReturn = data.length > 0 
      ? data[data.length - 1].value - totalInvestedAmount
      : 0;
    
    setTotalProjectedReturn(projectedReturn);
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
      <div className="finance-card rounded-b-xl">
        <div className="flex justify-between items-center mb-4 p-4">
          <Button variant="ghost" size="icon" className="navbar-icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-6 h-6 text-white" />
          </Button>
          <h1 className="text-xl font-bold text-white">Rendimentos</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="mt-6 px-4">
        <Card className="finance-card">
          <div className="space-y-4 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Rendimentos Projetados</h2>
                <p className="text-gray-400">Projeção para {projectionMonths} meses</p>
              </div>
            </div>

            <div className="flex justify-between items-end">
              <div>
                <p className="text-3xl font-bold text-white break-words">{formatCurrency(totalInvested)}</p>
                <p className="text-sm text-gray-400">Valor investido</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-500 break-words">
                  +{formatCurrency(totalProjectedReturn)}
                </p>
                <p className="text-xs text-gray-400">Rendimento projetado</p>
              </div>
            </div>
          </div>
        </Card>

        <Tabs value={activeChartTab} onValueChange={setActiveChartTab} className="mt-6">
          <TabsList className="grid grid-cols-2 bg-finance-dark-lighter">
            <TabsTrigger value="projection" className="flex items-center gap-2">
              <LineChartIcon className="w-4 h-4" />
              <span>Projeção</span>
            </TabsTrigger>
            <TabsTrigger value="details" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span>Detalhes</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="projection">
            <Card className="finance-card mt-4">
              <div className="p-4">
                <h2 className="text-lg font-semibold text-white mb-4">Projeção de Rendimentos</h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={returnProjectionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="month" stroke="#999" />
                      <YAxis stroke="#999" tickFormatter={(value) => `R$${value.toLocaleString()}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="principal" 
                        name="Principal" 
                        stroke="#6366F1" 
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        name="Valor Total" 
                        stroke="#10B981" 
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                        isAnimationActive={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="returns" 
                        name="Retornos" 
                        stroke="#8B5CF6" 
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                        isAnimationActive={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="monthlyReturn" 
                        name="Retornos Mensais" 
                        stroke="#F59E0B" 
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-6 p-3 bg-finance-dark-lighter rounded-lg">
                  <p className="text-gray-300 text-sm">
                    Esta projeção mostra como seus investimentos crescerão ao longo do tempo, considerando as taxas de retorno atuais.
                    O gráfico exibe o valor principal investido, o valor total acumulado, os retornos totais e os retornos mensais.
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="details">
            <Card className="finance-card mt-4">
              <div className="p-4">
                <h2 className="text-lg font-semibold text-white mb-4">Detalhes dos Investimentos</h2>
                {getUserFinances(currentUser?.id).investments?.length > 0 ? (
                  <div className="space-y-4">
                    {getUserFinances(currentUser?.id).investments.map((investment: any, index: number) => (
                      <div key={index} className="p-3 bg-finance-dark-lighter rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-white break-words">{investment.description}</h3>
                            <p className="text-sm text-gray-400">
                              {investment.period === 'monthly' ? 'Rendimento Mensal' : 'Rendimento Anual'} • 
                              {investment.isCompound ? ' Juros Compostos' : ' Juros Simples'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-bold break-words">{formatCurrency(investment.amount)}</p>
                            <p className="text-green-500 text-sm">
                              {investment.rate}% {investment.period === 'monthly' ? 'a.m.' : 'a.a.'}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Rendimento em 12 meses:</span>
                            <span className="text-green-500 font-medium break-words">
                              +{formatCurrency(calculateInvestmentGrowthForMonth(
                                investment.amount,
                                investment.rate,
                                investment.period === 'monthly',
                                12,
                                investment.isCompound
                              ) - investment.amount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Info className="w-12 h-12 mx-auto text-gray-500 mb-2" />
                    <p className="text-gray-400">Você ainda não possui investimentos cadastrados</p>
                    <Button 
                      className="mt-4 finance-btn"
                      onClick={() => navigate('/add-investment')}
                    >
                      Adicionar Investimento
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-center mt-6">
          <Button 
            className="finance-btn mr-3"
            onClick={() => navigate('/investments')}
          >
            <Calendar className="w-4 h-4 mr-1" />
            Meus Investimentos
          </Button>
          <Button 
            className="finance-btn-secondary"
            onClick={() => navigate('/add-investment')}
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            Novo Investimento
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default InvestmentReturns;
