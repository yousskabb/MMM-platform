import React, { useState } from 'react';
import Sidebar from './Sidebar';
import FilterBar from './FilterBar';
import { FilterState } from '../../types';
import { Activity, BarChart3, PieChart, LineChart, MessageCircle, Calculator, TrendingUp } from 'lucide-react';
import RecapTab from '../tabs/RecapTab';
import SynergiesTab from '../tabs/SynergiesTab';
import ROITab from '../tabs/ROITab';
import BudgetPlanningTab from '../tabs/BudgetPlanningTab';
import SimulationsTab from '../tabs/SimulationsTab';
import ChatTab from '../tabs/ChatTab';
import ResponseCurvesTab from '../tabs/ResponseCurvesTab';

type Tab = 'recap' | 'synergies' | 'roi' | 'budget' | 'simulations' | 'response' | 'chat';

interface TabConfig {
  id: Tab;
  label: string;
  icon: React.ReactNode;
}

const tabConfig: TabConfig[] = [
  { id: 'recap', label: 'Recap', icon: <Activity size={20} /> },
  { id: 'synergies', label: 'Synergies', icon: <LineChart size={20} /> },
  { id: 'roi', label: 'ROI', icon: <BarChart3 size={20} /> },
  { id: 'budget', label: 'Budget Planning', icon: <PieChart size={20} /> },
  { id: 'response', label: 'Response Curves', icon: <TrendingUp size={20} /> },
  { id: 'simulations', label: 'Simulations', icon: <Calculator size={20} /> },
  { id: 'chat', label: 'Chat with Your Data', icon: <MessageCircle size={20} /> },
];

const Layout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('recap');
  const [filters, setFilters] = useState<FilterState>({
    country: 'France',
    brand: 'Novotel',
    dateRange: {
      startDate: new Date(2023, 0, 1),
      endDate: new Date(2023, 11, 31)
    }
  });

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'recap':
        return <RecapTab filters={filters} />;
      case 'synergies':
        return <SynergiesTab filters={filters} />;
      case 'roi':
        return <ROITab filters={filters} />;
      case 'budget':
        return <BudgetPlanningTab filters={filters} />;
      case 'simulations':
        return <SimulationsTab filters={filters} />;
      case 'response':
        return <ResponseCurvesTab filters={filters} />;
      case 'chat':
        return <ChatTab filters={filters} />;
      default:
        return <RecapTab filters={filters} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={(tab: Tab) => handleTabChange(tab)} 
        tabs={tabConfig} 
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <FilterBar filters={filters} onFilterChange={handleFilterChange} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-screen-xl mx-auto">
            {renderTabContent()}
            <footer className="mt-8 text-center text-sm text-slate-500">
              © 2025 All rights reserved. Powered by eleven strategy.
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;