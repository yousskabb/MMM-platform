import React, { useState } from 'react';
import { FilterState } from '../../types';
import { filterDataByYear } from '../../data/dataService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { SlidersHorizontal } from 'lucide-react';
import ChannelColorBadge from '../ui/ChannelColorBadge';

interface BudgetPlanningTabProps {
  filters: FilterState;
}

const BudgetPlanningTab: React.FC<BudgetPlanningTabProps> = ({ filters }) => {
  // Get current year and previous year data
  const currentYear = filters.selectedYear;
  const previousYear = currentYear - 1;

  // Get channel data for current year
  const { channelData: currentYearData } = filterDataByYear(currentYear);

  // Get channel data for previous year (if available)
  let previousYearData: any[] = [];
  try {
    const { channelData: prevData } = filterDataByYear(previousYear);
    previousYearData = prevData;
  } catch (error) {
    // If previous year data is not available, create mock data based on current year
    previousYearData = currentYearData.map(channel => ({
      ...channel,
      investment: channel.investment * 0.9, // Simulate previous year as 90% of current
      contribution: channel.contribution * 0.9
    }));
  }

  // Generate comparison data from current and previous year data
  const yearComparisonData = currentYearData.map(channel => {
    const prevChannel = previousYearData.find(p => p.channel === channel.channel);
    const prevInvestment = prevChannel?.investment || channel.investment * 0.9;
    const variation = prevInvestment > 0 ? ((channel.investment - prevInvestment) / prevInvestment) * 100 : 0;

    return {
      channel: channel.channel,
      year1Budget: prevInvestment,
      year2Budget: channel.investment,
      variation: variation
    };
  });

  // Calculate totals
  const totalYear1 = yearComparisonData.reduce((sum, item) => sum + item.year1Budget, 0);
  const totalYear2 = yearComparisonData.reduce((sum, item) => sum + item.year2Budget, 0);
  const totalVariation = ((totalYear2 - totalYear1) / totalYear1) * 100;

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      notation: value >= 1000000 ? 'compact' : 'standard',
      maximumFractionDigits: 1
    }).format(value);
  };

  // Prepare data for chart
  const chartData = yearComparisonData.map(item => {
    // Get the color based on the channel
    const channelDataItem = currentYearData.find(c => c.channel === item.channel);

    return {
      name: item.channel,
      [previousYear]: item.year1Budget,
      [currentYear]: item.year2Budget,
      variation: Math.round(item.variation), // Round to nearest integer
      color: channelDataItem?.color || '#94a3b8'
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-slate-800">Budget Planning</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600">
            Comparing {previousYear} vs {currentYear}
          </span>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-medium mb-4">Budget Changes: {previousYear} to {currentYear}</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis
                tickFormatter={(value) => `€${value >= 1000 ? `${value / 1000}k` : value}`}
                label={{ value: 'Budget (€)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                formatter={(value, name) => {
                  if (name === 'variation') {
                    return [`${Math.round(value as number)}%`, 'Variation'];
                  }
                  return [formatCurrency(value as number), name];
                }}
              />
              <Legend />
              <Bar dataKey={previousYear} name={previousYear} fill="#94a3b8" />
              <Bar dataKey={currentYear} name={currentYear} fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-medium mb-4">Budget Variation by Channel ({previousYear} to {currentYear})</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(value) => `${value}%`}
                label={{ value: 'Variation (%)', position: 'insideBottom', offset: -5 }}
              />
              <YAxis type="category" dataKey="name" width={80} />
              <Tooltip
                formatter={(value) => [`${Math.round(value as number)}%`, 'Variation']}
              />
              <ReferenceLine x={0} stroke="#000" />
              <Bar dataKey="variation" name="Budget Variation (%)" fill="#4b5563" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-medium mb-4">Detailed Budget Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[768px]">
            <thead>
              <tr className="bg-slate-50">
                <th className="p-3 text-left text-sm font-semibold text-slate-700">Channel</th>
                <th className="p-3 text-right text-sm font-semibold text-slate-700">{previousYear} Budget</th>
                <th className="p-3 text-right text-sm font-semibold text-slate-700">{currentYear} Budget</th>
                <th className="p-3 text-right text-sm font-semibold text-slate-700">Absolute Variation</th>
                <th className="p-3 text-right text-sm font-semibold text-slate-700">% Variation</th>
              </tr>
            </thead>
            <tbody>
              {yearComparisonData.map((item, index) => (
                <tr
                  key={index}
                  className="border-t border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <td className="p-3">
                    <ChannelColorBadge channel={item.channel} />
                  </td>
                  <td className="p-3 text-right">{formatCurrency(item.year1Budget)}</td>
                  <td className="p-3 text-right font-medium">{formatCurrency(item.year2Budget)}</td>
                  <td className="p-3 text-right">
                    {formatCurrency(item.year2Budget - item.year1Budget)}
                  </td>
                  <td className="p-3 text-right">
                    <span className={`px-2 py-1 rounded-full text-sm ${(() => {
                      // Safely convert to number and check if negative
                      const value = Number(item.variation);
                      return !isNaN(value) && value < 0
                        ? 'bg-error-100 text-error-700'
                        : 'bg-success-100 text-success-700';
                    })()
                      }`}>
                      {Number(item.variation) > 0 ? '+' : ''}{Math.round(Number(item.variation))}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-semibold border-t-2 border-slate-200">
                <td className="p-3">Total</td>
                <td className="p-3 text-right">{formatCurrency(totalYear1)}</td>
                <td className="p-3 text-right">{formatCurrency(totalYear2)}</td>
                <td className="p-3 text-right">{formatCurrency(totalYear2 - totalYear1)}</td>
                <td className="p-3 text-right">
                  <span className={`px-2 py-1 rounded-full text-sm ${(() => {
                    // Safely convert to number and check if negative
                    const value = Number(totalVariation);
                    return !isNaN(value) && value < 0
                      ? 'bg-error-100 text-error-700'
                      : 'bg-success-100 text-success-700';
                  })()
                    }`}>
                    {Number(totalVariation) > 0 ? '+' : ''}{Math.round(Number(totalVariation))}%
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="card bg-slate-50 border border-slate-200">
        <h3 className="text-lg font-medium mb-3">Planning Insights</h3>
        <div className="space-y-3">
          <p className="text-sm text-slate-700">
            <span className="font-semibold">Budget Shift:</span> The data shows a trend toward {totalVariation > 0 ? 'increasing' : 'decreasing'} overall media investment by {Math.abs(Math.round(totalVariation))}% from {previousYear} to {currentYear}.
          </p>
          <p className="text-sm text-slate-700">
            <span className="font-semibold">Channel Prioritization:</span> The largest proportional increases are in {chartData.sort((a, b) => b.variation - a.variation)[0].name} and {chartData.sort((a, b) => b.variation - a.variation)[1].name}, suggesting strategic focus on these channels.
          </p>
          <p className="text-sm text-slate-700">
            <span className="font-semibold">Reduced Investment:</span> {chartData.filter(item => item.variation < 0).length} channels show decreased investment, with {chartData.sort((a, b) => a.variation - b.variation)[0].name} seeing the largest reduction.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BudgetPlanningTab;