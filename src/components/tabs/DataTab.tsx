import React from 'react';
import { FilterState } from '../../types';
import { filterDataByYear, isDataLoaded } from '../../data/dataService';

interface DataTabProps {
    filters: FilterState;
}

const DataTab: React.FC<DataTabProps> = ({ filters }) => {
    // Check if data is loaded before trying to use it
    if (!isDataLoaded()) {
        return (
            <div className="text-center py-12">
                <p className="text-slate-500">Loading data...</p>
            </div>
        );
    }

    const { channelData, monthlyData, contributions: weeklyContributions, investments: weeklyInvestments } = filterDataByYear(filters.selectedYear);

    // Calculate totals for verification
    const totalInvestment = channelData.reduce((sum, channel) => sum + channel.investment, 0);
    const totalContribution = channelData.reduce((sum, channel) => sum + channel.contribution, 0);
    const totalSellOut = weeklyContributions.reduce((sum, week) => sum + (Number(week.sales) || 0), 0);
    const totalROI = totalInvestment > 0 ? parseFloat((totalContribution / totalInvestment).toFixed(2)) : 0;

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
                <h1 className="text-2xl font-semibold text-slate-800">Data Debug</h1>
                <div className="text-sm text-slate-500">
                    Filtered for year {filters.selectedYear}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border">
                    <h3 className="text-sm font-medium text-slate-500">Total Investment</h3>
                    <p className="text-2xl font-bold text-slate-800">{formatCurrency(totalInvestment)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                    <h3 className="text-sm font-medium text-slate-500">Total Sell Out</h3>
                    <p className="text-2xl font-bold text-slate-800">{formatCurrency(totalSellOut)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                    <h3 className="text-sm font-medium text-slate-500">Actionable Sell Out</h3>
                    <p className="text-2xl font-bold text-slate-800">{formatCurrency(totalContribution)}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                    <h3 className="text-sm font-medium text-slate-500">Total ROI</h3>
                    <p className="text-2xl font-bold text-slate-800">{totalROI}x</p>
                </div>
            </div>

            {/* Channel Data Table */}
            <div className="bg-white rounded-lg border">
                <div className="p-4 border-b">
                    <h3 className="text-lg font-medium">Channel Data (Aggregated)</h3>
                    <p className="text-sm text-slate-500">Sum of all variables for the filtered period</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Channel</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Investment</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Contribution</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">ROI</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {channelData.map((channel) => (
                                <tr key={channel.channel}>
                                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{channel.channel}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{formatCurrency(channel.investment)}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{formatCurrency(channel.contribution)}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{channel.roi.toFixed(2)}x</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Weekly Contributions Data */}
            <div className="bg-white rounded-lg border">
                <div className="p-4 border-b">
                    <h3 className="text-lg font-medium">Weekly Contributions Data</h3>
                    <p className="text-sm text-slate-500">Weekly data for the filtered period ({weeklyContributions.length} weeks)</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Date</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Sales</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Base</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">TV</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Radio</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Press</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">OOH/DOOH</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">SEO</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Display</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Video</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Social Media</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Affiliation</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {weeklyContributions.map((week, index) => (
                                <tr key={index}>
                                    <td className="px-4 py-3 text-sm font-medium text-slate-800">
                                        {week.date.toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{formatCurrency(Number(week.sales) || 0)}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{formatCurrency(Number(week.base) || 0)}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{formatCurrency(Number(week.TV) || 0)}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{formatCurrency(Number(week.Radio) || 0)}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{formatCurrency(Number(week.Press) || 0)}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{formatCurrency(Number(week['OOH/DOOH']) || 0)}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{formatCurrency(Number(week.SEO) || 0)}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{formatCurrency(Number(week.Display) || 0)}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{formatCurrency(Number(week.Video) || 0)}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{formatCurrency(Number(week['Social Media']) || 0)}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{formatCurrency(Number(week.Affiliation) || 0)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Weekly Investments Data */}
            <div className="bg-white rounded-lg border">
                <div className="p-4 border-b">
                    <h3 className="text-lg font-medium">Weekly Investments Data</h3>
                    <p className="text-sm text-slate-500">Weekly investment data for the filtered period ({weeklyInvestments.length} weeks)</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Date</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">TV</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Radio</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Press</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">OOH/DOOH</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">SEO</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Display</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Video</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Social Media</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Affiliation</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {weeklyInvestments.map((week, index) => (
                                <tr key={index}>
                                    <td className="px-4 py-3 text-sm font-medium text-slate-800">
                                        {week.date.toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{formatCurrency(Number(week.TV) || 0)}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{formatCurrency(Number(week.Radio) || 0)}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{formatCurrency(Number(week.Press) || 0)}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{formatCurrency(Number(week['OOH/DOOH']) || 0)}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{formatCurrency(Number(week.SEO) || 0)}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{formatCurrency(Number(week.Display) || 0)}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{formatCurrency(Number(week.Video) || 0)}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{formatCurrency(Number(week['Social Media']) || 0)}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600">{formatCurrency(Number(week.Affiliation) || 0)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Debug Info */}
            <div className="bg-white rounded-lg border">
                <div className="p-4 border-b">
                    <h3 className="text-lg font-medium">Debug Information</h3>
                </div>
                <div className="p-4 space-y-2">
                    <p className="text-sm"><strong>Selected Year:</strong> {filters.selectedYear}</p>
                    <p className="text-sm"><strong>Weekly Contributions Count:</strong> {weeklyContributions.length}</p>
                    <p className="text-sm"><strong>Weekly Investments Count:</strong> {weeklyInvestments.length}</p>
                    <p className="text-sm"><strong>Channel Data Count:</strong> {channelData.length}</p>
                    {weeklyContributions.length > 0 && (
                        <>
                            <p className="text-sm"><strong>First Contribution Date:</strong> {weeklyContributions[0].date.toLocaleDateString()}</p>
                            <p className="text-sm"><strong>Last Contribution Date:</strong> {weeklyContributions[weeklyContributions.length - 1].date.toLocaleDateString()}</p>
                        </>
                    )}
                    {weeklyInvestments.length > 0 && (
                        <>
                            <p className="text-sm"><strong>First Investment Date:</strong> {weeklyInvestments[0].date.toLocaleDateString()}</p>
                            <p className="text-sm"><strong>Last Investment Date:</strong> {weeklyInvestments[weeklyInvestments.length - 1].date.toLocaleDateString()}</p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DataTab;
