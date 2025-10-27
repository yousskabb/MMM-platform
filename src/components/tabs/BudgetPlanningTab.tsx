import React, { useState } from 'react';
import { FilterState } from '../../types';
import { filterDataByYear } from '../../data/dataService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { SlidersHorizontal } from 'lucide-react';
import ChannelColorBadge from '../ui/ChannelColorBadge';
import { formatNumber, formatNumberDetailed, formatNumberAxis } from '../../utils/numberFormatter';

interface BudgetPlanningTabProps {
  filters: FilterState;
}

const BudgetPlanningTab: React.FC<BudgetPlanningTabProps> = ({ filters }) => {
  // Get current year and previous year data
  const currentYear = filters.selectedYear;
  const previousYear = currentYear - 1;

  // Get channel data for current year
  const { channelData: currentYearData, variables } = filterDataByYear(currentYear);

  // Try to get previous year data
  let previousYearData: any[] = [];
  let hasPreviousYearData = false;

  try {
    const { channelData: prevData } = filterDataByYear(previousYear);
    // Check if we have actual non-zero data
    const hasInvestments = prevData.some(ch => ch.investment > 0);
    if (prevData.length > 0 && hasInvestments) {
      previousYearData = prevData;
      hasPreviousYearData = true;
    } else {
      hasPreviousYearData = false;
    }
  } catch (error) {
    hasPreviousYearData = false;
  }

  // If no previous year data, show grayed out message
  if (!hasPreviousYearData) {
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

        <div className="card bg-slate-100 border border-slate-300 opacity-60">
          <div className="text-center py-12">
            <p className="text-slate-500 text-lg font-medium">
              No data available for {previousYear}
            </p>
            <p className="text-slate-400 text-sm mt-2">
              Budget comparison requires data from both {previousYear} and {currentYear}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Create a unified list of all channels across both years
  const allChannels = new Set([...currentYearData.map(c => c.channel), ...previousYearData.map(c => c.channel)]);

  // Generate comparison data
  const yearComparisonData = Array.from(allChannels).map(channelName => {
    const currentChannel = currentYearData.find(c => c.channel === channelName);
    const previousChannel = previousYearData.find(c => c.channel === channelName);

    // Use exact values (not rounded) for calculations
    const currentInvestment = currentChannel?.investment ?? 0;
    const previousInvestment = previousChannel?.investment ?? 0;

    // Calculate variation using exact values
    let variation = 0;
    if (previousInvestment !== 0) {
      variation = ((currentInvestment - previousInvestment) / previousInvestment) * 100;
    }

    return {
      channel: channelName,
      year1Budget: previousInvestment, // Keep exact value
      year2Budget: currentInvestment,  // Keep exact value
      variation: variation, // Keep exact value
      color: currentChannel?.color || previousChannel?.color || '#94a3b8'
    };
  });

  // Calculate totals
  const totalYear1 = yearComparisonData.reduce((sum, item) => sum + item.year1Budget, 0);
  const totalYear2 = yearComparisonData.reduce((sum, item) => sum + item.year2Budget, 0);
  const totalVariation = totalYear1 > 0 ? ((totalYear2 - totalYear1) / totalYear1) * 100 : 0;

  // Prepare data for chart with color coding
  const chartData = yearComparisonData.map(item => {
    // Use exact variation for color determination
    const exactVariation = item.variation;

    // Determine color based on variation: green for increase > 1%, red for decrease < -1%, grey for stable
    let variationColor = '#94a3b8'; // grey
    if (exactVariation > 1) {
      variationColor = '#16a34a'; // green
    } else if (exactVariation < -1) {
      variationColor = '#dc2626'; // red
    }

    return {
      name: item.channel,
      [previousYear]: item.year1Budget,
      [currentYear]: item.year2Budget,
      variation: exactVariation, // Use exact value (round only for display)
      variationColor: variationColor,
      color: item.color
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
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={chartData.length > 8 ? -45 : 0}
                textAnchor={chartData.length > 8 ? "end" : "middle"}
                height={chartData.length > 8 ? 100 : 60}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                tickFormatter={(value) => formatNumberAxis(value)}
              />
              <Tooltip
                formatter={(value, name) => [formatNumberDetailed(value as number), name]}
              />
              <Legend />
              <Bar dataKey={previousYear} name={`${previousYear}`} fill="#94a3b8" />
              <Bar dataKey={currentYear} name={`${currentYear}`}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-medium mb-4">Budget Variation by Channel ({previousYear} to {currentYear})</h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis
                type="number"
                tickFormatter={(value) => `${Math.round(value * 10) / 10}%`}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={Math.max(150, Math.min(250, chartData.length * 12))}
                tick={{ fontSize: 11 }}
                interval={0}
              />
              <Tooltip
                formatter={(value) => [`${(value as number).toFixed(2)}%`, 'Variation']}
              />
              <ReferenceLine x={0} stroke="#000" />
              <Bar dataKey="variation" name="Budget Variation (%)">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.variationColor} />
                ))}
              </Bar>
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
              {yearComparisonData.map((item, index) => {
                const variationColor = item.variation > 1 ? '#16a34a' : item.variation < -1 ? '#dc2626' : '#94a3b8';
                return (
                  <tr
                    key={index}
                    className="border-t border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-3">
                      <ChannelColorBadge channel={item.channel} />
                    </td>
                    <td className="p-3 text-right">{formatNumber(item.year1Budget)}</td>
                    <td className="p-3 text-right font-medium">{formatNumber(item.year2Budget)}</td>
                    <td className="p-3 text-right">
                      {formatNumber(item.year2Budget - item.year1Budget)}
                    </td>
                    <td className="p-3 text-right">
                      <span
                        className="px-2 py-1 rounded-full text-sm font-medium"
                        style={{
                          backgroundColor: variationColor === '#16a34a' ? '#dcfce7' :
                            variationColor === '#dc2626' ? '#fee2e2' : '#f1f5f9',
                          color: variationColor === '#16a34a' ? '#166534' :
                            variationColor === '#dc2626' ? '#991b1b' : '#475569'
                        }}
                      >
                        {item.variation > 0 ? '+' : ''}{item.variation.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-semibold border-t-2 border-slate-200">
                <td className="p-3">Total</td>
                <td className="p-3 text-right">{formatNumber(totalYear1)}</td>
                <td className="p-3 text-right">{formatNumber(totalYear2)}</td>
                <td className="p-3 text-right">{formatNumber(totalYear2 - totalYear1)}</td>
                <td className="p-3 text-right">
                  <span className={`px-2 py-1 rounded-full text-sm ${totalVariation < 0 ? 'bg-error-100 text-error-700' : 'bg-success-100 text-success-700'}`}>
                    {totalVariation > 0 ? '+' : ''}{totalVariation.toFixed(1)}%
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
            <span className="font-semibold">Budget Shift:</span> The data shows a trend toward {totalVariation > 0 ? 'increasing' : 'decreasing'} overall media investment by {Math.abs(totalVariation).toFixed(1)}% from {previousYear} to {currentYear}.
          </p>
          <p className="text-sm text-slate-700">
            <span className="font-semibold">Channel Prioritization:</span> The largest proportional increases are in {[...chartData].sort((a, b) => b.variation - a.variation)[0]?.name} and {[...chartData].sort((a, b) => b.variation - a.variation)[1]?.name}, suggesting strategic focus on these channels.
          </p>
          <p className="text-sm text-slate-700">
            <span className="font-semibold">Reduced Investment:</span> {chartData.filter(item => item.variation < 0).length} channels show decreased investment, with {[...chartData].sort((a, b) => a.variation - b.variation)[0]?.name} seeing the largest reduction.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BudgetPlanningTab;