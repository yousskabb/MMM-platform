# Date Handling in MMM Platform

## Overview
This document explains how dates are handled throughout the MMM platform project.

## 1. Date Sources

### Excel File
- **Location**: `public/data/data.xlsx`
- **Sheets**: "Investments" and "Contributions"
- **Date Column**: "Dates" (contains Excel serial numbers or date strings)

## 2. Date Parsing Flow

### Step 1: Excel Parsing (`excelParser.ts`)
```typescript
// Excel dates can be:
// 1. Excel serial numbers (e.g., 43835)
// 2. Date strings (e.g., "05/01/2020 00:00:00")
// 3. ISO strings (e.g., "2020-01-05")

function parseDate(dateValue: any): Date {
    // Convert Excel serial numbers to JavaScript dates
    if (typeof dateValue === 'number') {
        const excelEpoch = new Date(1900, 0, 1);
        const daysSinceEpoch = dateValue - 2; // Excel leap year correction
        const date = new Date(excelEpoch.getTime() + daysSinceEpoch * 24 * 60 * 60 * 1000);
        return date;
    }
    
    // Handle string dates
    if (str.includes(' ')) {
        const datePart = str.split(' ')[0]; // Take only date part
        return new Date(datePart);
    }
    
    return new Date(str);
}
```

### Step 2: Data Structure
```typescript
interface WeeklyData {
    date: Date;        // Parsed JavaScript Date object
    [variable: string]: number | Date; // Variable values + date
}
```

## 3. Date Filtering Flow

### Step 1: Filter Bar (`FilterBar.tsx`)
```typescript
// User selects dates in the UI
const handleStartDateChange = (date: Date | null) => {
    onFilterChange({
        ...filters,
        dateRange: {
            startDate: date,    // JavaScript Date object
            endDate: filters.dateRange.endDate
        }
    });
};
```

### Step 2: Layout Component (`Layout.tsx`)
```typescript
// Filters are passed to all tab components
const { channelData, contributions } = filterData(
    filters.dateRange.startDate, 
    filters.dateRange.endDate
);
```

### Step 3: Data Service (`dataService.ts`)
```typescript
export function filterData(startDate: Date, endDate: Date): FilteredData {
    // Filter investment and contribution data by date range
    const filteredInvestments = filterDataByDateRange(cachedData.investments, startDate, endDate);
    const filteredContributions = filterDataByDateRange(cachedData.contributions, startDate, endDate);
    
    // ... rest of processing
}
```

### Step 4: Date Range Filtering (`excelParser.ts`)
```typescript
export function filterDataByDateRange(
    data: WeeklyData[],
    startDate: Date,
    endDate: Date
): WeeklyData[] {
    // Normalize dates to compare only date part (without time)
    const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    
    return data.filter(item => {
        const itemDateOnly = new Date(item.date.getFullYear(), item.date.getMonth(), item.date.getDate());
        return itemDateOnly >= startDateOnly && itemDateOnly <= endDateOnly;
    });
}
```

## 4. Available Dates Generation

### Step 1: Get Available Dates (`dataService.ts`)
```typescript
export function getAvailableDates(): Date[] {
    if (!cachedData) return [];
    
    const allDates = new Set<string>();
    
    // Collect dates from both investments and contributions
    cachedData.investments.forEach(row => {
        if (row.date) {
            allDates.add(row.date.toISOString().split('T')[0]); // YYYY-MM-DD format
        }
    });
    
    cachedData.contributions.forEach(row => {
        if (row.date) {
            allDates.add(row.date.toISOString().split('T')[0]);
        }
    });
    
    // Convert back to Date objects and sort
    return Array.from(allDates)
        .map(dateStr => new Date(dateStr))
        .sort((a, b) => a.getTime() - b.getTime());
}
```

### Step 2: Date Picker Constraints (`FilterBar.tsx`)
```typescript
// Only dates with data in Excel are selectable
<DatePicker
    selected={filters.dateRange.startDate}
    onChange={handleStartDateChange}
    includeDates={availableDates}  // Only Excel dates are selectable
    maxDate={filters.dateRange.endDate}
    inline
/>
```

## 5. Date Comparison Issues

### Potential Problems:

1. **Time Component Issues**: 
   - Excel dates might have time components
   - JavaScript Date objects might have different time zones
   - Solution: Normalize to date-only comparison

2. **Excel Serial Number Conversion**:
   - Excel serial numbers need special handling
   - Excel's leap year bug requires correction (-2 days)

3. **String Date Parsing**:
   - Different date formats in Excel
   - Time components in date strings

## 6. Debug Information

### Console Logs Added:
```typescript
console.log('Filtering data by date range:', {
    startDate: startDateOnly.toISOString().split('T')[0],
    endDate: endDateOnly.toISOString().split('T')[0],
    totalDataPoints: data.length,
    firstDataPoint: data[0]?.date.toISOString().split('T')[0],
    lastDataPoint: data[data.length - 1]?.date.toISOString().split('T')[0]
});
```

## 7. Current Issue

The problem is likely in the date comparison logic. Let's check:

1. **Are the Excel dates being parsed correctly?**
2. **Are the filter dates being normalized correctly?**
3. **Is the comparison logic working as expected?**

## 8. Next Steps

1. Check the Data tab to see what dates are actually being filtered
2. Check console logs to see the date filtering process
3. Verify that the end date is being included in the comparison

## 9. Key Files

- `src/utils/excelParser.ts` - Date parsing and filtering
- `src/data/dataService.ts` - Data management and filtering
- `src/components/layout/FilterBar.tsx` - Date picker UI
- `src/components/layout/Layout.tsx` - Filter state management
- `src/components/tabs/DataTab.tsx` - Debug data display
