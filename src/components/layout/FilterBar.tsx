import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FilterState, Country, Brand } from '../../types';
import { Filter, Calendar } from 'lucide-react';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

const countries: Country[] = ['USA', 'Canada', 'UK', 'Germany', 'France', 'Japan'];
const brands: Brand[] = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'];

const FilterBar: React.FC<FilterBarProps> = ({ filters, onFilterChange }) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({
      ...filters,
      country: e.target.value as Country
    });
  };
  
  const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({
      ...filters,
      brand: e.target.value as Brand
    });
  };
  
  const handleDateChange = (dateRange: [Date | null, Date | null]) => {
    const [start, end] = dateRange;
    if (start && end) {
      onFilterChange({
        ...filters,
        dateRange: {
          startDate: start,
          endDate: end
        }
      });
    }
  };
  
  return (
    <div className="bg-white border-b border-slate-200 py-3 px-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-1 text-primary-600">
        <Filter size={18} />
        <h2 className="text-sm font-medium">Filters:</h2>
      </div>
      
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="country" className="text-sm font-medium text-slate-700">Country:</label>
          <select
            id="country"
            className="select text-sm min-w-32"
            value={filters.country}
            onChange={handleCountryChange}
          >
            {countries.map((country) => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <label htmlFor="brand" className="text-sm font-medium text-slate-700">Brand:</label>
          <select
            id="brand"
            className="select text-sm min-w-32"
            value={filters.brand}
            onChange={handleBrandChange}
          >
            {brands.map((brand) => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
        </div>
        
        <div className="relative">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">Date Range:</label>
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-1 px-3 py-2 text-sm border border-slate-300 rounded-md bg-white hover:bg-slate-50"
            >
              <Calendar size={16} />
              <span>
                {filters.dateRange.startDate.toLocaleDateString()} - {filters.dateRange.endDate.toLocaleDateString()}
              </span>
            </button>
          </div>
          
          {showDatePicker && (
            <div className="absolute z-10 mt-1 right-0 bg-white border border-slate-200 rounded-md shadow-dropdown p-2">
              <DatePicker
                selected={filters.dateRange.startDate}
                onChange={handleDateChange}
                startDate={filters.dateRange.startDate}
                endDate={filters.dateRange.endDate}
                selectsRange
                inline
              />
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium">
          MM
        </div>
      </div>
    </div>
  );
};

export default FilterBar;