
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, ArrowUpDown, Plus, TrendingUp, Calculator, Settings } from 'lucide-react';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Simplificada a lógica de verificação de rotas ativas
  const isActive = (path: string) => {
    if (path === '/dashboard' && location.pathname === '/dashboard') return true;
    if (path === '/user-comparison' && location.pathname === '/user-comparison') return true;
    if (path === '/transactions' && location.pathname.includes('/transactions')) return true;
    if (path === '/expenses' && location.pathname === '/expenses') return true;
    if (path === '/cashflow' && location.pathname === '/cashflow') return true;
    if (path === '/add-transaction' && (
      location.pathname === '/add-transaction' || location.pathname === '/add-income'
    )) return true;
    if (path === '/investments' && (
      location.pathname === '/investments' || location.pathname === '/investment-returns'
    )) return true;
    if (path === '/simulator' && (
      location.pathname === '/simulator' || location.pathname === '/simulation-page'
    )) return true;
    if (path === '/settings' && location.pathname === '/settings') return true;
    return false;
  };
  
  return (
    <nav className="glass-nav fixed bottom-0 left-0 right-0 h-16 bg-finance-dark-card border-t border-gray-800 flex justify-around items-center z-50">
      <button
        onClick={() => navigate('/dashboard')}
        className={`flex flex-col items-center justify-center w-full h-full ${
          isActive('/dashboard') ? 'text-finance-blue' : 'text-gray-400'
        }`}
      >
        <Home size={20} />
        <span className="text-xs mt-1">Início</span>
      </button>
      
      <button
        onClick={() => navigate('/user-comparison')}
        className={`flex flex-col items-center justify-center w-full h-full ${
          isActive('/user-comparison') ? 'text-finance-blue' : 'text-gray-400'
        }`}
      >
        <Users size={20} />
        <span className="text-xs mt-1">Comparar</span>
      </button>

      <button
        onClick={() => navigate('/transactions')}
        className={`flex flex-col items-center justify-center w-full h-full ${
          isActive('/transactions') ? 'text-finance-blue' : 'text-gray-400'
        }`}
      >
        <ArrowUpDown size={20} />
        <span className="text-xs mt-1">Transações</span>
      </button>
      
      <button
        onClick={() => navigate('/add-transaction')}
        className={`flex flex-col items-center justify-center w-full h-full ${
          isActive('/add-transaction') ? 'text-finance-blue' : 'text-gray-400'
        }`}
      >
        <Plus size={20} className="bg-finance-blue text-white p-1 rounded-full" />
        <span className="text-xs mt-1">Adicionar</span>
      </button>
      
      <button
        onClick={() => navigate('/investments')}
        className={`flex flex-col items-center justify-center w-full h-full ${
          isActive('/investments') ? 'text-finance-blue' : 'text-gray-400'
        }`}
      >
        <TrendingUp size={20} />
        <span className="text-xs mt-1">Investir</span>
      </button>
      
      <button
        onClick={() => navigate('/cashflow')}
        className={`flex flex-col items-center justify-center w-full h-full ${
          isActive('/cashflow') ? 'text-finance-blue' : 'text-gray-400'
        }`}
      >
        <Calculator size={20} />
        <span className="text-xs mt-1">Fluxo</span>
      </button>
      
      <button
        onClick={() => navigate('/settings')}
        className={`flex flex-col items-center justify-center w-full h-full ${
          isActive('/settings') ? 'text-finance-blue' : 'text-gray-400'
        }`}
      >
        <Settings size={20} />
        <span className="text-xs mt-1">Config</span>
      </button>
    </nav>
  );
};

export default BottomNav;
