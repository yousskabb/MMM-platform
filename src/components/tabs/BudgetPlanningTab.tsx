import React, { useState } from 'react';
import { FilterState } from '../../types';
import { filterData } from '../../data/dataService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { SlidersHorizontal } from 'lucide-react';
import ChannelColorBadge from '../ui/ChannelColorBadge';

interface BudgetPlanningTabProps {
  filters: FilterState;
}

const BudgetPlanningTab: React.FC<BudgetPlanningTabProps> = ({ filters }) => {
  const [comparisonPeriod, setComparisonPeriod] = useState<'2024-2025' | '2025-2026'>('2024-2025');

  // Get year labels based on selected comparison period
  const year1 = comparisonPeriod === '2024-2025' ? '2024' : '2025';
  const year2 = comparisonPeriod === '2024-2025' ? '2025' : '2026';

  // Get channel data from Excel
  const { channelData } = filterData(filters.dateRange.startDate, filters.dateRange.endDate);

  // Generate comparison data from current channel data
  const yearComparisonData = channelData.map(channel => ({
    channel: channel.channel,
    year1Budget: channel.investment * 0.9, // Simulate previous year as 90% of current
    year2Budget: channel.investment,
    variation: 11.1 // 10% increase
  }));

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
    const channelData = filterData(filters.country, filters.brand, filters.dateRange).channelData
      .find(c => c.channel === item.channel);

    return {
      name: item.channel,
      [year1]: item.year1Budget,
      [year2]: item.year2Budget,
      variation: Math.round(item.variation), // Round to nearest integer
      color: channelData?.color || '#94a3b8'
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-slate-800">Budget Planning</h1>
        <div className="flex items-center gap-3">
          <select
            className="select text-sm min-w-40"
            value={comparisonPeriod}
            onChange={(e) => setComparisonPeriod(e.target.value as '2024-2025' | '2025-2026')}
          >
            <option value="2024-2025">Compare 2024–2025</option>
            <option value="2025-2026">Compare 2025–2026</option>
          </select>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-medium mb-4">Budget Changes: {year1} to {year2}</h3>
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
              <Bar dataKey={year1} name={year1} fill="#94a3b8" />
              <Bar dataKey={year2} name={year2} fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-medium mb-4">Budget Variation by Channel ({year1} to {year2})</h3>
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
                <th className="p-3 text-right text-sm font-semibold text-slate-700">{year1} Budget</th>
                <th className="p-3 text-right text-sm font-semibold text-slate-700">{year2} Budget</th>
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
            <span className="font-semibold">Budget Shift:</span> The data shows a trend toward {totalVariation > 0 ? 'increasing' : 'decreasing'} overall media investment by {Math.abs(Math.round(totalVariation))}% from {year1} to {year2}.
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