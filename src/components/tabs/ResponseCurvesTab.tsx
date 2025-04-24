import React, { useState } from 'react';
import { FilterState } from '../../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { channelDefinitions } from '../../data/mockData';

interface ResponseCurvesTabProps {
  filters: FilterState;
}

// Helper function to generate response curve data
const generateCurveData = (channel: string, showAll: boolean = false) => {
  const baseInvestment = 200000; // €200K max investment
  const points = 20; // Number of data points
  const step = baseInvestment / points;
  
  const channels = showAll ? Object.keys(channelDefinitions) : [channel];
  
  return Array.from({ length: points + 1 }, (_, i) => {
    const investment = i * step;
    const result: any = {
      investment,
      breakeven: investment // y=x line
    };
    
    channels.forEach(ch => {
      const { mediaType } = channelDefinitions[ch as keyof typeof channelDefinitions];
      const baseEfficiency = mediaType === 'Online' ? 2.5 : 1.8;
      const diminishingFactor = mediaType === 'Online' ? 0.7 : 0.6;
      
      // Logarithmic curve with diminishing returns
      result[ch] = baseEfficiency * investment * Math.pow(investment / baseInvestment, -diminishingFactor);
    });
    
    return result;
  });
};

const ResponseCurvesTab: React.FC<ResponseCurvesTabProps> = ({ filters }) => {
  const [selectedChannel, setSelectedChannel] = useState<string>('TV');
  const [showAllCurves, setShowAllCurves] = useState(false);
  
  const data = generateCurveData(selectedChannel, showAllCurves);
  const channels = Object.keys(channelDefinitions);
  
  // Calculate optimal range
  const selectedData = data.map(point => ({
    investment: point.investment,
    roi: point[selectedChannel] / point.investment
  })).filter(point => !isNaN(point.roi) && isFinite(point.roi));
  
  const optimalRange = selectedData.reduce((acc, point) => {
    if (point.roi > 1.5 && point.roi < 2.5) {
      return {
        min: acc.min === 0 ? point.investment : acc.min,
        max: point.investment
      };
    }
    return acc;
  }, { min: 0, max: 0 });
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: value >= 1000000 ? 'compact' : 'standard',
      maximumFractionDigits: 1
    }).format(value);
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
                tickFormatter={(value) => formatCurrency(value)}
                label={{ value: 'Investment', position: 'insideBottom', offset: -10 }}
              />
              <YAxis
                tickFormatter={(value) => formatCurrency(value)}
                label={{ value: 'Contribution', angle: -90, position: 'insideLeft', offset: 10 }}
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
                label={{ value: 'Break-even (ROI = 1x)', position: 'insideTopLeft' }}
              />
              
              {/* Optimal ROI zone */}
              <ReferenceLine
                x={optimalRange.min}
                stroke="#22c55e"
                strokeDasharray="3 3"
                label={{ value: 'Optimal ROI Zone', position: 'top' }}
              />
              <ReferenceLine
                x={optimalRange.max}
                stroke="#22c55e"
                strokeDasharray="3 3"
              />
              
              {/* Response curves */}
              {showAllCurves ? (
                channels.map(channel => {
                  const { color } = channelDefinitions[channel as keyof typeof channelDefinitions];
                  return (
                    <Line
                      key={channel}
                      type="monotone"
                      dataKey={channel}
                      stroke={color}
                      dot={false}
                      name={channel}
                    />
                  );
                })
              ) : (
                <Line
                  type="monotone"
                  dataKey={selectedChannel}
                  stroke={channelDefinitions[selectedChannel as keyof typeof channelDefinitions].color}
                  dot={false}
                  name={selectedChannel}
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
            For {selectedChannel}, optimal ROI is achieved between {formatCurrency(optimalRange.min)} and {formatCurrency(optimalRange.max)} investment.
          </p>
        </div>
        
        <div className="card bg-slate-50 border border-slate-200">
          <h3 className="text-lg font-medium mb-3">ROI Sensitivity</h3>
          <p className="text-slate-700">
            {selectedChannel} shows high impact in early investment stages, with diminishing returns after {formatCurrency(optimalRange.max)}. Consider maintaining investment within the optimal zone for maximum efficiency.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResponseCurvesTab;