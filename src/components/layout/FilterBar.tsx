import React, { useState, useEffect, useRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FilterState, Country, Brand } from '../../types';
import { Filter, Calendar } from 'lucide-react';
import { getAvailableDates } from '../../data/dataService';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

const countries: Country[] = ['France'];
const brands: Brand[] = ['Dior'];

const FilterBar: React.FC<FilterBarProps> = ({ filters, onFilterChange }) => {
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const startDatePickerRef = useRef<HTMLDivElement>(null);
  const endDatePickerRef = useRef<HTMLDivElement>(null);

  // Get available dates from Excel data
  const availableDates = getAvailableDates();

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

  const handleStartDateChange = (date: Date | null) => {
    if (date) {
      onFilterChange({
        ...filters,
        dateRange: {
          startDate: date,
          endDate: filters.dateRange.endDate
        }
      });
      setShowStartDatePicker(false);
    }
  };

  const handleEndDateChange = (date: Date | null) => {
    if (date) {
      onFilterChange({
        ...filters,
        dateRange: {
          startDate: filters.dateRange.startDate,
          endDate: date
        }
      });
      setShowEndDatePicker(false);
    }
  };

  // Close date pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (startDatePickerRef.current && !startDatePickerRef.current.contains(event.target as Node)) {
        setShowStartDatePicker(false);
      }
      if (endDatePickerRef.current && !endDatePickerRef.current.contains(event.target as Node)) {
        setShowEndDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

        {/* Start Date Picker */}
        <div className="relative" ref={startDatePickerRef}>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">Start Date:</label>
            <button
              onClick={() => setShowStartDatePicker(!showStartDatePicker)}
              className="flex items-center gap-1 px-3 py-2 text-sm border border-slate-300 rounded-md bg-white hover:bg-slate-50"
            >
              <Calendar size={16} />
              <span>{filters.dateRange.startDate.toLocaleDateString()}</span>
            </button>
          </div>

          {showStartDatePicker && (
            <div className="absolute z-10 mt-1 right-0 bg-white border border-slate-200 rounded-md shadow-dropdown p-2">
              <DatePicker
                selected={filters.dateRange.startDate}
                onChange={handleStartDateChange}
                includeDates={availableDates}
                maxDate={filters.dateRange.endDate}
                inline
                calendarStartDay={1}
              />
            </div>
          )}
        </div>

        {/* End Date Picker */}
        <div className="relative" ref={endDatePickerRef}>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">End Date:</label>
            <button
              onClick={() => setShowEndDatePicker(!showEndDatePicker)}
              className="flex items-center gap-1 px-3 py-2 text-sm border border-slate-300 rounded-md bg-white hover:bg-slate-50"
            >
              <Calendar size={16} />
              <span>{filters.dateRange.endDate.toLocaleDateString()}</span>
            </button>
          </div>

          {showEndDatePicker && (
            <div className="absolute z-10 mt-1 right-0 bg-white border border-slate-200 rounded-md shadow-dropdown p-2">
              <DatePicker
                selected={filters.dateRange.endDate}
                onChange={handleEndDateChange}
                includeDates={availableDates}
                minDate={filters.dateRange.startDate}
                inline
                calendarStartDay={1}
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