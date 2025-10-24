import React from 'react';
import { FilterState, Country, Brand } from '../../types';
import { Filter } from 'lucide-react';
import { getAvailableYears } from '../../data/dataService';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

const countries: Country[] = ['France'];
const brands: Brand[] = ['Dior'];

const FilterBar: React.FC<FilterBarProps> = ({ filters, onFilterChange }) => {
  // Get available years from Excel data
  const availableYears = getAvailableYears();

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

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({
      ...filters,
      selectedYear: parseInt(e.target.value)
    });
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

        {/* Year Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="year" className="text-sm font-medium text-slate-700">Year:</label>
          <select
            id="year"
            className="select text-sm min-w-32"
            value={filters.selectedYear}
            onChange={handleYearChange}
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
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