import React, { useState } from 'react';
import { FilterState } from '../../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, ReferenceArea } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { channelDefinitions, filterData } from '../../data/mockData';

interface ResponseCurvesTabProps {
  filters: FilterState;
}

// Helper function to generate response curve data with smooth concave functions
const generateCurveData = (channel: string, showAll: boolean = false) => {
  const baseInvestment = 200000; // €200K max investment
  const points = 50; // Keep high number of data points for smooth curves
  const step = baseInvestment / points;
  
  const channels = showAll ? Object.keys(channelDefinitions) : [channel];
  
  // Current investment levels for each channel (adjusted to show variety)
  const currentInvestment: {[key: string]: number} = {
    'TV': 90000,
    'Radio': 55000,
    'Print': 40000,
    'Digital': 70000,
    'CRM': 35000,
    'Promo': 60000
  };
  
  return Array.from({ length: points + 1 }, (_, i) => {
    const investment = i * step;
    const result: any = {
      investment,
      breakeven: investment // y=x line (ROI = 1x)
    };
    
    channels.forEach(ch => {
      const { mediaType } = channelDefinitions[ch as keyof typeof channelDefinitions];
      
      // Parameters for concave curve shapes - making them more distinct per channel
      let maxROI: number;
      let concavity: number;
      
      // Assign different parameters to each channel to ensure distinct curves
      switch(ch) {
        case 'TV':
          maxROI = 1.8;
          concavity = 0.65;
          break;
        case 'Radio':
          maxROI = 2.1;
          concavity = 0.7;
          break;
        case 'Print':
          maxROI = 1.6;
          concavity = 0.55;
          break;
        case 'Digital':
          maxROI = 2.2;
          concavity = 0.60;
          break;
        case 'CRM':
          maxROI = 2.5;
          concavity = 0.75;
          break;
        case 'Promo':
          maxROI = 1.9;
          concavity = 0.68;
          break;
        default:
          maxROI = 2.0;
          concavity = 0.65;
      }
      
      // Concave function with diminishing returns: y = a * x^b where b < 1
      // Higher concavity = stronger diminishing returns
      if (investment > 0) {
        // Scale factor to create appropriate magnitude
        const scale = mediaType === 'Online' ? 1.2 : 1.0;
        
        // Simple power function for concave curve with diminishing returns
        result[ch] = scale * maxROI * investment * Math.pow(investment / baseInvestment, -concavity);
        
        // Cap the output to reasonable values closer to the break-even line
        const cappedValue = Math.min(result[ch], investment * 3);
        result[ch] = cappedValue;
      } else {
        result[ch] = 0;
      }
    });
    
    return result;
  });
};

// Calculate optimal range for a specific channel - now before diminishing returns become too strong
const calculateOptimalRange = (data: any[], channel: string) => {
  // Calculate ROI at each point
  const roiData = data.map(point => ({
    investment: point.investment,
    value: point[channel],
    roi: point[channel] / point.investment
  })).filter(point => !isNaN(point.roi) && isFinite(point.roi) && point.investment > 10000);
  
  // Find maximum ROI point
  const maxRoi = Math.max(...roiData.map(p => p.roi));
  const peakRoiPoint = roiData.find(p => p.roi === maxRoi);
  
  // The optimal zone starts where ROI reaches 85% of the peak
  const startIndex = roiData.findIndex(p => p.roi >= maxRoi * 0.85);
  const startPoint = startIndex !== -1 ? roiData[startIndex] : null;
  
  // Find the point where the marginal ROI starts diminishing significantly
  // (where the derivative of ROI drops below a threshold)
  const roiDerivatives = [];
  for (let i = 1; i < roiData.length; i++) {
    const roiChange = roiData[i].roi - roiData[i-1].roi;
    const investmentChange = roiData[i].investment - roiData[i-1].investment;
    roiDerivatives.push(roiChange / investmentChange);
  }
  
  // Find where the second derivative becomes strongly negative (curve flattens)
  // This indicates where diminishing returns kick in strongly
  const endIndex = roiDerivatives.findIndex((derivative, i) => 
    i > startIndex && derivative < -0.00001 && roiData[i].roi < maxRoi * 0.9
  );
  
  const endPoint = endIndex !== -1 ? roiData[endIndex] : null;
  
  // Create a narrower optimal zone
  return {
    min: startPoint?.investment || 25000,
    max: (endPoint?.investment || 100000) * 0.8 // Make optimal zone end earlier
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
    currentInvestment[channel] = baseInvestment[channel] * (adjustmentFactors[channel] || 1.0);
  });
  
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
                  <ReferenceArea
                    x1={optimalRange.min}
                    x2={optimalRange.max}
                    fill="#22c55e" 
                    fillOpacity={0.1}
                    stroke="#22c55e"
                    strokeDasharray="3 3"
                    label={{ 
                      value: 'Optimal Investment Zone', 
                      position: 'insideTopLeft', 
                      fill: '#14532d',
                      fontSize: 12,
                      dy: 15,
                      dx: 5
                    }}
                  />
                  
                  <ReferenceLine
                    x={currentInvestment[selectedChannel]}
                    stroke="#3b82f6"
                    strokeWidth={2}
                    label={{
                      value: 'Current', 
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
                        fillOpacity={0.1}
                        stroke={color}
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
                        strokeWidth={1.5}
                        strokeDasharray="3 3"
                        label={{
                          value: `${channel}`, 
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
          <p className="text-slate-700">
            For {selectedChannel}, optimal ROI is achieved between {formatCurrency(optimalRange.min)} and {formatCurrency(optimalRange.max)} investment. Current investment is {formatCurrency(currentInvestment[selectedChannel])}, which is {currentInvestment[selectedChannel] >= optimalRange.min && currentInvestment[selectedChannel] <= optimalRange.max ? 'within' : 'outside'} the optimal range.
          </p>
        </div>
        
        <div className="card bg-slate-50 border border-slate-200">
          <h3 className="text-lg font-medium mb-3">ROI Analysis</h3>
          <p className="text-slate-700">
            {selectedChannel} shows {
              currentInvestment[selectedChannel] < optimalRange.min ? 'strong potential for additional investment' :
              currentInvestment[selectedChannel] > optimalRange.max ? 'diminishing returns at current investment level' :
              'good efficiency at current investment level'
            }. Consider {
              currentInvestment[selectedChannel] > optimalRange.max ? 'reducing' : 
              currentInvestment[selectedChannel] < optimalRange.min ? 'increasing' : 
              'maintaining'
            } investment to maximize ROI.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResponseCurvesTab;