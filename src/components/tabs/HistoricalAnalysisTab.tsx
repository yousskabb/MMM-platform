import React from 'react';
import { LineChart as LineChartIcon } from 'lucide-react';
import { FilterState } from '../../types';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { getCachedData, isDataLoaded } from '../../data/dataService';
import { formatNumberAxis, formatNumberDetailed } from '../../utils/numberFormatter';
import { getVariableColors } from '../../utils/colorGenerator';

interface HistoricalAnalysisTabProps {
  filters: FilterState;
}

interface MonthlyData {
  month: string;
  base: number;
  sales: number;
  [key: string]: number | string;
}

const HistoricalAnalysisTab: React.FC<HistoricalAnalysisTabProps> = ({ filters }) => {
  // Check if data is loaded before trying to use it
  if (!isDataLoaded()) {
    return (
      <div className="text-center py-12">
        <div className="text-slate-500">Loading data...</div>
      </div>
    );
  }

  const data = getCachedData();
  if (!data) {
    return (
      <div className="text-center py-12">
        <div className="text-slate-500">No data available</div>
      </div>
    );
  }

  // Get all contributions data (not filtered by year)
  const allContributions = data.contributions;
  
  // Get all variables except 'sales' and 'base' for contribution calculation
  const contributionVariables = data.variables.filter(v => v !== 'sales' && v !== 'base');
  
  // Get variable colors
  const variableColors = getVariableColors(contributionVariables);
  
  // Aggregate weekly data into monthly data
  const monthlyData: MonthlyData[] = [];
  const monthlyMap = new Map<string, MonthlyData>();

  allContributions.forEach(week => {
    const monthKey = `${week.date.getFullYear()}-${String(week.date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = week.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, {
        month: monthName,
        base: 0,
        sales: 0,
        ...Object.fromEntries(contributionVariables.map(v => [v, 0]))
      });
    }
    
    const monthData = monthlyMap.get(monthKey)!;
    
    // Sum up base and sales
    monthData.base += (week.base as number || 0);
    monthData.sales += (week.sales as number || 0);
    
    // Add individual variable contributions
    contributionVariables.forEach(variable => {
      monthData[variable] = (monthData[variable] as number) + (week[variable] as number || 0);
    });
  });

  // Convert map to array and sort by date
  monthlyData.push(...Array.from(monthlyMap.values()));
  monthlyData.sort((a, b) => {
    const [yearA, monthA] = a.month.split(' ')[1] === 'Jan' ? [a.month.split(' ')[1], '01'] : [a.month.split(' ')[1], String(new Date(a.month).getMonth() + 1).padStart(2, '0')];
    const [yearB, monthB] = b.month.split(' ')[1] === 'Jan' ? [b.month.split(' ')[1], '01'] : [b.month.split(' ')[1], String(new Date(b.month).getMonth() + 1).padStart(2, '0')];
    return yearA.localeCompare(yearB) || monthA.localeCompare(monthB);
  });

  // Calculate yearly totals for the 3 curves chart
  const yearlyTotals: { year: number; totalSales: number; totalContribution: number; totalInvestment: number }[] = [];
  const yearlyMap = new Map<number, { totalSales: number; totalContribution: number; totalInvestment: number }>();

  // Process contributions data
  allContributions.forEach(week => {
    const year = week.date.getFullYear();
    
    if (!yearlyMap.has(year)) {
      yearlyMap.set(year, { totalSales: 0, totalContribution: 0, totalInvestment: 0 });
    }
    
    const yearData = yearlyMap.get(year)!;
    
    // Sum sales
    yearData.totalSales += (week.sales as number || 0);
    
    // Sum all contribution variables
    const weekContribution = contributionVariables.reduce((sum, variable) => {
      return sum + (week[variable] as number || 0);
    }, 0);
    yearData.totalContribution += weekContribution;
  });

  // Process investments data
  const allInvestments = data.investments;
  allInvestments.forEach(week => {
    const year = week.date.getFullYear();
    
    if (!yearlyMap.has(year)) {
      yearlyMap.set(year, { totalSales: 0, totalContribution: 0, totalInvestment: 0 });
    }
    
    const yearData = yearlyMap.get(year)!;
    
    // Sum all investment variables
    const weekInvestment = contributionVariables.reduce((sum, variable) => {
      return sum + (week[variable] as number || 0);
    }, 0);
    yearData.totalInvestment += weekInvestment;
  });

  // Convert to array and sort by year
  yearlyTotals.push(...Array.from(yearlyMap.entries()).map(([year, data]) => ({
    year,
    ...data
  })));
  yearlyTotals.sort((a, b) => a.year - b.year);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <LineChartIcon size={24} className="text-blue-600" />
        <h1 className="text-2xl font-semibold text-slate-800">Historical Analysis</h1>
      </div>

      {/* Yearly Totals Chart */}
      <div className="card">
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          <LineChartIcon size={18} className="text-primary-600" />
          Yearly Performance Overview (All Years)
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={yearlyTotals}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={(value) => formatNumberAxis(value)}
                tick={{ fontSize: 11 }}
                width={60}
              />
              <Tooltip
                formatter={(value, name) => [formatNumberDetailed(value as number), name]}
                labelFormatter={(label) => `Year: ${label}`}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '8px'
                }}
              />
              <Legend />

              {/* Total Sales line */}
              <Line
                type="monotone"
                dataKey="totalSales"
                stroke="#000000"
                strokeWidth={3}
                dot={{ fill: '#000000', strokeWidth: 2, r: 4 }}
                name="Total Sales"
              />

              {/* Total Contribution line */}
              <Line
                type="monotone"
                dataKey="totalContribution"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                name="Total Contribution"
              />

              {/* Total Investment line */}
              <Line
                type="monotone"
                dataKey="totalInvestment"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                name="Total Investment"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          <LineChartIcon size={18} className="text-primary-600" />
          Monthly Contribution Trends (All Years)
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={monthlyData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tickFormatter={(value) => value}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={(value) => formatNumberAxis(value)}
                tick={{ fontSize: 11 }}
                width={60}
              />
              <Tooltip
                formatter={(value, name) => [formatNumberDetailed(value as number), name]}
                labelFormatter={(label) => `Month: ${label}`}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '8px'
                }}
              />
              <Legend />

              {/* Base area at the bottom */}
              <Area
                type="monotone"
                dataKey="base"
                stackId="1"
                stroke="#9CA3AF"
                fill="#9CA3AF"
                name="Base"
              />

              {/* Add area for each variable */}
              {contributionVariables.map((variable, index) => (
                <Area
                  key={variable}
                  type="monotone"
                  dataKey={variable}
                  stackId="1"
                  stroke={variableColors[variable]}
                  fill={variableColors[variable]}
                  name={variable}
                />
              ))}

              {/* Sales line on top - black dotted line */}
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#000000"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Total Sales"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default HistoricalAnalysisTab;
