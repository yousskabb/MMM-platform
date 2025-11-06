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
  LabelList
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

  // Calculate min and max values for the selected metric
  const getMetricMinMax = (metric: 'roi' | 'contribution' | 'investment') => {
    let min = Infinity;
    let max = -Infinity;

    availableYears.forEach(year => {
      contributionVariables.forEach(variable => {
        const yearData = yearlyChannelData[year]?.[variable];
        if (yearData) {
          let value = 0;
          if (metric === 'roi') {
            value = yearData.roi;
          } else if (metric === 'contribution') {
            value = yearData.contribution;
          } else if (metric === 'investment') {
            value = yearData.investment;
          }
          if (value > 0) {
            min = Math.min(min, value);
            max = Math.max(max, value);
          }
        }
      });
    });

    return { min: min === Infinity ? 0 : min, max: max === -Infinity ? 0 : max };
  };

  // Get color based on value (greenish for high, reddish for low)
  const getValueColor = (value: number, min: number, max: number) => {
    if (value <= 0 || min === max) {
      return 'transparent';
    }

    // Normalize value to 0-1 range
    const normalized = (value - min) / (max - min);

    // Use very subtle colors - light greenish for high values, light reddish for low values
    // Interpolate between light red (low) and light green (high)
    // Using very light, pastel-like colors that are not too intense
    const red = Math.round(250 - (normalized * 30)); // 250 (very light red) to 220
    const green = Math.round(240 + (normalized * 15)); // 240 to 255 (very light green)
    const blue = Math.round(240 - (normalized * 10)); // 240 to 230

    return `rgb(${red}, ${green}, ${blue})`;
  };

  const { min: metricMin, max: metricMax } = getMetricMinMax(selectedMetric);

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
              margin={{ top: 30, right: 30, left: 0, bottom: 0 }}
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
              >
                <LabelList
                  dataKey="totalSales"
                  position="top"
                  formatter={(value: number) => {
                    if (value >= 1000000) {
                      return `${(value / 1000000).toFixed(1)}M`;
                    } else if (value >= 1000) {
                      return `${(value / 1000).toFixed(1)}K`;
                    }
                    return value.toFixed(1);
                  }}
                  style={{ fontSize: '11px', fill: '#374151' }}
                />
              </Bar>

              {/* Total Contribution bar */}
              <Bar
                dataKey="totalContribution"
                fill="#3b82f6"
                name="Total Contribution"
              >
                <LabelList
                  dataKey="totalContribution"
                  position="top"
                  formatter={(value: number) => {
                    if (value >= 1000000) {
                      return `${(value / 1000000).toFixed(1)}M`;
                    } else if (value >= 1000) {
                      return `${(value / 1000).toFixed(1)}K`;
                    }
                    return value.toFixed(1);
                  }}
                  style={{ fontSize: '11px', fill: '#374151' }}
                />
              </Bar>

              {/* Total Investment bar */}
              <Bar
                dataKey="totalInvestment"
                fill="#10b981"
                name="Total Investment"
              >
                <LabelList
                  dataKey="totalInvestment"
                  position="top"
                  formatter={(value: number) => {
                    if (value >= 1000000) {
                      return `${(value / 1000000).toFixed(1)}M`;
                    } else if (value >= 1000) {
                      return `${(value / 1000).toFixed(1)}K`;
                    }
                    return value.toFixed(1);
                  }}
                  style={{ fontSize: '11px', fill: '#374151' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          <LineChartIcon size={18} className="text-primary-600" />
          Monthly Contribution (All Years)
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

                      const cellColor = getValueColor(value, metricMin, metricMax);

                      return (
                        <td
                          key={year}
                          className="text-center py-2 px-2 text-sm font-medium whitespace-nowrap"
                          style={{
                            backgroundColor: cellColor,
                            transition: 'background-color 0.2s ease'
                          }}
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

    </div>
  );
};

export default HistoricalAnalysisTab;
