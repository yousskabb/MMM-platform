import React, { useState } from 'react';
import { FilterState, ChannelData } from '../../types';
import { filterDataByYear, isDataLoaded } from '../../data/dataService';
import DataTable from '../ui/DataTable';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { ArrowUpDown, SlidersHorizontal } from 'lucide-react';
import ChannelColorBadge from '../ui/ChannelColorBadge';

interface ROITabProps {
  filters: FilterState;
}

type SortField = 'channel' | 'investment' | 'revenue' | 'roi';
type SortDirection = 'asc' | 'desc';

const ROITab: React.FC<ROITabProps> = ({ filters }) => {
  const [sortField, setSortField] = useState<SortField>('roi');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showSettings, setShowSettings] = useState(false);

  // Check if data is loaded before trying to use it
  if (!isDataLoaded()) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Loading data...</p>
      </div>
    );
  }

  const { channelData } = filterDataByYear(filters.selectedYear);

  // Calculate totals
  const totalInvestment = channelData.reduce((sum, channel) => sum + channel.investment, 0);
  const totalRevenue = channelData.reduce((sum, channel) => sum + channel.revenue, 0);
  const avgROI = totalRevenue / totalInvestment;

  // Sort data
  const sortedData = [...channelData].sort((a, b) => {
    if (sortDirection === 'asc') {
      return a[sortField] > b[sortField] ? 1 : -1;
    } else {
      return a[sortField] < b[sortField] ? 1 : -1;
    }
  });

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      notation: value >= 1000000 ? 'compact' : 'standard',
      maximumFractionDigits: 1
    }).format(value);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;

    return (
      <ArrowUpDown size={14} className="ml-1 inline" />
    );
  };

  // Prepare data for chart
  const chartData = sortedData.map(channel => ({
    name: channel.channel,
    roi: channel.roi,
    investment: channel.investment,
    revenue: channel.revenue,
    color: channel.color
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-slate-800">ROI Analysis</h1>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="btn btn-secondary flex items-center gap-2"
        >
          <SlidersHorizontal size={16} />
          <span>Settings</span>
        </button>
      </div>

      {showSettings && (
        <div className="card animate-fade-in">
          <h3 className="text-lg font-medium mb-3">Display Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Sort By
              </label>
              <select
                className="select w-full"
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
              >
                <option value="channel">Channel</option>
                <option value="investment">Investment</option>
                <option value="revenue">Revenue</option>
                <option value="roi">ROI</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Sort Direction
              </label>
              <select
                className="select w-full"
                value={sortDirection}
                onChange={(e) => setSortDirection(e.target.value as SortDirection)}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-medium mb-4">ROI by Channel</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" domain={[0, 'auto']} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={Math.max(120, Math.min(200, chartData.length * 8))}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value) => [`${(value as number).toFixed(2)}x`, 'ROI']}
                />
                <Bar dataKey="roi" name="ROI">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium mb-4">Investment vs. Incremental Revenue</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={chartData.length > 8 ? -45 : 0}
                  textAnchor={chartData.length > 8 ? "end" : "middle"}
                  height={chartData.length > 8 ? 80 : 60}
                  tick={{ fontSize: chartData.length > 8 ? 10 : 12 }}
                />
                <YAxis
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k €`}
                />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
                <Bar dataKey="investment" name="Investment" fill="#94a3b8" />
                <Bar dataKey="revenue" name="Incremental Revenue">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-medium mb-4">ROI Performance Table</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[768px]">
            <thead>
              <tr className="bg-slate-50">
                <th
                  className="p-3 text-left text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort('channel')}
                >
                  <span className="flex items-center">
                    Channel {getSortIcon('channel')}
                  </span>
                </th>
                <th
                  className="p-3 text-right text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort('investment')}
                >
                  <span className="flex items-center justify-end">
                    Investment {getSortIcon('investment')}
                  </span>
                </th>
                <th
                  className="p-3 text-right text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort('revenue')}
                >
                  <span className="flex items-center justify-end">
                    Incremental Revenue {getSortIcon('revenue')}
                  </span>
                </th>
                <th
                  className="p-3 text-right text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort('roi')}
                >
                  <span className="flex items-center justify-end">
                    ROI {getSortIcon('roi')}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((channel, index) => (
                <tr
                  key={index}
                  className="border-t border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <td className="p-3">
                    <ChannelColorBadge channel={channel.channel} />
                  </td>
                  <td className="p-3 text-right">{formatCurrency(channel.investment)}</td>
                  <td className="p-3 text-right">{formatCurrency(channel.revenue)}</td>
                  <td className="p-3 text-right font-medium">
                    <span className={`px-2 py-1 rounded-full text-sm ${channel.roi > avgROI ? 'bg-success-100 text-success-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                      {channel.roi.toFixed(2)}x
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-semibold border-t-2 border-slate-200">
                <td className="p-3">Total / Average</td>
                <td className="p-3 text-right">{formatCurrency(totalInvestment)}</td>
                <td className="p-3 text-right">{formatCurrency(totalRevenue)}</td>
                <td className="p-3 text-right">{avgROI.toFixed(2)}x</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ROITab;