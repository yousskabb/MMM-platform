import React, { useState } from 'react';
import { LineChart as LineChartIcon, BarChart as BarChartIcon } from 'lucide-react';
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
  ResponsiveContainer,
  BarChart,
  Bar,
  LabelList,
  Cell
} from 'recharts';
import { getCachedData, isDataLoaded } from '../../data/dataService';
import { formatNumberAxis, formatNumberDetailed, formatNumber } from '../../utils/numberFormatter';
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
  const [selectedMetric, setSelectedMetric] = useState<'roi' | 'contribution' | 'investment'>('roi');
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

  // Calculate yearly performance by channel for the table
  const yearlyChannelData: { [year: number]: { [channel: string]: { investment: number; contribution: number; roi: number } } } = {};
  const availableYears = yearlyTotals.map(y => y.year);

  // Initialize yearly channel data
  availableYears.forEach(year => {
    yearlyChannelData[year] = {};
    contributionVariables.forEach(variable => {
      yearlyChannelData[year][variable] = { investment: 0, contribution: 0, roi: 0 };
    });
  });

  // Process contributions data by year and channel
  allContributions.forEach(week => {
    const year = week.date.getFullYear();
    if (yearlyChannelData[year]) {
      contributionVariables.forEach(variable => {
        yearlyChannelData[year][variable].contribution += (week[variable] as number || 0);
      });
    }
  });

  // Process investments data by year and channel
  allInvestments.forEach(week => {
    const year = week.date.getFullYear();
    if (yearlyChannelData[year]) {
      contributionVariables.forEach(variable => {
        yearlyChannelData[year][variable].investment += (week[variable] as number || 0);
      });
    }
  });

  // Calculate ROI for each channel per year
  availableYears.forEach(year => {
    contributionVariables.forEach(variable => {
      const data = yearlyChannelData[year][variable];
      data.roi = data.investment > 0 ? data.contribution / data.investment : 0;
    });
  });

  // Generate multi-year waterfall data
  const generateMultiYearWaterfallData = () => {
    const waterfallData: any[] = [];

    if (availableYears.length < 2) {
      return waterfallData;
    }

    // Start with the earliest year's sales
    const firstYear = availableYears[0];
    const firstYearSales = yearlyChannelData[firstYear] ?
      Object.values(yearlyChannelData[firstYear]).reduce((sum, channel) => sum + channel.contribution, 0) : 0;

    waterfallData.push({
      name: `${firstYear} Sales`,
      value: firstYearSales,
      base: 0,
      step: firstYearSales,
      isTotal: true,
      displayValue: firstYearSales,
      color: '#94a3b8'
    });

    // Process each year transition
    for (let i = 0; i < availableYears.length - 1; i++) {
      const currentYear = availableYears[i];
      const nextYear = availableYears[i + 1];

      const currentYearSales = yearlyChannelData[currentYear] ?
        Object.values(yearlyChannelData[currentYear]).reduce((sum, channel) => sum + channel.contribution, 0) : 0;
      const nextYearSales = yearlyChannelData[nextYear] ?
        Object.values(yearlyChannelData[nextYear]).reduce((sum, channel) => sum + channel.contribution, 0) : 0;

      // Calculate channel differences
      const channelDifferences: { channel: string; difference: number; color: string }[] = [];

      contributionVariables.forEach(variable => {
        const currentChannelData = yearlyChannelData[currentYear]?.[variable];
        const nextChannelData = yearlyChannelData[nextYear]?.[variable];

        if (currentChannelData && nextChannelData) {
          const currentContribution = currentChannelData.contribution;
          const nextContribution = nextChannelData.contribution;
          const difference = nextContribution - currentContribution;

          if (Math.abs(difference) > 1000) { // Only include significant changes
            channelDifferences.push({
              channel: variable,
              difference,
              color: variableColors[variable]
            });
          }
        }
      });

      // Sort by magnitude and add channel differences
      channelDifferences
        .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference))
        .forEach(channel => {
          waterfallData.push({
            name: `${channel.channel} (${currentYear}-${nextYear})`,
            value: channel.difference,
            base: 0,
            step: channel.difference,
            isTotal: false,
            displayValue: channel.difference,
            color: channel.color
          });
        });

      // Add unexplained variance if significant
      const totalChannelDifference = channelDifferences.reduce((sum, ch) => sum + ch.difference, 0);
      const unexplainedVariance = (nextYearSales - currentYearSales) - totalChannelDifference;

      if (Math.abs(unexplainedVariance) > 1000) {
        waterfallData.push({
          name: `Unexplained (${currentYear}-${nextYear})`,
          value: unexplainedVariance,
          base: 0,
          step: unexplainedVariance,
          isTotal: false,
          displayValue: unexplainedVariance,
          color: '#94a3b8'
        });
      }

      // Add next year's sales total
      waterfallData.push({
        name: `${nextYear} Sales`,
        value: nextYearSales,
        base: 0,
        step: nextYearSales,
        isTotal: true,
        displayValue: nextYearSales,
        color: '#94a3b8'
      });
    }

    return waterfallData;
  };

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
            <BarChart
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

              {/* Total Sales bar */}
              <Bar
                dataKey="totalSales"
                fill="#000000"
                name="Total Sales"
              />

              {/* Total Contribution bar */}
              <Bar
                dataKey="totalContribution"
                fill="#3b82f6"
                name="Total Contribution"
              />

              {/* Total Investment bar */}
              <Bar
                dataKey="totalInvestment"
                fill="#10b981"
                name="Total Investment"
              />
            </BarChart>
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
                interval="auto"
                tickCount={12}
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

      {/* Yearly Performance by Channel Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <BarChartIcon size={18} className="text-primary-600" />
            Yearly Performance by Channel
          </h3>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">Metric:</label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as 'roi' | 'contribution' | 'investment')}
              className="px-3 py-1 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="roi">ROI</option>
              <option value="contribution">Contribution</option>
              <option value="investment">Investment</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3 font-semibold text-slate-700 bg-slate-50 sticky left-0 z-10">Channel</th>
                {availableYears.map(year => (
                  <th key={year} className="text-center py-2 px-2 font-semibold text-slate-700 bg-slate-50 min-w-[80px]">
                    {year}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contributionVariables.map((variable) => {
                const channelColor = variableColors[variable];

                return (
                  <tr key={variable} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-3 font-medium text-slate-800 sticky left-0 bg-white z-10 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: channelColor }}
                        />
                        <span>{variable}</span>
                      </div>
                    </td>
                    {availableYears.map(year => {
                      const yearData = yearlyChannelData[year]?.[variable];
                      let value = 0;
                      let displayValue = '-';

                      if (yearData) {
                        if (selectedMetric === 'roi') {
                          value = yearData.roi;
                          displayValue = value > 0 ? `${value.toFixed(2)}x` : '-';
                        } else if (selectedMetric === 'contribution') {
                          value = yearData.contribution;
                          displayValue = value > 0 ? formatNumberDetailed(value) : '-';
                        } else if (selectedMetric === 'investment') {
                          value = yearData.investment;
                          displayValue = value > 0 ? formatNumberDetailed(value) : '-';
                        }
                      }

                      return (
                        <td
                          key={year}
                          className="text-center py-2 px-2 text-sm font-medium whitespace-nowrap"
                        >
                          {displayValue}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Giant Waterfall Chart - All Years */}
      <div className="card">
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          <BarChartIcon size={18} className="text-primary-600" />
          Multi-Year Performance Waterfall ({availableYears[0]} - {availableYears[availableYears.length - 1]})
        </h3>
        <div className="h-96 overflow-x-auto">
          <ResponsiveContainer width="100%" height="100%" minWidth={availableYears.length * 100}>
            <BarChart
              data={generateMultiYearWaterfallData()}
              margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
                tick={{ fontSize: 10 }}
              />
              <YAxis
                tickFormatter={(value) => formatNumberAxis(value)}
                tick={{ fontSize: 11 }}
                width={80}
              />
              <Tooltip
                formatter={(value, name) => [formatNumberDetailed(value as number), name]}
                labelFormatter={(label) => `Period: ${label}`}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #ccc',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="base" stackId="stack" fill="transparent" stroke="transparent" />
              <Bar dataKey="step" name="value" stackId="stack" radius={[4, 4, 0, 0]}>
                {generateMultiYearWaterfallData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
                <LabelList
                  content={(props: any) => {
                    const { payload, index } = props;
                    if (!payload || index === undefined) return null;

                    const entry = generateMultiYearWaterfallData()[index];
                    if (entry.isTotal) return null;

                    const barHeight = Math.abs(entry.step);
                    const maxValue = Math.max(...generateMultiYearWaterfallData().map(e => e.base + Math.abs(e.step)));
                    const minBarHeight = maxValue * 0.01;

                    if (barHeight < minBarHeight) return null;

                    let label = formatNumber(entry.displayValue || entry.step);
                    label = `${entry.step > 0 ? '+' : ''}${label}`;

                    return (
                      <text
                        x={props.x + props.width / 2}
                        y={props.y + props.height + 15}
                        fill={entry.step > 0 ? '#16a34a' : '#dc2626'}
                        textAnchor="middle"
                        fontSize={10}
                        fontWeight="600"
                      >
                        {label}
                      </text>
                    );
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default HistoricalAnalysisTab;
