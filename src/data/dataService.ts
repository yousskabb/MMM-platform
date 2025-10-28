import { parseExcelFile, filterDataByDateRange, aggregateDataByVariable, ParsedExcelData, WeeklyData } from '../utils/excelParser';
import { getVariableColors, getLightColor } from '../utils/colorGenerator';
import { YearlyData } from '../types';

export interface ChannelData {
    channel: string;
    mediaType: 'Online' | 'Offline';
    color: string;
    lightColor: string;
    investment: number;
    roi: number;
    revenue: number;
    contribution: number;
    yoyGrowth: number;
}

export interface MonthlyChannelData extends ChannelData {
    month: string;
    value: number;
}

export interface FilteredData {
    channelData: ChannelData[];
    monthlyData: MonthlyChannelData[];
    contributions: WeeklyData[];
    investments: WeeklyData[];
    dateRange: { min: Date; max: Date };
    variables: string[];
}

// Global data cache
let cachedData: ParsedExcelData | null = null;
let isLoading = false;

/**
 * Load Excel data and cache it
 */
export async function loadExcelData(): Promise<void> {
    if (cachedData || isLoading) {
        return;
    }

    isLoading = true;

    try {
        // Load Excel file from public/data folder
        cachedData = await parseExcelFile('/MMM-platform/data/data.xlsx');
    } catch (error) {
        throw error;
    } finally {
        isLoading = false;
    }
}

/**
 * Get filtered data based on year
 */
export function filterDataByYear(year: number): YearlyData {
    if (!cachedData) {
        throw new Error('Excel data not loaded. Call loadExcelData() first.');
    }

    // Create date range for the entire year
    const startDate = new Date(year, 0, 1); // January 1st
    const endDate = new Date(year, 11, 31); // December 31st

    // Filter investment and contribution data by year
    const filteredInvestments = filterDataByDateRange(cachedData.investments, startDate, endDate);
    const filteredContributions = filterDataByDateRange(cachedData.contributions, startDate, endDate);

    // Aggregate data by variable
    const investmentTotals = aggregateDataByVariable(filteredInvestments, cachedData.variables);
    const contributionTotals = aggregateDataByVariable(filteredContributions, cachedData.variables);

    // Get variable colors
    const variableColors = getVariableColors(cachedData.variables);

    // Create channel data
    const channelData: ChannelData[] = cachedData.variables.map(variable => {
        const investment = investmentTotals[variable];
        const contribution = contributionTotals[variable];
        const roi = investment > 0 ? contribution / investment : 0;

        // Determine media type (simplified logic - you can enhance this)
        const mediaType: 'Online' | 'Offline' =
            variable.toLowerCase().includes('digital') ||
                variable.toLowerCase().includes('online') ||
                variable.toLowerCase().includes('social') ||
                variable.toLowerCase().includes('search') ||
                variable.toLowerCase().includes('display')
                ? 'Online'
                : 'Offline';

        return {
            channel: variable,
            mediaType,
            color: variableColors[variable],
            lightColor: getLightColor(variableColors[variable]),
            investment,
            roi,
            revenue: contribution, // In MMM context, contribution is often used as revenue
            contribution,
            yoyGrowth: 0 // TODO: Calculate YoY growth from historical data
        };
    });

    // Create monthly data from actual weekly data
    const monthlyData: MonthlyChannelData[] = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Initialize monthly totals for each channel
    const monthlyTotals: { [key: string]: { [month: string]: { investment: number; contribution: number } } } = {};

    cachedData.variables.forEach(variable => {
        monthlyTotals[variable] = {};
        months.forEach(month => {
            monthlyTotals[variable][month] = { investment: 0, contribution: 0 };
        });
    });

    // Aggregate weekly data by month
    filteredInvestments.forEach(week => {
        const monthIndex = week.date.getMonth();
        const monthName = months[monthIndex];

        cachedData!.variables.forEach(variable => {
            monthlyTotals[variable][monthName].investment += (week[variable] as number) || 0;
        });
    });

    filteredContributions.forEach(week => {
        const monthIndex = week.date.getMonth();
        const monthName = months[monthIndex];

        cachedData!.variables.forEach(variable => {
            monthlyTotals[variable][monthName].contribution += (week[variable] as number) || 0;
        });
    });

    // Create monthly data entries
    cachedData!.variables.forEach(variable => {
        months.forEach(month => {
            const monthlyInvestment = monthlyTotals[variable][month].investment;
            const monthlyContribution = monthlyTotals[variable][month].contribution;
            const roi = monthlyInvestment > 0 ? monthlyContribution / monthlyInvestment : 0;

            monthlyData.push({
                channel: variable,
                month,
                mediaType: channelData.find(c => c.channel === variable)?.mediaType || 'Offline',
                color: variableColors[variable],
                lightColor: getLightColor(variableColors[variable]),
                investment: monthlyInvestment,
                roi,
                revenue: monthlyContribution,
                contribution: monthlyContribution,
                yoyGrowth: 0,
                value: roi
            });
        });
    });

    return {
        year,
        channelData,
        monthlyData,
        contributions: filteredContributions,
        investments: filteredInvestments,
        variables: cachedData.variables
    };
}

/**
 * Get filtered data based on date range (legacy function for backward compatibility)
 */
export function filterData(startDate: Date, endDate: Date): FilteredData {
    if (!cachedData) {
        throw new Error('Excel data not loaded. Call loadExcelData() first.');
    }

    // Filter investment and contribution data by date range
    const filteredInvestments = filterDataByDateRange(cachedData.investments, startDate, endDate);
    const filteredContributions = filterDataByDateRange(cachedData.contributions, startDate, endDate);

    // Aggregate data by variable
    const investmentTotals = aggregateDataByVariable(filteredInvestments, cachedData.variables);
    const contributionTotals = aggregateDataByVariable(filteredContributions, cachedData.variables);

    // Get variable colors
    const variableColors = getVariableColors(cachedData.variables);

    // Create channel data
    const channelData: ChannelData[] = cachedData.variables.map(variable => {
        const investment = investmentTotals[variable];
        const contribution = contributionTotals[variable];
        const roi = investment > 0 ? contribution / investment : 0;

        // Determine media type (simplified logic - you can enhance this)
        const mediaType: 'Online' | 'Offline' =
            variable.toLowerCase().includes('digital') ||
                variable.toLowerCase().includes('online') ||
                variable.toLowerCase().includes('social') ||
                variable.toLowerCase().includes('search') ||
                variable.toLowerCase().includes('display')
                ? 'Online'
                : 'Offline';

        return {
            channel: variable,
            mediaType,
            color: variableColors[variable],
            lightColor: getLightColor(variableColors[variable]),
            investment,
            roi,
            revenue: contribution, // In MMM context, contribution is often used as revenue
            contribution,
            yoyGrowth: 0 // TODO: Calculate YoY growth from historical data
        };
    });

    // Create monthly data (simplified - you can enhance this to show actual monthly breakdown)
    const monthlyData: MonthlyChannelData[] = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    cachedData.variables.forEach(variable => {
        months.forEach(month => {
            // For now, distribute yearly totals evenly across months
            // In a real implementation, you'd use actual monthly data
            const monthlyInvestment = investmentTotals[variable] / 12;
            const monthlyContribution = contributionTotals[variable] / 12;
            const roi = monthlyInvestment > 0 ? monthlyContribution / monthlyInvestment : 0;

            monthlyData.push({
                channel: variable,
                month,
                mediaType: channelData.find(c => c.channel === variable)?.mediaType || 'Offline',
                color: variableColors[variable],
                lightColor: getLightColor(variableColors[variable]),
                investment: monthlyInvestment,
                roi,
                revenue: monthlyContribution,
                contribution: monthlyContribution,
                yoyGrowth: 0,
                value: roi
            });
        });
    });

    return {
        channelData,
        monthlyData,
        contributions: filteredContributions,
        investments: filteredInvestments,
        dateRange: { min: startDate, max: endDate },
        variables: cachedData.variables
    };
}

/**
 * Get available date range from Excel data
 */
export function getAvailableDateRange(): { min: Date; max: Date } | null {
    return cachedData?.dateRange || null;
}

/**
 * Get available variables from Excel data
 */
export function getAvailableVariables(): string[] {
    return cachedData?.variables || [];
}

/**
 * Get all available dates from Excel data
 */
export function getAvailableDates(): Date[] {
    if (!cachedData) {
        return [];
    }

    // Combine dates from both investments and contributions
    const allDates = new Set<string>();

    cachedData.investments.forEach(row => {
        if (row.date) {
            allDates.add(row.date.toISOString().split('T')[0]); // Get YYYY-MM-DD format
        }
    });

    cachedData.contributions.forEach(row => {
        if (row.date) {
            allDates.add(row.date.toISOString().split('T')[0]); // Get YYYY-MM-DD format
        }
    });

    // Convert back to Date objects and sort
    return Array.from(allDates)
        .map(dateStr => new Date(dateStr))
        .sort((a, b) => a.getTime() - b.getTime());
}

/**
 * Get all available years from Excel data
 */
export function getAvailableYears(): number[] {
    if (!cachedData) {
        return [];
    }

    const years = new Set<number>();

    // Extract years from investments data
    cachedData.investments.forEach(row => {
        if (row.date) {
            years.add(row.date.getFullYear());
        }
    });

    // Extract years from contributions data
    cachedData.contributions.forEach(row => {
        if (row.date) {
            years.add(row.date.getFullYear());
        }
    });

    // Convert to array and sort
    const availableYears = Array.from(years).sort((a, b) => a - b);
    return availableYears;
}

/**
 * Check if data is loaded
 */
export function isDataLoaded(): boolean {
    return cachedData !== null;
}

/**
 * Check if data is currently loading
 */
export function isDataLoading(): boolean {
    return isLoading;
}

/**
 * Clear cached data (useful for testing or when file changes)
 */
export function clearCachedData(): void {
    cachedData = null;
    isLoading = false;
}

/**
 * Generate insights based on the filtered data
 */
export function generateInsights(startDate: Date, endDate: Date): string[] {
    const data = filterData(startDate, endDate);
    const insights: string[] = [];

    // Calculate total metrics
    const totalInvestment = data.channelData.reduce((sum, channel) => sum + channel.investment, 0);
    const totalContribution = data.channelData.reduce((sum, channel) => sum + channel.contribution, 0);
    const avgROI = totalInvestment > 0 ? totalContribution / totalInvestment : 0;

    // Find top performing channel
    const topChannel = data.channelData.reduce((top, current) =>
        current.roi > top.roi ? current : top, data.channelData[0]);

    // Find highest investment channel
    const highestInvestmentChannel = data.channelData.reduce((top, current) =>
        current.investment > top.investment ? current : top, data.channelData[0]);

    insights.push(`Total investment across all channels: ${formatCurrency(totalInvestment)}`);
    insights.push(`Total contribution across all channels: ${formatCurrency(totalContribution)}`);
    insights.push(`Average ROI across all channels: ${avgROI.toFixed(2)}x`);

    if (topChannel) {
        insights.push(`Top performing channel by ROI: ${topChannel.channel} (${topChannel.roi.toFixed(2)}x)`);
    }

    if (highestInvestmentChannel) {
        insights.push(`Highest investment channel: ${highestInvestmentChannel.channel} (${formatCurrency(highestInvestmentChannel.investment)})`);
    }

    return insights;
}

/**
 * Format currency values
 */
function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-EU', {
        style: 'currency',
        currency: 'EUR',
        notation: value >= 1000000 ? 'compact' : 'standard',
        maximumFractionDigits: 1
    }).format(value);
}

/**
 * Get comprehensive data context for LLM
 */
export function getLLMContext(filters: FilterState): any {
    if (!cachedData) {
        return null;
    }

    const availableYears = getAvailableYears();
    const yearlyData = filterDataByYear(filters.selectedYear);

    // Calculate KPIs for selected year
    const totalInvestment = yearlyData.channelData.reduce((sum, ch) => sum + ch.investment, 0);
    const totalContribution = yearlyData.channelData.reduce((sum, ch) => sum + ch.contribution, 0);
    const totalROI = totalInvestment > 0 ? totalContribution / totalInvestment : 0;

    // Get data for all available years
    const allYearsData = availableYears.map(year => {
        const yearData = filterDataByYear(year);
        const yearInvestment = yearData.channelData.reduce((sum, ch) => sum + ch.investment, 0);
        const yearContribution = yearData.channelData.reduce((sum, ch) => sum + ch.contribution, 0);
        const yearROI = yearInvestment > 0 ? yearContribution / yearInvestment : 0;
        const yearSellOut = yearData.contributions.reduce((sum, week) => sum + (week.sales || 0), 0);

        return {
            year,
            totalInvestment: yearInvestment,
            totalContribution: yearContribution,
            totalROI: yearROI,
            totalSellOut: yearSellOut,
            channelPerformance: yearData.channelData.map(channel => ({
                channel: channel.channel,
                investment: channel.investment,
                contribution: channel.contribution,
                roi: channel.roi,
                mediaType: channel.mediaType
            })),
            monthlyPerformance: yearData.monthlyData.reduce((acc, item) => {
                if (!acc[item.channel]) {
                    acc[item.channel] = {};
                }
                acc[item.channel][item.month] = {
                    investment: item.investment,
                    contribution: item.contribution,
                    roi: item.roi
                };
                return acc;
            }, {} as any)
        };
    });

    // Get previous year data for comparison
    const prevYear = filters.selectedYear - 1;
    const prevYearData = availableYears.includes(prevYear) ? filterDataByYear(prevYear) : null;

    return {
        // Basic context
        context: {
            selectedYear: filters.selectedYear,
            country: filters.country,
            brand: filters.brand,
            availableYears,
            previousYear: prevYear,
            hasPreviousYearData: !!prevYearData
        },

        // Selected Year KPIs
        selectedYearKPIs: {
            totalInvestment,
            totalContribution,
            totalROI,
            totalSellOut: yearlyData.contributions.reduce((sum, week) => sum + (week.sales || 0), 0),
            actionableSellOut: totalContribution
        },

        // All Years Data
        allYearsData,

        // Selected Year Channel Performance
        selectedYearChannelPerformance: yearlyData.channelData.map(channel => ({
            channel: channel.channel,
            investment: channel.investment,
            contribution: channel.contribution,
            roi: channel.roi,
            mediaType: channel.mediaType
        })),




        // Weekly Trends
        weeklyTrends: {
            contributions: yearlyData.contributions.slice(-12), // Last 12 weeks
            investments: yearlyData.investments.slice(-12)
        },

        // Variables list
        variables: yearlyData.variables
    };
}

/**
 * Calculate correlations between channels
 */
function calculateCorrelations(contributions: WeeklyData[], variables: string[]): any {
    const correlations: any = {};

    for (let i = 0; i < variables.length; i++) {
        for (let j = i + 1; j < variables.length; j++) {
            const var1 = variables[i];
            const var2 = variables[j];

            const values1 = contributions.map(week => week[var1] as number || 0);
            const values2 = contributions.map(week => week[var2] as number || 0);

            const correlation = calculatePearsonCorrelation(values1, values2);
            correlations[`${var1}_${var2}`] = correlation;
        }
    }

    return correlations;
}

/**
 * Calculate Pearson correlation coefficient
 */
function calculatePearsonCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    if (n === 0) return 0;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
}
