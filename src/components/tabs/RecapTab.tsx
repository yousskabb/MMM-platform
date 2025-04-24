import React, { useState } from 'react';
import { 
  PieChart as PieChartIcon, 
  BarChart as BarChartIcon, 
  LineChart as LineChartIcon, 
  DollarSign,
  TrendingUp,
  FileText
} from 'lucide-react';
import KPICard from '../ui/KPICard';
import { FilterState } from '../../types';
import { 
  PieChart, 
  Pie, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  CartesianGrid, 
  Line 
} from 'recharts';
import { filterData, generateInsights } from '../../data/mockData';
import ChannelColorBadge from '../ui/ChannelColorBadge';

interface RecapTabProps {
  filters: FilterState;
}

interface InsightModalProps {
  country: string;
  brand: string;
  onClose: () => void;
}

const InsightModal: React.FC<InsightModalProps> = ({ country, brand, onClose }) => {
  const insights = generateInsights(country, brand);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-hidden animate-scale-up">
        <div className="p-6 border-b border-slate-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Business Report: {brand} in {country}</h2>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
              &times;
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <h3 className="text-lg font-medium mb-4">Key Insights</h3>
          
          <ul className="space-y-4">
            {insights.map((insight, index) => (
              <li key={index} className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-medium">
                  {index + 1}
                </div>
                <p className="text-slate-700">{insight}</p>
              </li>
            ))}
          </ul>
          
          <h3 className="text-lg font-medium mt-8 mb-4">Recommendations</h3>
          
          <div className="space-y-4">
            <div className="p-4 bg-success-50 border-l-4 border-success-500 rounded">
              <h4 className="font-semibold text-success-700">Opportunities</h4>
              <p className="mt-1 text-slate-700">Increase investment in high-performing channels like TV and Digital to maximize ROI.</p>
            </div>
            
            <div className="p-4 bg-warning-50 border-l-4 border-warning-500 rounded">
              <h4 className="font-semibold text-warning-700">Cautions</h4>
              <p className="mt-1 text-slate-700">Monitor declining performance in Print media and consider reallocating budget if trend continues.</p>
            </div>
            
            <div className="p-4 bg-primary-50 border-l-4 border-primary-500 rounded">
              <h4 className="font-semibold text-primary-700">Strategic Focus</h4>
              <p className="mt-1 text-slate-700">Leverage synergies between TV and Digital campaigns to maximize overall marketing effectiveness.</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <button onClick={onClose} className="btn btn-primary">
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};

const RecapTab: React.FC<RecapTabProps> = ({ filters }) => {
  const [showInsights, setShowInsights] = useState(false);
  const { channelData, monthlyData } = filterData(filters.country, filters.brand, filters.dateRange);
  
  // Calculate KPI totals
  const totalInvestment = channelData.reduce((sum, channel) => sum + channel.investment, 0);
  const totalRevenue = channelData.reduce((sum, channel) => sum + channel.revenue, 0);
  const totalContribution = channelData.reduce((sum, channel) => sum + channel.contribution, 0);
  const avgROI = totalRevenue / totalInvestment;
  
  // Prepare data for pie chart
  const pieData = channelData.map(channel => ({
    name: channel.channel,
    value: channel.investment,
    color: channel.color
  }));
  
  // Generate waterfall data
  const generateWaterfallData = () => {
    const baseValue = 371000;
    return [
      { name: '2023 YTD', value: baseValue, total: baseValue },
      { name: 'Base', value: -54000, total: baseValue - 54000 },
      { name: 'Product', value: 85000, total: baseValue - 54000 + 85000 },
      { name: 'PR', value: -6000, total: baseValue - 54000 + 85000 - 6000 },
      { name: 'Trends', value: 2000, total: baseValue - 54000 + 85000 - 6000 + 2000 },
      { name: '2024 YTD', value: 480000, isTotal: true, total: 480000 }
    ];
  };

  const waterfallData = generateWaterfallData();
  
  // Prepare monthly data for the contribution composition (stacked area chart)
  const monthNames = [...new Set(monthlyData.map(item => item.month))];
  
  const areaChartData = monthNames.map(month => {
    const monthData = monthlyData.filter(item => item.month === month);
    
    const result: any = { month };
    
    monthData.forEach(item => {
      result[item.channel] = item.contribution;
    });
    
    result.total = monthData.reduce((sum, item) => sum + item.contribution, 0);
    
    return result;
  });
  
  // Group monthly data by channel and month for the heatmap
  // Create performance heatmap data (ROI by channel and month)
  const heatmapData = channelData.map(channel => {
    const channelMonthlyData = monthlyData.filter(item => item.channel === channel.channel);
    
    const monthlyValues: any = { channel: channel.channel, color: channel.color };
    
    channelMonthlyData.forEach(item => {
      monthlyValues[item.month] = item.roi;
    });
    
    return monthlyValues;
  });
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: value >= 1000000 ? 'compact' : 'standard',
      maximumFractionDigits: 1
    }).format(value);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-slate-800">Marketing Performance Recap</h1>
        <button
          onClick={() => setShowInsights(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <FileText size={16} />
          Generate Business Report
        </button>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title="Total Investment" 
          value={totalInvestment} 
          icon={<DollarSign size={20} />} 
        />
        <KPICard 
          title="Total Revenue" 
          value={totalRevenue}
          indicator={8.3}
          icon={<BarChartIcon size={20} />}
          color="success-600"
        />
        <KPICard 
          title="Average ROI" 
          value={`${avgROI.toFixed(2)}x`}
          indicator={4.2}
          icon={<TrendingUp size={20} />}
          color="accent-600"
        />
        <KPICard 
          title="Media Contribution" 
          value={totalContribution}
          indicator={-2.1}
          icon={<LineChartIcon size={20} />}
          color="secondary-600"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Channel Allocation Pie Chart */}
        <div className="card">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <PieChartIcon size={18} className="text-primary-600" />
            Channel Allocation
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend 
                  layout="vertical" 
                  verticalAlign="middle" 
                  align="right"
                  content={({ payload }) => (
                    <ul className="space-y-2">
                      {payload?.map((entry, index) => (
                        <li key={`legend-${index}`} className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="text-sm">{entry.value}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* YoY Budget Variation (waterfall) */}
        <div className="card">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <BarChartIcon size={18} className="text-accent-600" />
            YoY Budget Variation (2023 to 2024)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={waterfallData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Variation']}
                />
                <Bar dataKey="value" fill="#8884d8">
                  {waterfallData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.value >= 0 ? entry.color : '#ef4444'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {/* Performance Heatmap */}
        <div className="card">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <LineChartIcon size={18} className="text-secondary-600" />
            Monthly Performance by Channel (ROI)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[768px]">
              <thead>
                <tr className="bg-slate-50">
                  <th className="py-2 px-3 text-left text-sm font-semibold text-slate-700">Channel</th>
                  {monthNames.map(month => (
                    <th key={month} className="py-2 px-3 text-left text-sm font-semibold text-slate-700">{month}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapData.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-t border-slate-100">
                    <td className="py-2 px-3">
                      <ChannelColorBadge channel={row.channel} />
                    </td>
                    {monthNames.map(month => {
                      const value = row[month];
                      // Calculate color intensity based on ROI value (higher = more intense)
                      const maxROI = 4; // Adjust this based on your data range
                      const intensity = Math.min(value / maxROI, 1);
                      const backgroundColor = value > 0 
                        ? `rgba(${22}, ${163}, ${74}, ${intensity * 0.3})` // Green for positive
                        : `rgba(${220}, ${38}, ${38}, ${Math.abs(intensity) * 0.3})`; // Red for negative
                      
                      return (
                        <td 
                          key={month} 
                          className="py-2 px-3 text-center"
                          style={{ backgroundColor }}
                        >
                          {value.toFixed(1)}x
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Contribution Composition (Stacked Area Chart) */}
        <div className="card">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <LineChartIcon size={18} className="text-primary-600" />
            Contribution Composition
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={areaChartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
                {channelData.map(channel => (
                  <Area
                    key={channel.channel}
                    type="monotone"
                    dataKey={channel.channel}
                    stackId="1"
                    stroke={channel.color}
                    fill={channel.lightColor}
                  />
                ))}
                {/* Total line */}
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#000000"
                  strokeDasharray="5 5"
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* YoY Waterfall Chart */}
      <div className="card">
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          <BarChartIcon size={18} className="text-primary-600" />
          Year-over-Year Performance
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={waterfallData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(name) => `${name}`}
              />
              <Bar dataKey="value" fill="#3B82F6">
                {waterfallData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.isTotal ? '#1E40AF' :
                      entry.value > 0 ? '#22C55E' :
                      entry.value < 0 ? '#EF4444' : '#3B82F6'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <footer className="mt-8 text-center text-sm text-slate-500">
        © 2025 All rights reserved. Powered by eleven strategy.
      </footer>
      
      {showInsights && (
        <InsightModal 
          country={filters.country} 
          brand={filters.brand} 
          onClose={() => setShowInsights(false)} 
        />
      )}
    </div>
  );
};

export default RecapTab;