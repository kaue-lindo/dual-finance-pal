
import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calculator, Repeat, TrendingUp, CalendarIcon, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { SimulationData, FinancialSummary } from './types';
import { formatCurrency } from '@/context/finance/utils/formatting';

interface SimulationFormProps {
  simulationData: SimulationData;
  updateSimulationData: (data: Partial<SimulationData>) => void;
  financialSummary: FinancialSummary;
  onSimulate: () => void;
}

const SimulationForm: React.FC<SimulationFormProps> = ({
  simulationData,
  updateSimulationData,
  financialSummary,
  onSimulate
}) => {
  return (
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
            value={simulationData.description}
            onChange={(e) => updateSimulationData({ description: e.target.value })}
            placeholder="Ex: Novo Smartphone"
            className="finance-input mt-1"
          />
        </div>

        <div>
          <Label htmlFor="simulationCategory" className="text-white">Categoria</Label>
          <Select
            value={simulationData.category}
            onValueChange={(value) => updateSimulationData({ category: value })}
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
              value={simulationData.amount}
              onChange={(e) => updateSimulationData({ amount: e.target.value })}
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
              variant={simulationData.isRecurring ? "default" : "outline"}
              size="sm"
              className={`mr-2 ${simulationData.isRecurring ? "bg-finance-blue" : "bg-finance-dark-lighter text-gray-400"}`}
              onClick={() => updateSimulationData({ isRecurring: true })}
            >
              Sim
            </Button>
            <Button 
              variant={!simulationData.isRecurring ? "default" : "outline"}
              size="sm"
              className={`${!simulationData.isRecurring ? "bg-finance-blue" : "bg-finance-dark-lighter text-gray-400"}`}
              onClick={() => updateSimulationData({ isRecurring: false })}
            >
              Não
            </Button>
          </div>
        </div>

        {simulationData.isRecurring ? (
          <div>
            <Label className="text-white">Tipo de Recorrência</Label>
            <Select
              value={simulationData.recurringType}
              onValueChange={(value) => updateSimulationData({ recurringType: value as 'monthly' | 'weekly' })}
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
              value={simulationData.installments}
              onValueChange={(value) => updateSimulationData({ installments: value })}
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

            {simulationData.installments === 'custom' && (
              <div className="mt-2">
                <Label htmlFor="customInstallments" className="text-white">Número de Parcelas</Label>
                <Input
                  id="customInstallments"
                  type="number"
                  value={simulationData.customInstallments}
                  onChange={(e) => updateSimulationData({ customInstallments: e.target.value })}
                  placeholder="Digite o número de parcelas"
                  className="finance-input mt-1"
                  min="1"
                />
              </div>
            )}
          </div>
        )}

        <div>
          <Label htmlFor="simulationMonths" className="text-white flex items-center gap-1">
            <BarChart3 size={16} className="text-finance-blue" />
            <span>Período de Simulação</span>
          </Label>
          <Select
            value={simulationData.simulationMonths?.toString() || "6"}
            onValueChange={(value) => updateSimulationData({ simulationMonths: parseInt(value) })}
          >
            <SelectTrigger className="finance-input mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-finance-dark-lighter border-finance-dark">
              <SelectItem value="3">3 meses</SelectItem>
              <SelectItem value="6">6 meses</SelectItem>
              <SelectItem value="12">12 meses</SelectItem>
              <SelectItem value="18">18 meses</SelectItem>
              <SelectItem value="24">24 meses</SelectItem>
              <SelectItem value="36">36 meses</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-white">Data Inicial</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full finance-input mt-1 flex justify-between items-center"
              >
                {simulationData.date ? format(simulationData.date, 'dd/MM/yyyy') : 'Selecione uma data'}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-finance-dark-lighter border-finance-dark" align="start">
              <Calendar
                mode="single"
                selected={simulationData.date}
                onSelect={(date) => updateSimulationData({ date })}
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
              variant={simulationData.useInvestments ? "default" : "outline"}
              size="sm"
              className={`mr-2 ${simulationData.useInvestments ? "bg-finance-blue" : "bg-finance-dark-lighter text-gray-400"}`}
              onClick={() => updateSimulationData({ useInvestments: true })}
            >
              Sim
            </Button>
            <Button 
              variant={!simulationData.useInvestments ? "default" : "outline"}
              size="sm"
              className={`${!simulationData.useInvestments ? "bg-finance-blue" : "bg-finance-dark-lighter text-gray-400"}`}
              onClick={() => updateSimulationData({ useInvestments: false })}
            >
              Não
            </Button>
          </div>
        </div>

        <Button 
          onClick={onSimulate}
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
            <span className="text-white font-medium">{formatCurrency(financialSummary.currentBalance)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Entrada Mensal:</span>
            <span className="text-green-400 font-medium">{formatCurrency(financialSummary.monthlyIncome)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Gastos Mensais:</span>
            <span className="text-red-400 font-medium">{formatCurrency(financialSummary.monthlyExpenses)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Investimentos:</span>
            <span className="text-amber-400 font-medium">{formatCurrency(financialSummary.totalInvestments)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SimulationForm;
