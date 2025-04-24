import React from 'react';
import { useFilters } from '../../hooks/useFilters';

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className = '' }) => {
  const { filters, setFilters } = useFilters();
  
  return (
    <header className={`bg-white border-b border-slate-200 px-6 py-4 ${className}`}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Marketing Performance Dashboard</h1>
        <div className="flex items-center gap-4">
          {/* Filter controls would go here */}
          <div className="text-sm text-gray-500">
            {filters.date && `Date: ${filters.date}`}
            {filters.campaign && ` | Campaign: ${filters.campaign}`}
            {filters.channel && ` | Channel: ${filters.channel}`}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 