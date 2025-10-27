import React from 'react';
import { FilterState, ChannelData } from '../../types';
import { filterDataByYear } from '../../data/dataService';
import { Info } from 'lucide-react';
import ChannelColorBadge from '../ui/ChannelColorBadge';

interface SynergyData {
  channel1: string;
  channel2: string;
  correlation: number;
}

interface WeeklyData {
  date: Date;
  [key: string]: any;
}

// Calculate Pearson correlation between two channels based on their weekly contributions
function calculatePearsonCorrelation(channel1Values: number[], channel2Values: number[]): number {
  const n = channel1Values.length;

  if (n === 0) return 0;

  // Calculate means
  const mean1 = channel1Values.reduce((sum, val) => sum + val, 0) / n;
  const mean2 = channel2Values.reduce((sum, val) => sum + val, 0) / n;

  // Calculate covariance and standard deviations
  let covariance = 0;
  let variance1 = 0;
  let variance2 = 0;

  for (let i = 0; i < n; i++) {
    const diff1 = channel1Values[i] - mean1;
    const diff2 = channel2Values[i] - mean2;
    covariance += diff1 * diff2;
    variance1 += diff1 * diff1;
    variance2 += diff2 * diff2;
  }

  // Calculate correlation coefficient
  const denominator = Math.sqrt(variance1 * variance2);

  if (denominator === 0) return 0;

  return covariance / denominator;
}

// Calculate synergies between channels based on actual weekly contribution data
function calculateSynergies(channelData: ChannelData[], weeklyContributions: WeeklyData[], variables: string[]): SynergyData[] {
  const synergies: SynergyData[] = [];

  // Extract weekly contribution values for each channel
  const channelValues: { [key: string]: number[] } = {};

  variables.forEach(variable => {
    channelValues[variable] = weeklyContributions.map(week => (week[variable] as number) || 0);
  });

  // Calculate correlation for each channel pair
  for (let i = 0; i < variables.length; i++) {
    for (let j = i + 1; j < variables.length; j++) {
      const channel1 = variables[i];
      const channel2 = variables[j];

      const correlation = calculatePearsonCorrelation(
        channelValues[channel1],
        channelValues[channel2]
      );

      synergies.push({
        channel1: channel1,
        channel2: channel2,
        correlation
      });
    }
  }

  return synergies;
}

interface SynergiesTabProps {
  filters: FilterState;
}

const SynergiesTab: React.FC<SynergiesTabProps> = ({ filters }) => {
  const { channelData, contributions, variables } = filterDataByYear(filters.selectedYear);

  // Calculate synergies from actual weekly contribution data using Pearson correlation
  const synergyData = calculateSynergies(channelData, contributions, variables);

  // Group synergy data by channel1 to create a matrix
  const channels = [...new Set([
    ...synergyData.map(item => item.channel1),
    ...synergyData.map(item => item.channel2)
  ])];

  // Create a lookup object for easy access to correlation values
  const correlationLookup: Record<string, Record<string, number>> = {};

  channels.forEach(channel1 => {
    correlationLookup[channel1] = {};
    channels.forEach(channel2 => {
      if (channel1 === channel2) {
        correlationLookup[channel1][channel2] = 1; // Self-correlation is always 1
      } else {
        const synergyItem = synergyData.find(
          item =>
            (item.channel1 === channel1 && item.channel2 === channel2) ||
            (item.channel1 === channel2 && item.channel2 === channel1)
        );
        correlationLookup[channel1][channel2] = synergyItem?.correlation || 0;
      }
    });
  });

  // Find the strongest positive synergies
  const positiveCorrelations = synergyData
    .filter(item => item.correlation > 0)
    .sort((a, b) => b.correlation - a.correlation)
    .slice(0, 3);

  // Ensure Promo + Digital has custom text
  const positiveCorrelationsWithCustomText = positiveCorrelations.map(synergy => {
    if ((synergy.channel1 === 'Promo' && synergy.channel2 === 'Digital') ||
      (synergy.channel1 === 'Digital' && synergy.channel2 === 'Promo')) {
      return {
        ...synergy,
        customText: "Promo increases the effectiveness of Digital campaigns. Consider coordinating these channels in your mix"
      };
    }
    return {
      ...synergy,
      customText: `${synergy.channel1} increases the effectiveness of ${synergy.channel2} campaigns. Consider coordinating these channels in your media mix.`
    };
  });

  // Find the strongest negative synergies (cannibalization)
  const negativeCorrelations = synergyData
    .filter(item => item.correlation < 0)
    .sort((a, b) => a.correlation - b.correlation)
    .slice(0, 3);

  // Helper function to get color based on correlation value
  const getCorrelationColor = (value: number): string => {
    if (value === 1) return 'bg-slate-200'; // Self-correlation

    if (value > 0.6) return 'bg-success-500 text-white';
    if (value > 0.3) return 'bg-success-200';
    if (value > 0.1) return 'bg-success-100';
    if (value > -0.1) return 'bg-slate-50';
    if (value > -0.3) return 'bg-error-100';
    if (value > -0.6) return 'bg-error-200';
    return 'bg-error-500 text-white';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-slate-800">Channel Synergies</h1>
      </div>

      <div className="card">
        <h3 className="text-lg font-medium mb-2">Correlation Matrix</h3>
        <p className="text-slate-500 text-sm mb-4">This matrix shows how different channels influence each other's performance, with values ranging from -1 (negative effect) to 1 (positive effect).</p>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[768px] border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-left text-sm font-semibold text-slate-700 bg-slate-50">Channel</th>
                {channels.map(channel => (
                  <th key={channel} className="p-2 text-center text-sm font-semibold text-slate-700 bg-slate-50">
                    {channel}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {channels.map(channel1 => (
                <tr key={channel1} className="border-t border-slate-100">
                  <td className="p-2 font-medium">
                    <ChannelColorBadge channel={channel1} />
                  </td>
                  {channels.map(channel2 => {
                    const value = correlationLookup[channel1][channel2];
                    return (
                      <td
                        key={`${channel1}-${channel2}`}
                        className={`p-2 text-center ${getCorrelationColor(value)}`}
                      >
                        {value.toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Positive Synergies */}
        <div className="card animate-slide-in-right">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-success-100 flex items-center justify-center">
              <Info size={18} className="text-success-600" />
            </div>
            <h3 className="text-lg font-medium">Top Positive Synergies</h3>
          </div>

          <div className="space-y-4">
            {positiveCorrelationsWithCustomText.map((synergy, index) => (
              <div key={index} className="border border-slate-100 rounded-md p-3">
                <div className="flex justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <ChannelColorBadge channel={synergy.channel1} />
                    <span className="text-slate-400">+</span>
                    <ChannelColorBadge channel={synergy.channel2} />
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${synergy.correlation > 0.5 ? 'bg-success-100 text-success-700' : 'bg-success-50 text-success-600'
                    }`}>
                    {synergy.correlation.toFixed(2)}
                  </span>
                </div>
                <p className="text-sm text-slate-600">
                  {synergy.customText}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Negative Synergies */}
        <div className="card animate-slide-in-right" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-error-100 flex items-center justify-center">
              <Info size={18} className="text-error-600" />
            </div>
            <h3 className="text-lg font-medium">Top Negative Interactions</h3>
          </div>

          <div className="space-y-4">
            {negativeCorrelations.length > 0 ? (
              negativeCorrelations.map((synergy, index) => (
                <div key={index} className="border border-slate-100 rounded-md p-3">
                  <div className="flex justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <ChannelColorBadge channel={synergy.channel1} />
                      <span className="text-slate-400">+</span>
                      <ChannelColorBadge channel={synergy.channel2} />
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium bg-error-100 text-error-700`}>
                      {synergy.correlation.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">
                    {synergy.channel1} may cannibalize {synergy.channel2} effectiveness.
                    Consider separating these channels in your campaign schedule.
                  </p>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-slate-500">
                No significant negative interactions detected in the current data.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Best Practices */}
      <div className="card bg-slate-50 border border-slate-200">
        <h3 className="text-lg font-medium mb-3">Understanding Channel Synergies</h3>
        <div className="space-y-3">
          <p className="text-sm text-slate-700">
            <span className="font-semibold">Positive synergies</span> (values greater than 0.3) indicate channels that work well together. When these channels are active simultaneously, they produce greater results than the sum of their individual contributions.
          </p>
          <p className="text-sm text-slate-700">
            <span className="font-semibold">Negative synergies</span> (values less than -0.3) suggest potential cannibalization, where one channel may detract from the effectiveness of another.
          </p>
          <p className="text-sm text-slate-700">
            <span className="font-semibold">Neutral interactions</span> (values between -0.3 and 0.3) indicate that channels operate largely independently of each other.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SynergiesTab;