import React from 'react';

interface TabItem {
  id: string;
  label: string;
}

interface TabNavProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

const TabNav: React.FC<TabNavProps> = ({ 
  tabs, 
  activeTab, 
  onTabChange,
  className = '' 
}) => {
  return (
    <div className={`border-b border-slate-200 ${className}`}>
      <div className="flex space-x-4 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`py-3 px-1 border-b-2 transition-colors whitespace-nowrap text-sm font-medium ${
              activeTab === tab.id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TabNav;