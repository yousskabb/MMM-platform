import React from 'react';
import { LineChart as LineChartIcon } from 'lucide-react';
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
    ResponsiveContainer
} from 'recharts';
import { getCachedData, isDataLoaded } from '../../data/dataService';
import { formatNumberAxis, formatNumberDetailed } from '../../utils/numberFormatter';

interface HistoricalAnalysisTabProps {
    filters: FilterState;
}

interface MonthlyData {
    month: string;
    totalContribution: number;
    sales: number;
    [key: string]: number | string;
}

const HistoricalAnalysisTab: React.FC<HistoricalAnalysisTabProps> = ({ filters }) => {
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

    // Aggregate weekly data into monthly data
    const monthlyData: MonthlyData[] = [];
    const monthlyMap = new Map<string, MonthlyData>();

    allContributions.forEach(week => {
        const monthKey = `${week.date.getFullYear()}-${String(week.date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = week.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

        if (!monthlyMap.has(monthKey)) {
            monthlyMap.set(monthKey, {
                month: monthName,
                totalContribution: 0,
                sales: 0,
                ...Object.fromEntries(contributionVariables.map(v => [v, 0]))
            });
        }

        const monthData = monthlyMap.get(monthKey)!;

        // Sum up all contribution variables for this week
        const weekContribution = contributionVariables.reduce((sum, variable) => {
            return sum + (week[variable] as number || 0);
        }, 0);

        monthData.totalContribution += weekContribution;
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

    // Get colors for variables
    const getVariableColor = (variable: string, index: number) => {
        const colors = [
            '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
            '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
        ];
        return colors[index % colors.length];
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <LineChartIcon size={24} className="text-blue-600" />
                <h1 className="text-2xl font-semibold text-slate-800">Historical Analysis</h1>
            </div>

            <div className="card">
                <h3 className="text-lg font-medium mb-4">Monthly Contribution Trends (All Years)</h3>
                <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            data={monthlyData}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="month"
                                tick={{ fontSize: 12 }}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                            />
                            <YAxis
                                tickFormatter={(value) => formatNumberAxis(value)}
                                tick={{ fontSize: 12 }}
                            />
                            <Tooltip
                                formatter={(value, name) => [
                                    formatNumberDetailed(value as number),
                                    name === 'totalContribution' ? 'Total Contribution' :
                                        name === 'sales' ? 'Sales' : name
                                ]}
                                labelFormatter={(label) => `Month: ${label}`}
                            />
                            <Legend />

                            {/* Area for total contribution */}
                            <Area
                                type="monotone"
                                dataKey="totalContribution"
                                name="Total Contribution"
                                fill="#3b82f6"
                                fillOpacity={0.3}
                                stroke="#3b82f6"
                                strokeWidth={2}
                            />

                            {/* Line for sales */}
                            <Line
                                type="monotone"
                                dataKey="sales"
                                name="Sales"
                                stroke="#ef4444"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Individual variable trends */}
            <div className="card">
                <h3 className="text-lg font-medium mb-4">Individual Channel Contributions (Monthly)</h3>
                <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            data={monthlyData}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="month"
                                tick={{ fontSize: 12 }}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                            />
                            <YAxis
                                tickFormatter={(value) => formatNumberAxis(value)}
                                tick={{ fontSize: 12 }}
                            />
                            <Tooltip
                                formatter={(value, name) => [
                                    formatNumberDetailed(value as number),
                                    name
                                ]}
                                labelFormatter={(label) => `Month: ${label}`}
                            />
                            <Legend />

                            {contributionVariables.map((variable, index) => (
                                <Line
                                    key={variable}
                                    type="monotone"
                                    dataKey={variable}
                                    name={variable}
                                    stroke={getVariableColor(variable, index)}
                                    strokeWidth={2}
                                    dot={{ fill: getVariableColor(variable, index), strokeWidth: 2, r: 3 }}
                                />
                            ))}
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default HistoricalAnalysisTab;
