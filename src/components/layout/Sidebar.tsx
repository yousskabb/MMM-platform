import React from 'react';
import { BarChart, ChevronLeft } from 'lucide-react';

interface TabConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: TabConfig[];
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, tabs }) => {
  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <BarChart className="text-primary-600" size={24} />
          <h1 className="text-xl font-semibold text-slate-800">MMM Dashboard</h1>
        </div>
      </div>
      
      <div className="flex-1 py-6">
        <nav className="px-2">
          <ul className="space-y-1">
            {tabs.map((tab) => (
              <li key={tab.id}>
                <button
                  onClick={() => onTabChange(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className={activeTab === tab.id ? 'text-primary-600' : 'text-slate-500'}>
                    {tab.icon}
                  </span>
                  <span className="font-medium">{tab.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center gap-2 text-slate-500 hover:text-slate-700 cursor-pointer">
          <ChevronLeft size={18} />
          <span className="text-sm font-medium">Hide navigation</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;