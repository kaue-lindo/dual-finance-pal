import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { ChartContainer } from '@/components/ui/chart';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface SimulationData {
  installmentValue: number;
  startDate: Date;
  duration: number;
}

const SimulationPage = () => {
  const [simulation, setSimulation] = useState<SimulationData>({
    installmentValue: 0,
    startDate: new Date(),
    duration: 12,
  });
  const { toast } = useToast();

  const handleSaveSimulation = () => {
    // Aqui você implementará a lógica para salvar a simulação
    toast({
      title: "Simulação salva",
      description: "Sua simulação foi salva com sucesso!",
    });
  };

  const calculateMonthlyImpact = () => {
    const months = [];
    let currentDate = simulation.startDate;
    
    for (let i = 0; i < simulation.duration; i++) {
      months.push({
        date: format(currentDate, 'MMM yyyy', { locale: ptBR }),
        value: simulation.installmentValue,
      });
      currentDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
    }
    
    return months;
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Valor da Parcela em Destaque */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Simulação de Parcelas</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Valor da Parcela
            </label>
            <Input
              type="number"
              value={simulation.installmentValue}
              onChange={(e) => setSimulation({
                ...simulation,
                installmentValue: parseFloat(e.target.value) || 0
              })}
              className="text-xl font-bold"
              placeholder="R$ 0,00"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Data de Início
            </label>
            <Calendar
              mode="single"
              selected={simulation.startDate}
              onSelect={(date) => date && setSimulation({
                ...simulation,
                startDate: date
              })}
              className="rounded-md border"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Duração (meses)
            </label>
            <Input
              type="number"
              value={simulation.duration}
              onChange={(e) => setSimulation({
                ...simulation,
                duration: parseInt(e.target.value) || 12
              })}
              min={1}
              max={120}
            />
          </div>

          <Button 
            onClick={handleSaveSimulation}
            className="w-full"
          >
            Salvar Simulação
          </Button>
        </div>
      </Card>

      {/* Gráfico de Impacto Mensal */}
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">Impacto Mensal</h3>
        <div className="w-full h-[300px]">
          <BarChart
            width={500}
            height={300}
            data={calculateMonthlyImpact()}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#3B82F6" />
          </BarChart>
        </div>
      </Card>
    </div>
  );
};

export default SimulationPage;
