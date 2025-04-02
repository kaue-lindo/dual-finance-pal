
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  BarChart2,
  ChartPie,
  Users,
  Wallet,
  LineChart,
  CalendarClock
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const QuickActions = ({ trigger }: { trigger: React.ReactNode }) => {
  const navigate = useNavigate();

  const menuItems = [
    {
      label: 'Adicionar Despesa',
      icon: <CreditCard className="w-4 h-4 mr-2" />,
      path: '/expenses',
      color: 'text-red-400'
    },
    {
      label: 'Adicionar Receita',
      icon: <DollarSign className="w-4 h-4 mr-2" />,
      path: '/add-income',
      color: 'text-green-400'
    },
    {
      label: 'Investimentos',
      icon: <TrendingUp className="w-4 h-4 mr-2" />,
      path: '/investments',
      color: 'text-finance-blue'
    },
    {
      label: 'Fluxo de Caixa',
      icon: <LineChart className="w-4 h-4 mr-2" />,
      path: '/cash-flow',
      color: 'text-purple-400'
    },
    {
      label: 'Rendimentos',
      icon: <ChartPie className="w-4 h-4 mr-2" />,
      path: '/investment-returns',
      color: 'text-yellow-400'
    },
    {
      label: 'Transações Futuras',
      icon: <CalendarClock className="w-4 h-4 mr-2" />,
      path: '/future-transactions',
      color: 'text-orange-400'
    },
    {
      label: 'Simulador',
      icon: <BarChart2 className="w-4 h-4 mr-2" />,
      path: '/simulator',
      color: 'text-indigo-400'
    },
    {
      label: 'Comparação',
      icon: <Users className="w-4 h-4 mr-2" />,
      path: '/user-comparison',
      color: 'text-pink-400'
    }
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-finance-dark-card border-finance-dark-lighter">
        <div className="py-2 px-3">
          <h3 className="text-sm font-medium text-gray-300">Ações Rápidas</h3>
        </div>
        <DropdownMenuSeparator className="bg-gray-700" />
        {menuItems.map((item, index) => (
          <DropdownMenuItem 
            key={index}
            className="focus:bg-finance-dark-lighter cursor-pointer py-2"
            onClick={() => navigate(item.path)}
          >
            <div className={`flex items-center ${item.color}`}>
              {item.icon}
              {item.label}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default QuickActions;
