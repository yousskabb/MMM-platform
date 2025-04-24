import { 
  Channel, 
  ChannelData, 
  MonthlyChannelData, 
  SynergyData, 
  YearComparisonData, 
  SimulationData 
} from '../types';

// Helper function to generate random number within range
const randomNumber = (min: number, max: number): number => {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
};

// Update channel definitions with more distinct parameters
export const channelDefinitions: Record<Channel, { 
  mediaType: 'Online' | 'Offline', 
  color: string, 
  lightColor: string,
  baseEfficiency: number,
  diminishingFactor: number
}> = {
  'TV': { 
    mediaType: 'Offline', 
    color: '#10B981', 
    lightColor: '#D1FAE5',
    baseEfficiency: 2.2,
    diminishingFactor: 0.65
  },
  'Radio': { 
    mediaType: 'Offline', 
    color: '#059669', 
    lightColor: '#A7F3D0',
    baseEfficiency: 1.8,
    diminishingFactor: 0.7
  },
  'Print': { 
    mediaType: 'Offline', 
    color: '#047857', 
    lightColor: '#6EE7B7',
    baseEfficiency: 1.5,
    diminishingFactor: 0.75
  },
  'Digital': { 
    mediaType: 'Online', 
    color: '#3B82F6', 
    lightColor: '#DBEAFE',
    baseEfficiency: 2.8,
    diminishingFactor: 0.6
  },
  'CRM': { 
    mediaType: 'Online', 
    color: '#2563EB', 
    lightColor: '#BFDBFE',
    baseEfficiency: 2.5,
    diminishingFactor: 0.55
  },
  'Promo': { 
    mediaType: 'Online', 
    color: '#1D4ED8', 
    lightColor: '#93C5FD',
    baseEfficiency: 2.0,
    diminishingFactor: 0.8
  }
};

// Generate channel data
export const generateChannelData = (): ChannelData[] => {
  const channels = Object.keys(channelDefinitions) as Channel[];
  
  return channels.map(channel => {
    const { mediaType, color, lightColor } = channelDefinitions[channel];
    
    // Different ROI ranges for online vs offline
    const roiBase = mediaType === 'Online' ? 2.5 : 1.5;
    const roi = randomNumber(roiBase, roiBase + 1.5);
    
    // Different investment ranges
    const investmentBase = mediaType === 'Online' ? 500000 : 1000000;
    const investment = randomNumber(investmentBase, investmentBase * 2);
    
    const revenue = investment * roi;
    const contribution = revenue * randomNumber(0.2, 0.4);
    const yoyGrowth = randomNumber(-20, 40);
    
    return {
      channel,
      mediaType,
      color,
      lightColor,
      investment,
      roi,
      revenue,
      contribution,
      yoyGrowth
    };
  });
};

// Generate monthly performance data
export const generateMonthlyData = (): MonthlyChannelData[] => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const channels = Object.keys(channelDefinitions) as Channel[];
  const result: MonthlyChannelData[] = [];
  
  channels.forEach(channel => {
    const { mediaType, color, lightColor } = channelDefinitions[channel];
    
    months.forEach(month => {
      const baseValue = mediaType === 'Online' ? randomNumber(1, 3) : randomNumber(0.5, 2);
      
      // Seasonal adjustments
      let seasonalFactor = 1;
      if (['Nov', 'Dec'].includes(month)) seasonalFactor = 1.4; // Holiday season
      if (['Jan', 'Feb'].includes(month)) seasonalFactor = 0.8; // Post-holiday slump
      if (['Jun', 'Jul', 'Aug'].includes(month)) seasonalFactor = 1.2; // Summer campaigns
      
      const value = baseValue * seasonalFactor;
      
      result.push({
        channel,
        month,
        mediaType,
        color,
        lightColor,
        value,
        investment: randomNumber(100000, 500000),
        roi: value,
        revenue: randomNumber(100000, 1000000),
        contribution: randomNumber(20000, 200000),
        yoyGrowth: randomNumber(-15, 30)
      });
    });
  });
  
  return result;
};

// Generate synergy data (correlation matrix)
export const generateSynergyData = (): SynergyData[] => {
  const channels = Object.keys(channelDefinitions) as Channel[];
  const result: SynergyData[] = [];
  
  channels.forEach(channel1 => {
    channels.forEach(channel2 => {
      if (channel1 !== channel2) {
        // Generate stronger correlations between specific channel pairs
        let baseCorrelation = randomNumber(-0.2, 0.5);
        
        // TV and Digital often have synergies
        if ((channel1 === 'TV' && channel2 === 'Digital') || 
            (channel1 === 'Digital' && channel2 === 'TV')) {
          baseCorrelation = randomNumber(0.3, 0.7);
        }
        
        // CRM and Promo often work well together
        if ((channel1 === 'CRM' && channel2 === 'Promo') || 
            (channel1 === 'Promo' && channel2 === 'CRM')) {
          baseCorrelation = randomNumber(0.4, 0.8);
        }
        
        // Radio and TV have historical correlations
        if ((channel1 === 'Radio' && channel2 === 'TV') || 
            (channel1 === 'TV' && channel2 === 'Radio')) {
          baseCorrelation = randomNumber(0.2, 0.5);
        }
        
        result.push({
          channel1,
          channel2,
          correlation: baseCorrelation
        });
      }
    });
  });
  
  return result;
};

// Generate year comparison data
export const generateYearComparisonData = (year1: string, year2: string): YearComparisonData[] => {
  const channels = Object.keys(channelDefinitions) as Channel[];
  
  return channels.map(channel => {
    const { mediaType } = channelDefinitions[channel];
    
    // Base budgets differ by media type
    const baseYear1 = mediaType === 'Online' ? randomNumber(500000, 1500000) : randomNumber(1000000, 3000000);
    
    // General trend: online increasing, offline decreasing or flat
    const trendFactor = mediaType === 'Online' ? randomNumber(1.05, 1.2) : randomNumber(0.9, 1.05);
    
    const year1Budget = baseYear1;
    const year2Budget = baseYear1 * trendFactor;
    const variation = ((year2Budget - year1Budget) / year1Budget) * 100;
    
    return {
      channel,
      year1Budget,
      year2Budget,
      variation
    };
  });
};

// Generate simulation data
export const generateSimulationData = (): SimulationData[] => {
  const channels = Object.keys(channelDefinitions) as Channel[];
  const channelData = generateChannelData();
  
  return channels.map((channel, index) => {
    return {
      channel,
      currentBudget: channelData[index].investment,
      newBudget: channelData[index].investment,
      expectedROI: channelData[index].roi
    };
  });
};

// Pre-generate common datasets for consistency
export const preGeneratedData = {
  channelData: generateChannelData(),
  monthlyData: generateMonthlyData(),
  synergyData: generateSynergyData(),
  yearComparisonData: generateYearComparisonData('2023', '2024'),
  simulationData: generateSimulationData()
};

// Helper function to filter data by country, brand, etc.
// Generate data variation based on country and brand
export const filterData = (country: string, brand: string, dateRange: any) => {
  // Generate multipliers based on country and brand to create more variety
  let countryMultiplier = 1.0;
  switch(country) {
    case 'France': countryMultiplier = 1.15; break;
    case 'UK': countryMultiplier = 1.25; break;
    case 'Spain': countryMultiplier = 0.85; break;
    case 'Italy': countryMultiplier = 0.95; break;
    case 'Germany': countryMultiplier = 1.30; break;
    case 'Portugal': countryMultiplier = 0.75; break;
    default: countryMultiplier = 1.0;
  }
  
  let brandMultiplier = 1.0;
  switch(brand) {
    case 'Novotel': brandMultiplier = 1.10; break;
    case 'Pullman': brandMultiplier = 1.35; break;
    case 'Ibis': brandMultiplier = 0.90; break;
    case 'Mercure': brandMultiplier = 1.05; break;
    case 'Sofitel': brandMultiplier = 1.50; break;
    default: brandMultiplier = 1.0;
  }
  
  // Combined factor affects overall investment and revenue
  const variationFactor = countryMultiplier * brandMultiplier;
  
  // Channel adjustment factors - different brands and countries have different channel performance
  const channelFactors = {
    'TV': country === 'France' || country === 'Italy' ? 1.2 : 0.9,
    'Radio': country === 'Spain' || country === 'UK' ? 1.15 : 0.95,
    'Print': brand === 'Sofitel' || brand === 'Pullman' ? 1.25 : 0.8,
    'Digital': brand === 'Ibis' || brand === 'Novotel' ? 1.3 : 1.0,
    'CRM': country === 'Germany' ? 1.4 : 1.0,
    'Promo': brand === 'Mercure' ? 1.3 : 0.9
  };
  
  return {
    channelData: preGeneratedData.channelData.map(item => ({
      ...item,
      investment: item.investment * variationFactor * (channelFactors[item.channel] || 1.0),
      revenue: item.revenue * variationFactor * (channelFactors[item.channel] || 1.0) * 1.1, // Revenue higher than investment for positive ROI
      contribution: item.contribution * variationFactor * (channelFactors[item.channel] || 1.0),
      roi: item.roi * (channelFactors[item.channel] || 1.0) // ROI affected by channel factors
    })),
    monthlyData: preGeneratedData.monthlyData.map(item => ({
      ...item,
      investment: item.investment * variationFactor * (channelFactors[item.channel] || 1.0),
      revenue: item.revenue * variationFactor * (channelFactors[item.channel] || 1.0),
      contribution: item.contribution * variationFactor * (channelFactors[item.channel] || 1.0),
      roi: item.roi * (channelFactors[item.channel] || 1.0)
    })),
    synergyData: preGeneratedData.synergyData,
    yearComparisonData: preGeneratedData.yearComparisonData.map(item => ({
      ...item,
      year1Budget: item.year1Budget * variationFactor * (channelFactors[item.channel] || 1.0),
      year2Budget: item.year2Budget * variationFactor * (channelFactors[item.channel] || 1.0)
    })),
    simulationData: preGeneratedData.simulationData.map(item => ({
      ...item,
      currentBudget: item.currentBudget * variationFactor * (channelFactors[item.channel] || 1.0),
      newBudget: item.newBudget * variationFactor * (channelFactors[item.channel] || 1.0)
    }))
  };
};

// Generate insights based on the data
export const generateInsights = (country: string, brand: string): string[] => {
  const channelData = preGeneratedData.channelData;
  const synergyData = preGeneratedData.synergyData;
  
  // Find the channel with the highest ROI
  const highestROIChannel = [...channelData].sort((a, b) => b.roi - a.roi)[0];
  
  // Find the channel with the lowest ROI
  const lowestROIChannel = [...channelData].sort((a, b) => a.roi - b.roi)[0];
  
  // Find the strongest synergy
  const strongestSynergy = [...synergyData].sort((a, b) => b.correlation - a.correlation)[0];
  
  // Calculate online vs offline performance
  const onlineChannels = channelData.filter(c => c.mediaType === 'Online');
  const offlineChannels = channelData.filter(c => c.mediaType === 'Offline');
  
  const onlineTotalInvestment = onlineChannels.reduce((sum, c) => sum + c.investment, 0);
  const offlineTotalInvestment = offlineChannels.reduce((sum, c) => sum + c.investment, 0);
  
  const onlineTotalRevenue = onlineChannels.reduce((sum, c) => sum + c.revenue, 0);
  const offlineTotalRevenue = offlineChannels.reduce((sum, c) => sum + c.revenue, 0);
  
  const onlineROI = onlineTotalRevenue / onlineTotalInvestment;
  const offlineROI = offlineTotalRevenue / offlineTotalInvestment;
  
  // Generate insights
  return [
    `For ${brand} in ${country}, ${highestROIChannel.channel} delivers the highest ROI at ${highestROIChannel.roi.toFixed(2)}, which is ${((highestROIChannel.roi / lowestROIChannel.roi - 1) * 100).toFixed(0)}% higher than ${lowestROIChannel.channel}.`,
    
    `Strong synergy detected between ${strongestSynergy.channel1} and ${strongestSynergy.channel2} (correlation: ${strongestSynergy.correlation.toFixed(2)}). Consider coordinating these campaigns for maximum impact.`,
    
    `${onlineROI > offlineROI ? 'Online' : 'Offline'} media is currently more efficient with an average ROI of ${(onlineROI > offlineROI ? onlineROI : offlineROI).toFixed(2)} vs ${(onlineROI > offlineROI ? offlineROI : onlineROI).toFixed(2)}.`,
    
    `Overall media investment is ${((onlineTotalInvestment / (onlineTotalInvestment + offlineTotalInvestment)) * 100).toFixed(0)}% online and ${((offlineTotalInvestment / (onlineTotalInvestment + offlineTotalInvestment)) * 100).toFixed(0)}% offline. Consider ${onlineROI > offlineROI ? 'increasing' : 'decreasing'} online allocation for better overall performance.`,
    
    `Year-over-year, ${highestROIChannel.yoyGrowth > 0 ? 'growth' : 'decline'} in ${highestROIChannel.channel} performance is at ${Math.abs(highestROIChannel.yoyGrowth).toFixed(1)}%, suggesting ${highestROIChannel.yoyGrowth > 0 ? 'increasing effectiveness' : 'declining returns'}.`
  ];
};

// Generate answers to chat questions
export const generateChatAnswer = (question: string): string => {
  const channelData = preGeneratedData.channelData;
  
  // Simple pattern matching for demo purposes
  if (question.toLowerCase().includes('best roi') || question.toLowerCase().includes('highest roi')) {
    const highestROIChannel = [...channelData].sort((a, b) => b.roi - a.roi)[0];
    return `Based on the data, ${highestROIChannel.channel} delivers the best ROI at ${highestROIChannel.roi.toFixed(2)}x. For every $1 invested, you get $${highestROIChannel.roi.toFixed(2)} in return.`;
  }
  
  if (question.toLowerCase().includes('worst') || question.toLowerCase().includes('least efficient')) {
    const lowestROIChannel = [...channelData].sort((a, b) => a.roi - b.roi)[0];
    return `The least efficient channel is ${lowestROIChannel.channel} with an ROI of ${lowestROIChannel.roi.toFixed(2)}x. This is ${((channelData[0].roi / lowestROIChannel.roi - 1) * 100).toFixed(0)}% lower than the average ROI across all channels.`;
  }
  
  if (question.toLowerCase().includes('budget') || question.toLowerCase().includes('spend')) {
    const totalInvestment = channelData.reduce((sum, c) => sum + c.investment, 0);
    const highestInvestmentChannel = [...channelData].sort((a, b) => b.investment - a.investment)[0];
    return `The total media investment is $${(totalInvestment/1000000).toFixed(2)} million. The highest investment is in ${highestInvestmentChannel.channel} at $${(highestInvestmentChannel.investment/1000000).toFixed(2)} million (${((highestInvestmentChannel.investment / totalInvestment) * 100).toFixed(0)}% of total budget).`;
  }
  
  if (question.toLowerCase().includes('recommend') || question.toLowerCase().includes('suggest') || question.toLowerCase().includes('advice')) {
    const channelsByROI = [...channelData].sort((a, b) => b.roi - a.roi);
    return `Based on ROI performance, I recommend increasing investment in ${channelsByROI[0].channel} and ${channelsByROI[1].channel}, which have the highest returns at ${channelsByROI[0].roi.toFixed(2)}x and ${channelsByROI[1].roi.toFixed(2)}x respectively. Consider reducing spend on ${channelsByROI[channelsByROI.length-1].channel} which has the lowest ROI at ${channelsByROI[channelsByROI.length-1].roi.toFixed(2)}x.`;
  }
  
  // Default response for other questions
  return `I don't have specific information about that. Try asking about ROI, budget allocation, or recommendations for media investment.`;
};