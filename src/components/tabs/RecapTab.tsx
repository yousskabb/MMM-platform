import React, { useState } from 'react';
import {
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  LineChart as LineChartIcon,
  Euro,
  TrendingUp,
  FileText
} from 'lucide-react';
import KPICard from '../ui/KPICard';
import { FilterState } from '../../types';
import {
  PieChart,
  Pie,
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
  ComposedChart,
  Area
} from 'recharts';
import { filterDataByYear, isDataLoaded } from '../../data/dataService';
import ChannelColorBadge from '../ui/ChannelColorBadge';

interface RecapTabProps {
  filters: FilterState;
}

const RecapTab: React.FC<RecapTabProps> = ({ filters }) => {
  const [showInsights, setShowInsights] = useState(false);

  // Check if data is loaded before trying to use it
  if (!isDataLoaded()) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Loading data...</p>
      </div>
    );
  }

  // Get current year and previous year data
  const currentYear = filters.selectedYear;
  const previousYear = currentYear - 1;

  // Get current year data
  const { channelData, contributions: weeklyContributions } = filterDataByYear(currentYear);

  console.log(`RecapTab: Data for year ${currentYear}:`, {
    channelDataLength: channelData.length,
    weeklyContributionsLength: weeklyContributions.length,
    totalInvestment: channelData.reduce((sum, channel) => sum + channel.investment, 0),
    totalContribution: channelData.reduce((sum, channel) => sum + channel.contribution, 0)
  });

  // Get previous year data (if available)
  let previousYearData: any = null;
  try {
    previousYearData = filterDataByYear(previousYear);
  } catch (error) {
    // If previous year data is not available, create mock data
    previousYearData = {
      channelData: channelData.map(channel => ({
        ...channel,
        investment: channel.investment * 0.9,
        contribution: channel.contribution * 0.9
      })),
      contributions: weeklyContributions.map(week => ({
        ...week,
        sales: (week.sales as number) * 0.9
      }))
    };
  }

  // Calculate KPI values from current year filtered data
  const totalInvestment = channelData.reduce((sum, channel) => sum + channel.investment, 0);
  const investmentGrowth = 12; // Static for now

  // Calculate total sell out as sum of Sales column for the selected year
  const totalSellOut = weeklyContributions.reduce((sum, week) => sum + (Number(week.sales) || 0), 0);
  const sellOutGrowth = 8; // Static for now

  // Calculate total contribution (sum of all variable contributions, excluding Sales and Base)
  const totalContribution = channelData.reduce((sum, channel) => sum + channel.contribution, 0);
  const actionableGrowth = 15; // Static for now

  // Calculate ROI as total contributions divided by total investments
  const totalROI = totalInvestment > 0 ? parseFloat((totalContribution / totalInvestment).toFixed(2)) : 0;
  const roiGrowth = 5; // Static for now

  // Calculate actionable sell out (sum of all contributions excluding base and sales)
  const actionableSellOut = totalContribution;

  // Prepare data for investment pie chart (only current year data)
  const investmentPieData = channelData.map(channel => ({
    name: channel.channel,
    value: channel.investment,
    color: channel.color
  }));

  // Prepare data for contribution pie chart (only current year data)
  const contributionPieData = channelData.map(channel => ({
    name: channel.channel,
    value: channel.contribution,
    color: channel.color
  }));

  // Prepare weekly contribution data for chart (only current year data)
  const weeklyContributionData = weeklyContributions.map(week => {
    const chartData: any = {
      date: week.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
      formattedDate: week.date.toLocaleDateString(), // For display
      base: week.base,
      sales: week.sales
    };

    // Add each variable's contribution
    channelData.forEach(channel => {
      chartData[channel.channel] = week[channel.channel] as number;
    });

    return chartData;
  });

  // Calculate Y-1 vs Y waterfall data
  const generateWaterfallData = () => {
    // Get previous year sales total
    const prevYearSales = previousYearData.contributions.reduce((sum: number, week: any) => sum + (Number(week.sales) || 0), 0);

    // Get current year sales total
    const currentYearSales = totalSellOut;

    // Calculate sales difference
    const salesDifference = currentYearSales - prevYearSales;

    // Calculate channel differences
    const channelDifferences = channelData.map(channel => {
      const prevChannel = previousYearData.channelData.find((p: any) => p.channel === channel.channel);
      const prevContribution = prevChannel?.contribution || 0;
      const currentContribution = channel.contribution;
      const difference = currentContribution - prevContribution;

      return {
        channel: channel.channel,
        difference: difference,
        color: channel.color
      };
    });

    // Calculate total channel differences
    const totalChannelDifferences = channelDifferences.reduce((sum, item) => sum + item.difference, 0);

    // Calculate unexplained variance (difference between sales change and channel changes)
    const unexplainedVariance = salesDifference - totalChannelDifferences;

    // Create waterfall data
    const waterfallData = [
      {
        name: `${previousYear} Sales`,
        value: prevYearSales,
        base: 0,
        step: prevYearSales,
        isTotal: true,
        displayValue: prevYearSales
      }
    ];

    // Add channel differences
    channelDifferences.forEach(channel => {
      waterfallData.push({
        name: channel.channel,
        value: channel.difference,
        base: 0,
        step: channel.difference,
        isTotal: false,
        displayValue: channel.difference,
        color: channel.color
      });
    });

    // Add unexplained variance
    waterfallData.push({
      name: 'Unexplained Variance',
      value: unexplainedVariance,
      base: 0,
      step: unexplainedVariance,
      isTotal: false,
      displayValue: unexplainedVariance,
      color: '#94a3b8'
    });

    // Add current year total
    waterfallData.push({
      name: `${currentYear} Sales`,
      value: currentYearSales,
      base: 0,
      step: currentYearSales,
      isTotal: true,
      displayValue: currentYearSales
    });

    return waterfallData;
  };

  const waterfallData = generateWaterfallData();

  // Process the waterfall data to create base values for stacking
  const processedWaterfallData = waterfallData.map((item, index) => {
    if (index === 0) {
      // First item (Y-1 Sales) - base is 0
      return item;
    } else if (item.isTotal) {
      // Final item (Y Sales) - base is 0, full bar
      return item;
    } else {
      // Calculate the cumulative sum of all previous steps
      const previousTotal = waterfallData
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

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
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

      {/* 1. KPI Cards with correct calculations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Investments"
          value={parseFloat(totalInvestment.toFixed(1))}
          indicator={investmentGrowth}
          icon={<Euro size={20} />}
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

      {/* 2. Channel Allocation Pie Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Investment Pie Chart */}
        <div className="card">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <PieChartIcon size={18} className="text-primary-600" />
            Investment Allocation
          </h3>
          <div className={`h-${Math.max(64, Math.min(96, 64 + (investmentPieData.length - 5) * 4))}`}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={investmentPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={investmentPieData.length > 8 ? 60 : 80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={investmentPieData.length <= 8 ? ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%` : false}
                >
                  {investmentPieData.map((entry, index) => (
                    <Cell key={`investment-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend
                  layout={investmentPieData.length > 8 ? "horizontal" : "vertical"}
                  verticalAlign={investmentPieData.length > 8 ? "bottom" : "middle"}
                  align={investmentPieData.length > 8 ? "center" : "right"}
                  wrapperStyle={investmentPieData.length > 8 ? { paddingTop: '20px' } : {}}
                  content={({ payload }) => (
                    <ul className={`${investmentPieData.length > 8 ? 'flex flex-wrap gap-2 justify-center' : 'space-y-2'}`}>
                      {payload?.map((entry, index) => (
                        <li key={`investment-legend-${index}`} className="flex items-center gap-2">
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

        {/* Contribution Pie Chart */}
        <div className="card">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <PieChartIcon size={18} className="text-green-600" />
            Contribution Allocation
          </h3>
          <div className={`h-${Math.max(64, Math.min(96, 64 + (contributionPieData.length - 5) * 4))}`}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={contributionPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={contributionPieData.length > 8 ? 60 : 80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={contributionPieData.length <= 8 ? ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%` : false}
                >
                  {contributionPieData.map((entry, index) => (
                    <Cell key={`contribution-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend
                  layout={contributionPieData.length > 8 ? "horizontal" : "vertical"}
                  verticalAlign={contributionPieData.length > 8 ? "bottom" : "middle"}
                  align={contributionPieData.length > 8 ? "center" : "right"}
                  wrapperStyle={contributionPieData.length > 8 ? { paddingTop: '20px' } : {}}
                  content={({ payload }) => (
                    <ul className={`${contributionPieData.length > 8 ? 'flex flex-wrap gap-2 justify-center' : 'space-y-2'}`}>
                      {payload?.map((entry, index) => (
                        <li key={`contribution-legend-${index}`} className="flex items-center gap-2">
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
      </div>

      {/* 3. Weekly Contribution Chart */}
      <div className="card">
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          <LineChartIcon size={18} className="text-primary-600" />
          Weekly Contribution Trends
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={weeklyContributionData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short' })}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={(value) => `€${(value / 1000).toFixed(0)}K`}
                tick={{ fontSize: 11 }}
                width={45}
              />
              <Tooltip
                formatter={(value, name) => [formatCurrency(value as number), name]}
                labelFormatter={(label) => {
                  const date = new Date(label);
                  return date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  });
                }}
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
              {channelData.map((channel, index) => (
                <Area
                  key={channel.channel}
                  type="monotone"
                  dataKey={channel.channel}
                  stackId="1"
                  stroke={channel.color}
                  fill={channel.color}
                  name={channel.channel}
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

      {/* 4. Y-1 vs Y Waterfall Chart */}
      <div className="card">
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          <BarChartIcon size={18} className="text-primary-600" />
          Year-over-Year Performance: {previousYear} vs {currentYear}
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={processedWaterfallData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              barCategoryGap={4}
            >
              <defs>
                <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E5E7EB" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#E5E7EB" stopOpacity={0.6} />
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
                  { value: 'Total Value', type: 'square', color: '#D1D5DB' },
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
                {processedWaterfallData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.isTotal ? 'url(#colorTotal)' :
                        entry.step > 0 ? 'url(#colorPositive)' : 'url(#colorNegative)'
                    }
                    stroke={
                      entry.isTotal ? '#9CA3AF' :
                        entry.step > 0 ? '#16a34a' : '#dc2626'
                    }
                    strokeWidth={1}
                  />
                ))}
              </Bar>

              {/* Value labels for each bar */}
              {processedWaterfallData.map((entry, index) => {
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
                    fill={entry.isTotal ? '#4B5563' : (entry.step > 0 ? '#16a34a' : '#dc2626')}
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
    </div>
  );
};

export default RecapTab;