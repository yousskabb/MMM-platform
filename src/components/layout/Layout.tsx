import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import FilterBar from './FilterBar';
import { FilterState } from '../../types';
import { Activity, BarChart3, PieChart, LineChart, MessageCircle, Calculator, TrendingUp, Loader2 } from 'lucide-react';
import RecapTab from '../tabs/RecapTab';
import SynergiesTab from '../tabs/SynergiesTab';
import ROITab from '../tabs/ROITab';
import BudgetPlanningTab from '../tabs/BudgetPlanningTab';
import SimulationsTab from '../tabs/SimulationsTab';
import ChatTab from '../tabs/ChatTab';
import ResponseCurvesTab from '../tabs/ResponseCurvesTab';
import { loadExcelData, getAvailableDateRange, isDataLoaded, isDataLoading } from '../../data/dataService';
import DebugExcel from '../DebugExcel';

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
    brand: 'Dior',
    dateRange: {
      startDate: new Date(2023, 0, 1),
      endDate: new Date(2023, 11, 31)
    }
  });
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  // Load Excel data on component mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        setError(null);

        await loadExcelData();

        // Update filters with available date range from Excel
        const availableRange = getAvailableDateRange();
        if (availableRange) {
          setFilters(prev => ({
            ...prev,
            dateRange: {
              startDate: availableRange.min,
              endDate: availableRange.max
            }
          }));
        }

        setDataLoaded(true);
      } catch (err) {
        console.error('Failed to load Excel data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

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

  // Show loading state
  if (loading) {
    return (
      <div className="flex h-screen bg-slate-50 items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-600" />
          <p className="text-lg font-medium text-slate-700">Loading Excel data...</p>
          <p className="text-sm text-slate-500 mt-2">Please wait while we parse your data</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex h-screen bg-slate-50 items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Failed to Load Data</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <p className="text-sm text-slate-600">
              Please ensure the Excel file exists at <code className="bg-slate-100 px-2 py-1 rounded">data/data.xlsx</code>
              and contains the required "Investments" and "Contributions" sheets.
            </p>
            <div className="mt-4 p-3 bg-gray-100 rounded text-left">
              <p className="text-sm font-semibold">Debug Info:</p>
              <p className="text-xs">Loading: {loading ? 'Yes' : 'No'}</p>
              <p className="text-xs">Data Loaded: {dataLoaded ? 'Yes' : 'No'}</p>
              <p className="text-xs">Current URL: {window.location.href}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-800">Debug Information</h3>
              <p className="text-sm text-yellow-700">Loading: {loading ? 'Yes' : 'No'} | Data Loaded: {dataLoaded ? 'Yes' : 'No'} | Error: {error || 'None'}</p>
            </div>
            <DebugExcel />
            {dataLoaded && !loading ? renderTabContent() : (
              <div className="text-center py-12">
                <p className="text-slate-500">Data is being prepared...</p>
                <p className="text-sm text-slate-400 mt-2">Loading Excel data...</p>
              </div>
            )}
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