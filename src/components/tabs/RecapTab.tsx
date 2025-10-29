import React, { useState } from 'react';
import {
  BarChart as BarChartIcon,
  LineChart as LineChartIcon,
  Euro,
  TrendingUp,
  FileText
} from 'lucide-react';
import KPICard from '../ui/KPICard';
import { FilterState } from '../../types';
import {
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
  Area,
  LabelList
} from 'recharts';
import { filterDataByYear, isDataLoaded } from '../../data/dataService';
import { formatNumber, formatNumberDetailed, formatNumberAxis } from '../../utils/numberFormatter';
import { sendMessage, initializeConversation } from '../../services/conversationLLMService';

interface RecapTabProps {
  filters: FilterState;
  onReportGenerated?: (content: string) => void;
  onOpenReportTab?: () => void;
}

const RecapTab: React.FC<RecapTabProps> = ({ filters, onReportGenerated, onOpenReportTab }) => {
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

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

  // Function to generate business report
  const generateBusinessReport = async () => {
    console.log('Starting report generation...');
    setIsGeneratingReport(true);

    try {
      const apiEndpoint = import.meta.env.VITE_LLM_API_ENDPOINT;
      const apiKey = import.meta.env.VITE_LLM_API_KEY;

      console.log('API Endpoint:', apiEndpoint ? 'Set' : 'Not set');
      console.log('API Key:', apiKey ? 'Set' : 'Not set');

      if (!apiEndpoint || !apiKey) {
        console.log('Missing API credentials');
        alert('LLM API credentials not configured. Please set VITE_LLM_API_ENDPOINT and VITE_LLM_API_KEY in your environment variables.');
        return;
      }

      const reportPrompt = `Generate a professional Marketing Mix Modeling (MMM) Executive Report for ${currentYear}. This should read like a real business report written by a marketing analytics team for senior management.

WRITING STYLE REQUIREMENTS:
- Professional, business-focused tone - like a real corporate report
- No emojis or casual language
- Use business terminology and professional insights
- Write in past tense when describing results ("We invested €2.3M across 15 channels" not "The investment was €2.3M")
- Use "our", "we", "the company" when referring to the business
- Include executive summary language ("In summary", "Overall", "Notably")
- Sound confident and data-driven, not AI-generated
- Use specific numbers with proper formatting (€1.9M, 1.63x ROI)

REPORT STRUCTURE:

## Executive Summary
Brief high-level overview of the year's performance (2-3 paragraphs)

## Investment Performance
- Total investment analysis with year-over-year comparison
- Investment allocation breakdown by channel (use a table)
- Budget efficiency assessment

## Contribution Analysis
- Total contribution performance with growth metrics
- Channel-level contribution breakdown
- Effectiveness of marketing spend

## ROI Analysis
- Overall ROI performance
- Channel-by-channel ROI comparison (use a table)
- Identification of highest and lowest performing channels
- ROI optimization opportunities

## Performance Trends
- Year-over-year comparison with specific numbers
- Key performance indicators evolution
- Market and competitive context where applicable

## Strategic Recommendations
- 3-5 specific, actionable recommendations prioritized by impact
- Each recommendation should include: what, why, expected impact
- Use specific numbers and data to support each recommendation

Use actual numbers from the data provided in the context. Write as if you are presenting to the CEO and board of directors. Professional, authoritative, and data-driven.`;

      console.log('Initializing conversation...');
      // Initialize conversation if not already initialized
      const initResponse = await initializeConversation(filters, apiEndpoint, apiKey);
      console.log('Init response:', initResponse);

      if (!initResponse.success) {
        console.log('Init failed:', initResponse.error);
        alert(`Failed to initialize conversation: ${initResponse.error || 'Unknown error'}`);
        return;
      }

      console.log('Sending message...');
      const response = await sendMessage(reportPrompt, apiEndpoint, apiKey);
      console.log('Message response:', response);

      if (response.success && response.answer) {
        console.log('Report generated successfully, content length:', response.answer.length);
        console.log('First 200 chars:', response.answer.substring(0, 200));
        // Pass report content to parent and switch to report tab
        if (onReportGenerated && onOpenReportTab) {
          onReportGenerated(response.answer);
          onOpenReportTab();
        }
      } else {
        console.log('Report generation failed:', response.error);
        alert(`Error: ${response.error || 'Failed to generate report'}`);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert(`Error generating report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      console.log('Report generation completed');
      setIsGeneratingReport(false);
    }
  };

  // Get current year data
  const { channelData, contributions: weeklyContributions, monthlyData } = filterDataByYear(currentYear);

  console.log(`RecapTab: Data for year ${currentYear}:`, {
    channelDataLength: channelData.length,
    weeklyContributionsLength: weeklyContributions.length,
    totalInvestment: channelData.reduce((sum, channel) => sum + channel.investment, 0),
    totalContribution: channelData.reduce((sum, channel) => sum + channel.contribution, 0)
  });

  // Get previous year data (if available)
  let previousYearData: any = null;
  let hasRealPreviousYearData = false;

  try {
    previousYearData = filterDataByYear(previousYear);
    hasRealPreviousYearData = previousYearData.contributions.length > 0;
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
    hasRealPreviousYearData = false;
  }

  // Calculate KPI values from current year filtered data
  const totalInvestment = channelData.reduce((sum, channel) => sum + channel.investment, 0);

  // Calculate total sell out as sum of Sales column for the selected year
  const totalSellOut = weeklyContributions.reduce((sum, week) => sum + (Number(week.sales) || 0), 0);

  // Calculate total contribution (sum of all variable contributions, excluding Sales and Base)
  const totalContribution = channelData.reduce((sum, channel) => sum + channel.contribution, 0);

  // Calculate ROI as total contributions divided by total investments (exact value)
  const totalROIExact = totalInvestment > 0 ? totalContribution / totalInvestment : 0;
  // Round only for display
  const totalROI = parseFloat(totalROIExact.toFixed(2));

  // Calculate actionable sell out (sum of all contributions excluding base and sales)
  const actionableSellOut = totalContribution;

  // Calculate growth percentages by comparing with Y-1
  let investmentGrowth: number | null = null;
  let sellOutGrowth: number | null = null;
  let actionableGrowth: number | null = null;
  let roiGrowth: number | null = null;

  if (hasRealPreviousYearData && previousYearData) {
    // Calculate previous year KPIs
    const prevTotalInvestment = previousYearData.channelData.reduce((sum: number, channel: any) => sum + channel.investment, 0);
    const prevTotalSellOut = previousYearData.contributions.reduce((sum: number, week: any) => sum + (Number(week.sales) || 0), 0);
    const prevTotalContribution = previousYearData.channelData.reduce((sum: number, channel: any) => sum + channel.contribution, 0);
    const prevTotalROI = prevTotalInvestment > 0 ? prevTotalContribution / prevTotalInvestment : 0;
    const prevActionableSellOut = prevTotalContribution;

    // Calculate percentage changes
    investmentGrowth = prevTotalInvestment > 0 ? ((totalInvestment - prevTotalInvestment) / prevTotalInvestment) * 100 : 0;
    sellOutGrowth = prevTotalSellOut > 0 ? ((totalSellOut - prevTotalSellOut) / prevTotalSellOut) * 100 : 0;
    actionableGrowth = prevActionableSellOut > 0 ? ((actionableSellOut - prevActionableSellOut) / prevActionableSellOut) * 100 : 0;

    // ROI growth: ((Current ROI - Previous ROI) / Previous ROI) * 100
    // Use exact values for calculation (not rounded for display)
    roiGrowth = prevTotalROI > 0 ? ((totalROIExact - prevTotalROI) / prevTotalROI) * 100 : 0;

    // Debug logging for ROI calculation
    console.log('=== ROI GROWTH DEBUG ===');
    console.log('Previous Year (Y-1):');
    console.log(`  Total Investment: ${prevTotalInvestment.toLocaleString()}€`);
    console.log(`  Total Contribution: ${prevTotalContribution.toLocaleString()}€`);
    console.log(`  ROI (exact): ${prevTotalROI.toFixed(6)}`);
    console.log(`  ROI (display): ${prevTotalROI.toFixed(2)}x`);
    console.log('\nCurrent Year (Y):');
    console.log(`  Total Investment: ${totalInvestment.toLocaleString()}€`);
    console.log(`  Total Contribution: ${totalContribution.toLocaleString()}€`);
    console.log(`  ROI (exact): ${totalROIExact.toFixed(6)}`);
    console.log(`  ROI (display): ${totalROI.toFixed(2)}x`);
    console.log('\nGrowth Calculation:');
    console.log(`  Formula: ((exact ROI Y - exact ROI Y-1) / exact ROI Y-1) × 100`);
    console.log(`  Calculation: ((${totalROIExact.toFixed(6)} - ${prevTotalROI.toFixed(6)}) / ${prevTotalROI.toFixed(6)}) × 100`);
    console.log(`  Result: ${roiGrowth.toFixed(2)}%`);
    console.log('========================');
  }

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
  const weeklyContributionData = weeklyContributions.map((week, index) => {
    const chartData: any = {
      date: week.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
      formattedDate: week.date.toLocaleDateString(), // For display
      base: week.base,
      sales: week.sales,
      month: week.date.toLocaleDateString('en-US', { month: 'short' }),
      isFirstOfMonth: false
    };

    // Add each variable's contribution
    channelData.forEach(channel => {
      chartData[channel.channel] = week[channel.channel] as number;
    });

    // Check if this is the first week of a new month
    if (index === 0) {
      chartData.isFirstOfMonth = true;
    } else {
      const prevWeek = weeklyContributions[index - 1];
      const currentMonth = week.date.getMonth();
      const prevMonth = prevWeek.date.getMonth();
      chartData.isFirstOfMonth = currentMonth !== prevMonth;
    }

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

    // Add channel differences - only include channels with meaningful differences
    channelDifferences
      .filter(channel => Math.abs(channel.difference) > 1000) // Only show significant changes
      .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference)) // Sort by magnitude
      .forEach(channel => {
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

    // Add unexplained variance if significant
    if (Math.abs(unexplainedVariance) > 1000) {
      waterfallData.push({
        name: 'Unexplained',
        value: unexplainedVariance,
        base: 0,
        step: unexplainedVariance,
        isTotal: false,
        displayValue: unexplainedVariance,
        color: '#94a3b8'
      });
    }

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


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-slate-800">Marketing Performance Recap ({currentYear})</h1>
        <button
          onClick={generateBusinessReport}
          disabled={isGeneratingReport}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-semibold text-sm transition-colors duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
        >
          <FileText size={18} />
          {isGeneratingReport ? 'Generating...' : 'Generate Business Report'}
        </button>
      </div>

      {/* 1. KPI Cards with correct calculations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Investments"
          value={parseFloat(totalInvestment.toFixed(1))}
          indicator={investmentGrowth !== null ? investmentGrowth : undefined}
          previousYear={hasRealPreviousYearData ? previousYear : undefined}
          icon={<Euro size={20} />}
          color="primary-600"
        />
        <KPICard
          title="Total Sell-Out"
          value={parseFloat(totalSellOut.toFixed(1))}
          indicator={sellOutGrowth !== null ? sellOutGrowth : undefined}
          previousYear={hasRealPreviousYearData ? previousYear : undefined}
          icon={<BarChartIcon size={20} />}
          color="success-600"
        />
        <KPICard
          title="Actionable Sell-Out"
          value={parseFloat(actionableSellOut.toFixed(1))}
          indicator={actionableGrowth !== null ? actionableGrowth : undefined}
          previousYear={hasRealPreviousYearData ? previousYear : undefined}
          icon={<TrendingUp size={20} />}
          color="accent-600"
        />
        <KPICard
          title="Total ROI"
          value={`${totalROI}x`}
          indicator={roiGrowth !== null ? roiGrowth : undefined}
          previousYear={hasRealPreviousYearData ? previousYear : undefined}
          icon={<LineChartIcon size={20} />}
          color="secondary-600"
        />
      </div>

      {/* 2. Channel Allocation Bar Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Investment Bar Chart */}
        <div className="card">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <BarChartIcon size={18} className="text-primary-600" />
            Investment Allocation
          </h3>
          <div style={{ height: `${Math.max(300, investmentPieData.length * 35)}px` }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={investmentPieData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" tickFormatter={(value) => formatNumberAxis(value)} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={Math.max(120, Math.min(200, investmentPieData.length * 8))}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value: number) => formatNumberDetailed(value)}
                />
                <Bar dataKey="value" name="Investment">
                  {investmentPieData.map((entry, index) => (
                    <Cell key={`investment-cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Contribution Bar Chart */}
        <div className="card">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <BarChartIcon size={18} className="text-green-600" />
            Contribution Allocation
          </h3>
          <div style={{ height: `${Math.max(300, contributionPieData.length * 35)}px` }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={contributionPieData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" tickFormatter={(value) => formatNumberAxis(value)} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={Math.max(120, Math.min(200, contributionPieData.length * 8))}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value: number) => formatNumberDetailed(value)}
                />
                <Bar dataKey="value" name="Contribution">
                  {contributionPieData.map((entry, index) => (
                    <Cell key={`contribution-cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ROI by Channel Chart */}
        <div className="card">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <BarChartIcon size={18} className="text-orange-600" />
            ROI by Channel
          </h3>
          <div style={{ height: `${Math.max(300, channelData.length * 35)}px` }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={channelData.map(channel => ({
                  name: channel.channel,
                  roi: channel.roi,
                  color: channel.color
                }))}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis
                  type="number"
                  domain={[0, 'auto']}
                  tickFormatter={(value) => `${value.toFixed(1)}x`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={Math.max(120, Math.min(200, channelData.length * 8))}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value) => [`${(value as number).toFixed(2)}x`, 'ROI']}
                />
                <Bar dataKey="roi" name="ROI">
                  {channelData.map((entry, index) => (
                    <Cell key={`roi-cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
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
                tickFormatter={(value, index) => {
                  const dataPoint = weeklyContributionData[index];
                  return dataPoint?.isFirstOfMonth ? dataPoint.month : '';
                }}
                interval={0}
              />
              <YAxis
                tickFormatter={(value) => formatNumberAxis(value)}
                tick={{ fontSize: 11 }}
                width={60}
              />
              <Tooltip
                formatter={(value, name) => [formatNumberDetailed(value as number), name]}
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
        <div className="h-[600px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={processedWaterfallData}
              margin={{ top: 40, right: 30, left: 20, bottom: 100 }}
              barCategoryGap={10}
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
                tick={{ fontSize: 11, angle: -35, textAnchor: 'end' }}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                height={80}
                interval={0}
              />
              <YAxis
                tickFormatter={(value) => formatNumberAxis(value)}
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
                    const formattedValue = typeof displayValue === 'number' ? formatNumberDetailed(displayValue) : displayValue;
                    return displayValue === props.payload.value
                      ? [formattedValue]
                      : [`${sign}${formattedValue}`];
                  }
                  return [formatNumberDetailed(Number(value))];
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
                <LabelList
                  content={(props: any) => {
                    const { payload, index } = props;
                    if (!payload || index === undefined) return null;

                    const entry = processedWaterfallData[index];

                    // Don't show labels for total bars (grey ones)
                    if (entry.isTotal) return null;

                    // Skip tiny bars
                    const barHeight = Math.abs(entry.step);
                    const maxValue = Math.max(...processedWaterfallData.map(e => e.base + Math.abs(e.step)));
                    const minBarHeight = maxValue * 0.01;

                    if (barHeight < minBarHeight) return null;

                    // Format the label
                    let label = formatNumber(entry.displayValue || entry.step);
                    label = `${entry.step > 0 ? '+' : ''}${label}`;

                    return (
                      <text
                        x={props.x + props.width / 2}
                        y={props.y + props.height + 15}
                        fill={entry.step > 0 ? '#16a34a' : '#dc2626'}
                        textAnchor="middle"
                        fontSize={11}
                        fontWeight="600"
                      >
                        {label}
                      </text>
                    );
                  }}
                />
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
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>


    </div>
  );
};

export default RecapTab;