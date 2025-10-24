import React, { useState } from 'react';
import { FilterState } from '../../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { channelDefinitions, filterData } from '../../data/mockData';

interface ResponseCurvesTabProps {
  filters: FilterState;
}

// Helper function to generate response curve data with smooth response curves
const generateCurveData = (channel: string, showAll: boolean = false) => {
  const baseInvestment = 250000; // Maximum investment amount
  const points = 100; // More data points for smoother curves
  const step = baseInvestment / points;
  
  const channels = showAll ? Object.keys(channelDefinitions) : [channel];
  
  // Current investment levels for each channel
  const currentInvestment: {[key: string]: number} = {
    'TV': 90000,
    'Radio': 55000,
    'Print': 40000,
    'Digital': 70000,
    'CRM': 35000,
    'Promo': 60000
  };
  
  // Channel-specific curve parameters with slight variations
  const channelParams: {[key: string]: {
    maxContribution: number, // a: saturation level (as a multiple of baseInvestment)
    responseSpeed: number,   // b: response speed (higher = faster diminishing returns)
    dropPoint: number,       // point where curve starts to drop (as fraction of baseInvestment)
    dropRate: number         // how fast the curve drops after dropPoint
  }} = {
    'TV': {
      maxContribution: 0.9,  // Reduced to keep max ROI below 3.0
      responseSpeed: 9.5,
      dropPoint: 0.75,
      dropRate: 2.2
    },
    'Radio': {
      maxContribution: 0.8,  // Reduced to keep max ROI below 3.0
      responseSpeed: 10.2,
      dropPoint: 0.7,
      dropRate: 2.0
    },
    'Print': {
      maxContribution: 0.75, // Reduced to keep max ROI below 3.0
      responseSpeed: 11.0,
      dropPoint: 0.8,
      dropRate: 1.8
    },
    'Digital': {
      maxContribution: 0.95, // Reduced to keep max ROI below 3.0
      responseSpeed: 8.8,
      dropPoint: 0.72,
      dropRate: 2.4
    },
    'CRM': {
      maxContribution: 0.85, // Reduced to keep max ROI below 3.0
      responseSpeed: 9.8,
      dropPoint: 0.78,
      dropRate: 2.1
    },
    'Promo': {
      maxContribution: 0.78, // Reduced to keep max ROI below 3.0
      responseSpeed: 10.5,
      dropPoint: 0.74,
      dropRate: 1.9
    }
  };
  
  return Array.from({ length: points + 1 }, (_, i) => {
    const investment = i * step;
    const result: any = {
      investment,
      breakeven: investment // y=x line (ROI = 1x)
    };
    
    channels.forEach(ch => {
      if (investment <= 0) {
        result[ch] = 0;
        return;
      }
      
      // Get channel-specific parameters or use defaults
      const params = channelParams[ch] || channelParams['TV'];
      const { maxContribution, responseSpeed, dropPoint, dropRate } = params;
      
      // Normalize investment as a fraction of baseInvestment
      const x = investment / baseInvestment;
      
      // Calculate saturation level based on maximum contribution
      const a = maxContribution * baseInvestment; 
      const b = responseSpeed / baseInvestment;
      
      // Apply traditional MMM response formula: a * (1 - e^(-b*Spend))
      let contribution = a * (1 - Math.exp(-b * investment));
      
      // For high spend levels (after dropPoint), apply a smooth decline
      if (x > dropPoint) {
        // Get the value and slope at the dropPoint
        const dropValue = a * (1 - Math.exp(-b * dropPoint * baseInvestment));
        const dropSlope = a * b * Math.exp(-b * dropPoint * baseInvestment);
        
        // Calculate how far we are into the dropping phase
        const dropPhaseProgress = (x - dropPoint) / (1 - dropPoint);
        
        // Calculate the terminal value (where we end up at max investment)
        // This gives ROI < 1 for max investment (0.7x ROI at maximum)
        const terminalValue = baseInvestment * 0.7;
        
        // Smooth transition: use a blend of:
        // 1. A line tangent to the curve at dropPoint
        // 2. A decay function toward the terminal value
        
        // Tangent line: value + slope * (x - dropPoint)
        const tangentValue = dropValue + dropSlope * baseInvestment * (x - dropPoint);
        
        // Decay function: exponential blend toward terminal value
        const decayFactor = Math.pow(dropPhaseProgress, dropRate);
        
        // Blend between tangent line and terminal value based on decay factor
        contribution = tangentValue * (1 - decayFactor) + terminalValue * decayFactor;
      }
      
      // Apply a very slight random variation (±1%) for realism
      const variation = 1 + (Math.random() * 0.02 - 0.01);
      result[ch] = contribution * variation;
      
      // Apply base channel efficiency from definitions for additional distinction
      const { baseEfficiency } = channelDefinitions[ch as keyof typeof channelDefinitions];
      const efficiencyFactor = baseEfficiency / 2.5; // Normalize efficiency
      result[ch] *= (0.8 + 0.4 * efficiencyFactor); // Less pronounced but still varied
      
      // Ensure ROI never exceeds 3.0 at any point
      const maxAllowedValue = investment * 3.0;
      if (result[ch] > maxAllowedValue) {
        result[ch] = maxAllowedValue;
      }
    });
    
    return result;
  });
};

// Calculate optimal range for a specific channel - now before diminishing returns become too strong
const calculateOptimalRange = (data: any[], channel: string) => {
  // Calculate ROI and marginal returns at each point
  const roiData = data.map((point, i, arr) => {
    const roi = point[channel] / point.investment;
    
    // Calculate marginal ROI (derivative)
    let marginalRoi = 0;
    if (i > 0) {
      const prevPoint = arr[i-1];
      const responseChange = point[channel] - prevPoint[channel];
      const investmentChange = point.investment - prevPoint.investment;
      marginalRoi = responseChange / investmentChange;
    }
    
    return {
      investment: point.investment,
      value: point[channel],
      roi,
      marginalRoi
    };
  }).filter(point => !isNaN(point.roi) && isFinite(point.roi) && point.investment > 5000);
  
  // Find the peak ROI (often at the beginning before diminishing returns)
  const maxRoi = Math.max(...roiData.map(p => p.roi));
  const peakRoiPoint = roiData.find(p => p.roi === maxRoi);
  
  // Find the start of the optimal zone - after initial instability, where ROI stabilizes at a strong value
  // Increase the threshold to make the optimal zone start higher (smaller zone)
  const startPoint = roiData.find(p => 
    p.investment > 40000 && // Increased from 20000 to 40000
    p.roi > maxRoi * 0.7 && // Reduced from 0.8 to 0.7 to compensate
    p.marginalRoi > 1.2 // Increased from 1.0 to 1.2 for stricter criteria
  );
  
  // Find the end of the optimal zone - where marginal ROI drops below 1.0
  // This means each additional euro invested returns less than 1 euro (diminishing returns)
  const endPointIndex = roiData.findIndex(p => 
    p.investment > (startPoint?.investment || 40000) && // Updated from 20000 to 40000
    p.marginalRoi < 1.1
  );
  
  const endPoint = endPointIndex !== -1 ? roiData[endPointIndex] : null;
  
  return {
    min: startPoint?.investment || 40000, // Updated from 20000 to 40000
    max: endPoint?.investment || 120000
  };
};

const ResponseCurvesTab: React.FC<ResponseCurvesTabProps> = ({ filters }) => {
  const [selectedChannel, setSelectedChannel] = useState<string>('TV');
  const [showAllCurves, setShowAllCurves] = useState(false);
  
  // Get factors from filterData
  const { channelData } = filterData(filters.country, filters.brand, filters.dateRange);
  
  // Base investment levels
  const baseInvestment: {[key: string]: number} = {
    'TV': 90000,
    'Radio': 55000,
    'Print': 40000,
    'Digital': 70000,
    'CRM': 35000,
    'Promo': 60000
  };
  
  // Get adjustment factors for each channel based on filtered data
  const adjustmentFactors: {[key: string]: number} = {};
  channelData.forEach(channel => {
    // Create a factor based on the channelData investment compared to a baseline
    // This allows current investment to vary by country and brand
    const baselineInvestment = 1000000; // Arbitrary baseline for comparison
    adjustmentFactors[channel.channel] = channel.investment / baselineInvestment;
  });
  
  // Apply adjustment factors to base investment levels
  const currentInvestment: {[key: string]: number} = {};
  Object.keys(baseInvestment).forEach(channel => {
    // Ensure we have a valid adjustment factor for each channel
    const factor = adjustmentFactors[channel] || 1.0;
    // Make sure each channel has a valid current investment value
    currentInvestment[channel] = Math.max(10000, baseInvestment[channel] * factor);
  });
  
  // Verify current investment values for all channels
  console.log('Current Investment Values:', currentInvestment);
  
  const data = generateCurveData(selectedChannel, showAllCurves);
  const channels = Object.keys(channelDefinitions);
  
  // Calculate optimal range
  const optimalRange = calculateOptimalRange(data, selectedChannel);
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
      notation: value >= 1000000 ? 'compact' : 'standard',
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Format compact currency for axis labels
  const formatCompactCurrency = (value: number) => {
    if (value >= 1000000) {
      return `€${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `€${(value / 1000).toFixed(0)}K`;
    }
    return `€${value}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-slate-800">Response Curves Analysis</h1>
        <div className="flex items-center gap-4">
          <select
            className="select min-w-40"
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
          >
            {channels.map(channel => (
              <option key={channel} value={channel}>{channel}</option>
            ))}
          </select>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showAllCurves}
              onChange={(e) => setShowAllCurves(e.target.checked)}
              className="form-checkbox h-4 w-4 text-primary-600"
            />
            <span className="text-sm font-medium">Show All Curves</span>
          </label>
        </div>
      </div>
      
      <div className="card">
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-primary-600" />
          Investment vs. Contribution
        </h3>
        
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="investment"
                tickFormatter={(value) => formatCompactCurrency(value)}
                label={{ value: 'Investment', position: 'insideBottom', offset: -5 }}
                domain={[0, 'dataMax']}
              />
              <YAxis
                tickFormatter={(value) => formatCompactCurrency(value)}
                label={{ value: 'Contribution', angle: -90, position: 'insideLeft', offset: 5 }}
                // Reduced Y-axis range - closer to break-even line
                domain={[0, (dataMax: number) => dataMax * 1.2]}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(value) => `Investment: ${formatCurrency(Number(value))}`}
              />
              <Legend />
              
              {/* Break-even line */}
              <ReferenceLine
                segment={[{ x: 0, y: 0 }, { x: 200000, y: 200000 }]}
                stroke="#94a3b8"
                strokeDasharray="3 3"
                label={{ value: 'Break-even (ROI = 1x)', position: 'insideBottomRight', offset: 5 }}
              />
              
              {/* Single channel view - show optimal zone and current investment */}
              {!showAllCurves && (
                <>
                  {/* Optimal investment zone with improved visualization */}
                  <ReferenceArea
                    x1={optimalRange.min}
                    x2={optimalRange.max}
                    fill="#22c55e" 
                    fillOpacity={0.15}
                    stroke="#22c55e"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                  />
                  
                  {/* Add zone labels */}
                  <ReferenceLine
                    x={optimalRange.min}
                    stroke="#22c55e"
                    strokeWidth={2}
                    label={{
                      value: 'Optimal Zone Start', 
                      position: 'top', 
                      fill: '#14532d',
                      fontSize: 12
                    }}
                  />
                  
                  <ReferenceLine
                    x={optimalRange.max}
                    stroke="#f97316" // Orange color for diminishing returns
                    strokeWidth={2}
                    label={{
                      value: 'Diminishing Returns', 
                      position: 'top', 
                      fill: '#9a3412',
                      fontSize: 12
                    }}
                  />
                  
                  <ReferenceLine
                    x={currentInvestment[selectedChannel]}
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    isFront={true}
                    label={{
                      value: `Current: ${formatCompactCurrency(currentInvestment[selectedChannel])}`, 
                      position: 'top', 
                      fill: '#1e40af',
                      fontSize: 12
                    }}
                  />
                </>
              )}
              
              {/* Response curves with optimal zones and current lines for all channels */}
              {showAllCurves ? (
                channels.map(channel => {
                  const { color } = channelDefinitions[channel as keyof typeof channelDefinitions];
                  // Calculate optimal range for each channel
                  const chanOptimalRange = calculateOptimalRange(data, channel);
                  
                  return (
                    <React.Fragment key={channel}>
                      {/* Channel curve */}
                      <Line
                        type="monotone"
                        dataKey={channel}
                        stroke={color}
                        strokeWidth={2}
                        dot={false}
                        name={channel}
                        activeDot={{ r: 5 }}
                      />
                      
                      {/* Optimal investment zone */}
                      <ReferenceArea
                        x1={chanOptimalRange.min}
                        x2={chanOptimalRange.max}
                        fill={color} 
                        fillOpacity={0.15}
                        stroke={color}
                        strokeWidth={1}
                        strokeDasharray="3 3"
                        label={{ 
                          value: `${channel} Optimal`, 
                          position: 'insideTop',
                          fill: color,
                          fontSize: 10,
                          dy: 10
                        }}
                      />
                      
                      {/* Current investment line */}
                      <ReferenceLine
                        x={currentInvestment[channel]}
                        stroke={color}
                        strokeWidth={2}
                        isFront={true}
                        label={{
                          value: `${channel}: ${formatCompactCurrency(currentInvestment[channel])}`, 
                          position: 'top',
                          fill: color,
                          fontSize: 10
                        }}
                      />
                    </React.Fragment>
                  );
                })
              ) : (
                <Line
                  type="monotone"
                  dataKey={selectedChannel}
                  stroke={channelDefinitions[selectedChannel as keyof typeof channelDefinitions].color}
                  strokeWidth={3}
                  dot={false}
                  name={selectedChannel}
                  activeDot={{ r: 5 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card bg-slate-50 border border-slate-200">
          <h3 className="text-lg font-medium mb-3">Optimal Investment Range</h3>
          <p className="text-slate-700 mb-2">
            For <span className="font-semibold">{selectedChannel}</span>, optimal ROI is achieved between {formatCurrency(optimalRange.min)} and {formatCurrency(optimalRange.max)}.
          </p>
        </div>
        
        <div className="card bg-slate-50 border border-slate-200">
          <h3 className="text-lg font-medium mb-3">Diminishing Returns Analysis</h3>
          <p className="text-slate-700 mb-2">
            {currentInvestment[selectedChannel] < optimalRange.min ? 
              `${selectedChannel} is currently underinvested. Increasing investment to at least ${formatCurrency(optimalRange.min)} would significantly improve ROI and contribution.` :
              currentInvestment[selectedChannel] > optimalRange.max ? 
              `${selectedChannel} is experiencing diminishing returns. Each additional euro invested yields progressively less return.` :
              `${selectedChannel} is well-optimized. Current investment provides good balance between volume and efficiency.`
            }
          </p>
          <p className="text-slate-700">
            <span className="font-medium">Recommendation:</span> {
              currentInvestment[selectedChannel] < optimalRange.min 
                ? `Increase investment by ${formatCurrency(optimalRange.min - currentInvestment[selectedChannel])} to reach optimal efficiency.` : 
              currentInvestment[selectedChannel] > optimalRange.max 
                ? `Consider reallocating ${formatCurrency(currentInvestment[selectedChannel] - optimalRange.max)} to other channels with better ROI.` : 
              `Maintain current investment levels to maximize returns.`
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResponseCurvesTab;