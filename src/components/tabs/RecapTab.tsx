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
  Line,
  ReferenceLine
} from 'recharts';
import { filterData, generateInsights } from '../../data/mockData';
import ChannelColorBadge from '../ui/ChannelColorBadge';
import OptimizationImpact from '../ui/OptimizationImpact';

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
  
  // Calculate KPI values from filtered data instead of using static values
  const totalInvestment = channelData.reduce((sum, channel) => sum + channel.investment, 0);
  const investmentGrowth = 12; // Static for now
  
  const totalRevenue = channelData.reduce((sum, channel) => sum + channel.revenue, 0);
  const totalSellOut = totalRevenue; // Using revenue as sell-out
  const sellOutGrowth = 8; // Static for now
  
  const totalContribution = channelData.reduce((sum, channel) => sum + channel.contribution, 0);
  const actionableSellOut = totalContribution; // Using contribution as actionable sell-out
  const actionableGrowth = 15; // Static for now
  
  const avgROI = parseFloat((totalRevenue / totalInvestment).toFixed(1));
  const totalROI = avgROI;
  const roiGrowth = 5; // Static for now
  
  // Prepare data for pie chart
  const pieData = channelData.map(channel => ({
    name: channel.channel,
    value: channel.investment,
    color: channel.color
  }));
  
  // Calculate online and offline media totals
  const onlineChannels = channelData.filter(channel => channel.mediaType === 'Online');
  const offlineChannels = channelData.filter(channel => channel.mediaType === 'Offline');
  
  const onlineInvestment = onlineChannels.reduce((sum, channel) => sum + channel.investment, 0);
  const offlineInvestment = offlineChannels.reduce((sum, channel) => sum + channel.investment, 0);
  
  // Calculate growth based on YOY values from channel data
  const avgOnlineYoyGrowth = onlineChannels.reduce((sum, channel) => sum + channel.yoyGrowth, 0) / onlineChannels.length;
  const avgOfflineYoyGrowth = offlineChannels.reduce((sum, channel) => sum + channel.yoyGrowth, 0) / offlineChannels.length;
  
  // Generate improved waterfall data for a proper waterfall chart
  const generateWaterfallData = () => {
    // Use filter-based values for better relevance
    const baseValue = totalRevenue * 0.85; // 2023 YTD (estimated as 85% of current revenue)
    const finalValue = totalRevenue; // 2024 YTD - matches Total Sell-Out
    
    // Calculate impact values using channel data
    const onlineMediaImpact = onlineInvestment * (avgOnlineYoyGrowth / 100);
    const offlineMediaImpact = offlineInvestment * (avgOfflineYoyGrowth / 100);
    
    // Create data with explicit base and value properties for stacking
    return [
      { 
        name: '2023 YTD', 
        value: baseValue, 
        base: 0,
        step: baseValue,
        isTotal: true,
        displayValue: baseValue
      },
      { 
        name: 'Base Growth', 
        value: totalRevenue * 0.025, // 2.5% impact
        base: 0,
        step: totalRevenue * 0.025,
        displayValue: totalRevenue * 0.025
      },
      { 
        name: 'New Products', 
        value: totalRevenue * 0.095, // 9.5% impact
        base: 0,
        step: totalRevenue * 0.095,
        displayValue: totalRevenue * 0.095
      },
      { 
        name: 'Pricing', 
        value: totalRevenue * 0.038, // 3.8% impact
        base: 0,
        step: totalRevenue * 0.038,
        displayValue: totalRevenue * 0.038
      },
      { 
        name: 'Distribution', 
        value: totalRevenue * -0.02, // -2% impact
        base: 0,
        step: totalRevenue * -0.02,
        displayValue: totalRevenue * -0.02
      },
      { 
        name: 'Online Media', 
        value: onlineMediaImpact,
        base: 0,
        step: onlineMediaImpact,
        displayValue: onlineMediaImpact
      },
      { 
        name: 'Offline Media', 
        value: offlineMediaImpact,
        base: 0,
        step: offlineMediaImpact,
        displayValue: offlineMediaImpact
      },
      { 
        name: '2024 YTD', 
        value: finalValue,
        base: 0,
        step: finalValue,
        isTotal: true,
        displayValue: finalValue
      }
    ];
  };

  const rawWaterfallData = generateWaterfallData();
  
  // Process the data to create base values for stacking
  const waterfallData = rawWaterfallData.map((item, index) => {
    if (index === 0) {
      // First item (2023 YTD) - base is 0
      return item;
    } else if (item.isTotal) {
      // Final item (2024 YTD) - base is 0, full bar
      return item;
    } else {
      // Calculate the cumulative sum of all previous steps
      const previousTotal = rawWaterfallData
        .slice(0, index)
        .reduce((sum, entry) => sum + entry.step, 0);
      
      // For positive values, base is previous total
      // For negative values, base is previous total + value (to make bar go down)
      return {
        ...item,
        base: item.step >= 0 ? previousTotal : previousTotal + item.step,
        displayTotal: previousTotal + item.step
      };
    }
  });
  
  // Prepare monthly data for the contribution composition (stacked area chart)
  const monthNames = [...new Set(monthlyData.map(item => item.month))];
  
  // Create more erratic data with base level and sales line
  const areaChartData = monthNames.map(month => {
    const monthData = monthlyData.filter(item => item.month === month);
    
    // Calculate original sum for reference
    const originalContributionSum = monthData.reduce((sum, item) => sum + item.contribution, 0);
    
    // Add volatility factors - higher values create more erratic patterns
    let volatilityFactor = 0.4; // Base volatility
    
    // Add specific peaks for November and December
    if (month === 'Nov') volatilityFactor = 0.8;
    if (month === 'Dec') volatilityFactor = 1.2;
    
    // Random factor for each month to create erratic patterns
    const randomFactor = 1 + (Math.random() * volatilityFactor * (Math.random() > 0.5 ? 1 : -1));
    
    // Add a base level that will be at the bottom of the stack
    const baseValue = originalContributionSum * 0.2; // Base is 20% of original total
    
    // Sales line that will be higher than the total contribution
    const salesValue = originalContributionSum * randomFactor * 1.3; // Sales 30% higher than contributions
    
    const result: any = { 
      month,
      // Add base as the first layer
      base: baseValue
    };
    
    // Add each channel's adjusted contribution to create more volatility
    monthData.forEach(item => {
      // Apply random variation to each channel based on month
      const channelVolatility = volatilityFactor * (Math.random() * 0.8 + 0.6);
      result[item.channel] = item.contribution * (1 + channelVolatility * (Math.random() > 0.5 ? 1 : -1));
    });
    
    // Total should be sum of all channels plus base
    result.total = Object.keys(result)
      .filter(key => key !== 'month' && key !== 'sales') // Exclude month and sales from total
      .reduce((sum, key) => sum + result[key], 0);
    
    // Add sales value
    result.sales = salesValue;
    
    return result;
  });
  
  // Channel colors with base added
  const channelColorsWithBase = {
    base: '#E5E7EB', // Light grey for base
    ...channelData.reduce((acc, channel) => ({
      ...acc,
      [channel.channel]: channel.lightColor
    }), {})
  };
  
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
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      notation: value >= 1000000 ? 'compact' : 'standard',
      maximumFractionDigits: 1
    }).format(value);
  };

  // Custom colors for optimization chart
  const optimizationColors = {
    currentAllocation: "#E5E7EB", // light grey
    optimizedAllocation: "#4B5563", // dark grey
    currentRevenue: "#86EFAC", // light green
    optimizedRevenue: "#16A34A"  // dark green
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
      
      {/* 1. KPI Cards with requested values */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title="Total Investments" 
          value={parseFloat(totalInvestment.toFixed(1))}
          indicator={investmentGrowth}
          icon={<DollarSign size={20} />}
          color="primary-600"
        />
        <KPICard 
          title="Total Sell-Out" 
          value={parseFloat(totalSellOut.toFixed(1))}
          indicator={sellOutGrowth}
          icon={<BarChartIcon size={20} />}
          color="success-600"
        />
        <KPICard 
          title="Actionable Sell-Out" 
          value={parseFloat(actionableSellOut.toFixed(1))}
          indicator={actionableGrowth}
          icon={<TrendingUp size={20} />}
          color="accent-600"
        />
        <KPICard 
          title="Total ROI" 
          value={`${totalROI}x`}
          indicator={roiGrowth}
          icon={<LineChartIcon size={20} />}
          color="secondary-600"
        />
      </div>
      
      {/* 2. Channel Allocation Pie Chart */}
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
      
      {/* 3. Contribution Composition (Stacked Area Chart) */}
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
              <YAxis 
                tickFormatter={(value) => `€${(value / 1000).toFixed(0)}K`}
                tick={{ fontSize: 11 }}
                width={45}
                domain={[0, (dataMax: number) => dataMax * 1.1]} // Increase max to show sales line
              />
              <Tooltip 
                formatter={(value) => formatCurrency(value as number)}
                itemSorter={(item) => {
                  // Put base at the bottom of the tooltip
                  if (item.dataKey === 'base') return -1;
                  // Put sales at the top
                  if (item.dataKey === 'sales') return 1;
                  return 0;
                }}
              />
              <Legend />
              
              {/* Base area at the bottom */}
              <Area
                type="monotone"
                dataKey="base"
                stackId="1"
                stroke="#9CA3AF"
                fill="#E5E7EB"
                name="Base"
              />
              
              {/* Channel areas stacked on top of base */}
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
              
              {/* Total contribution line */}
              <Line
                type="monotone"
                dataKey="total"
                stroke="#000000"
                strokeDasharray="5 5"
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              
              {/* Sales line at the top */}
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#000000"
                strokeWidth={2}
                strokeDasharray="8 4"
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                name="Sales"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* 4. YoY Waterfall Chart */}
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
              barCategoryGap={4}
            >
              <defs>
                <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.6}/>
                </linearGradient>
                <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.6}/>
                </linearGradient>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E5E7EB" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#E5E7EB" stopOpacity={0.6}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }} 
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <YAxis 
                tickFormatter={(value) => formatCurrency(value)} 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                domain={[0, 'dataMax * 1.05']}
              />
              <Tooltip
                formatter={(value, name, props) => {
                  if (name === 'base') return []; // Don't show base in tooltip
                  if (props?.payload?.displayValue) {
                    const displayValue = props.payload.displayValue;
                    const sign = displayValue >= 0 ? '+' : '';
                    const formattedValue = typeof displayValue === 'number' ? formatCurrency(displayValue) : displayValue;
                    return displayValue === props.payload.value 
                      ? [formattedValue] 
                      : [`${sign}${formattedValue}`];
                  }
                  return [formatCurrency(Number(value))];
                }}
                labelFormatter={(name) => `${name}`}
                cursor={{ fill: 'rgba(203, 213, 225, 0.1)' }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: 20 }}
                payload={[
                  { value: 'Total Value', type: 'square', color: '#D1D5DB' }, // Light grey
                  { value: 'Positive Impact', type: 'square', color: '#22c55e' },
                  { value: 'Negative Impact', type: 'square', color: '#ef4444' }
                ]}
              />
              
              {/* Base bars - invisible placeholders */}
              <Bar 
                dataKey="base" 
                stackId="stack"
                fill="transparent"
                stroke="transparent"
              />
              
              {/* Value bars - visible components */}
              <Bar 
                dataKey="step" 
                name="value"
                stackId="stack"
                radius={[4, 4, 0, 0]}
              >
                {waterfallData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.isTotal ? 'url(#colorTotal)' :
                      entry.step > 0 ? 'url(#colorPositive)' : 'url(#colorNegative)'
                    }
                    stroke={
                      entry.isTotal ? '#9CA3AF' : // Grey stroke for YTD bars
                      entry.step > 0 ? '#16a34a' : '#dc2626'
                    }
                    strokeWidth={1}
                  />
                ))}
              </Bar>
              
              {/* Connecting lines between bars */}
              {waterfallData.map((entry, index) => {
                // Don't draw connector after the last bar
                if (index < waterfallData.length - 1) {
                  const currentTotal = entry.base + entry.step;
                  const nextItem = waterfallData[index + 1];
                  
                  // For totals don't draw to next bar
                  if (entry.isTotal) return null;
                  
                  return (
                    <ReferenceLine
                      key={`connector-${index}`}
                      x={index}
                      y={currentTotal}
                      stroke="#94a3b8"
                      strokeDasharray="3 3"
                      segment={[
                        { x: index + 0.5, y: currentTotal },
                        { x: index + 1 - 0.5, y: currentTotal }
                      ]}
                    />
                  );
                }
                return null;
              })}
              
              {/* Value labels for each bar */}
              {waterfallData.map((entry, index) => {
                // Position for the label
                const y = entry.base + (entry.step / 2);
                let label = formatCurrency(entry.displayValue || entry.step);
                
                // Special formatting for interim steps (not totals)
                if (!entry.isTotal && index > 0) {
                  label = `${entry.step > 0 ? '+' : ''}${label}`;
                }
                
                return (
                  <text
                    key={`label-${index}`}
                    x={index + 0.5}
                    y={entry.step > 0 ? y - 15 : y + 15}
                    fill={entry.isTotal ? '#4B5563' : (entry.step > 0 ? '#16a34a' : '#dc2626')} // Darker grey for total labels
                    textAnchor="middle"
                    fontSize={12}
                    fontWeight="500"
                  >
                    {label}
                  </text>
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* 5. Performance Heatmap */}
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
      
      {/* 6. Optimization Impact Component */}
      <OptimizationImpact chartColors={optimizationColors} />

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