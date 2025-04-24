import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  ReferenceLine
} from 'recharts';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

// Mock data for optimization impact
const optimizationData = [
  {
    channel: 'TV',
    currentAllocation: 35,
    optimizedAllocation: 31,
    currentRevenue: 1400,
    optimizedRevenue: 1364,
    change: -2.6
  },
  {
    channel: 'Digital',
    currentAllocation: 25,
    optimizedAllocation: 32,
    currentRevenue: 1000,
    optimizedRevenue: 1408,
    change: 40.8
  },
  {
    channel: 'Radio',
    currentAllocation: 15,
    optimizedAllocation: 14,
    currentRevenue: 600,
    optimizedRevenue: 616,
    change: 2.7
  },
  {
    channel: 'Print',
    currentAllocation: 10,
    optimizedAllocation: 6,
    currentRevenue: 400,
    optimizedRevenue: 264,
    change: -34.0
  },
  {
    channel: 'CRM',
    currentAllocation: 8,
    optimizedAllocation: 11,
    currentRevenue: 320,
    optimizedRevenue: 484,
    change: 51.3
  },
  {
    channel: 'Promo',
    currentAllocation: 7,
    optimizedAllocation: 6,
    currentRevenue: 280,
    optimizedRevenue: 376,
    change: -5.0
  }
];

// Calculate totals for summary
const totalCurrentRevenue = optimizationData.reduce((sum, item) => sum + item.currentRevenue, 0) * 1000;
const totalOptimizedRevenue = optimizationData.reduce((sum, item) => sum + item.optimizedRevenue, 0) * 1000;
const totalChange = ((totalOptimizedRevenue - totalCurrentRevenue) / totalCurrentRevenue) * 100;

// Format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency: 'EUR',
    notation: value >= 1000000 ? 'compact' : 'standard',
    maximumFractionDigits: 1
  }).format(value);
};

// Format percentage
const formatPercentage = (value: number) => {
  return `${value.toFixed(1)}%`;
};

const OptimizationImpact: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* 1. Optimization Impact Chart */}
      <div className="card">
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          Optimization Impact
        </h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={optimizationData}
              margin={{ top: 20, right: 30, left: 20, bottom: 15 }}
              barGap={0}
              barCategoryGap={8}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="channel" 
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <YAxis 
                yAxisId="left"
                orientation="left"
                tickFormatter={(value) => `${value}%`}
                domain={[0, 60]}
                label={{ 
                  value: 'Allocation (%)', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle' }
                }}
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tickFormatter={(value) => `${value}K`}
                domain={[0, 1800]}
                label={{ 
                  value: 'Revenue (€K)', 
                  angle: 90, 
                  position: 'insideRight',
                  style: { textAnchor: 'middle' }
                }}
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'currentAllocation' || name === 'optimizedAllocation') {
                    return [`${value}%`, name === 'currentAllocation' ? 'Current Allocation' : 'Optimized Allocation'];
                  }
                  return [`€${value}K`, name === 'currentRevenue' ? 'Current Revenue' : 'Optimized Revenue'];
                }}
              />
              <Legend 
                payload={[
                  { value: 'Current Allocation (%)', type: 'rect', color: '#8B5CF6' }, // Purple
                  { value: 'Optimized Allocation (%)', type: 'rect', color: '#22C55E' }, // Green
                  { value: 'Current Revenue (€K)', type: 'rect', color: '#C4B5FD' }, // Lavender
                  { value: 'Optimized Revenue (€K)', type: 'rect', color: '#3B82F6' }  // Blue
                ]}
              />
              {/* Allocation bars (%) - Left Y-axis */}
              <Bar 
                yAxisId="left" 
                dataKey="currentAllocation" 
                fill="#8B5CF6" // Purple
                name="Current Allocation (%)"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                yAxisId="left" 
                dataKey="optimizedAllocation" 
                fill="#22C55E" // Green
                name="Optimized Allocation (%)"
                radius={[4, 4, 0, 0]}
              />
              
              {/* Revenue bars (€K) - Right Y-axis */}
              <Bar 
                yAxisId="right" 
                dataKey="currentRevenue" 
                fill="#C4B5FD" // Lavender
                name="Current Revenue (€K)"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                yAxisId="right" 
                dataKey="optimizedRevenue" 
                fill="#3B82F6" // Blue
                name="Optimized Revenue (€K)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* 2. Optimization Summary Table */}
      <div className="card">
        <h3 className="text-lg font-medium mb-4">Optimization Summary</h3>
        
        {/* Revenue summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="text-sm text-slate-500 mb-1">Current Revenue</div>
            <div className="text-xl font-semibold">{formatCurrency(totalCurrentRevenue)}</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="text-sm text-slate-500 mb-1">Optimized Revenue</div>
            <div className="text-xl font-semibold flex items-center">
              {formatCurrency(totalOptimizedRevenue)}
              <span className="text-success-600 text-sm ml-2 flex items-center">
                (+{totalChange.toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
        
        {/* Detailed table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-3 px-4 text-sm font-semibold text-slate-700">Channel</th>
                <th className="py-3 px-4 text-sm font-semibold text-slate-700">Current Budget (%)</th>
                <th className="py-3 px-4 text-sm font-semibold text-slate-700">Optimized Budget (%)</th>
                <th className="py-3 px-4 text-sm font-semibold text-slate-700">Current Revenue (€K)</th>
                <th className="py-3 px-4 text-sm font-semibold text-slate-700">Optimized Revenue (€K)</th>
                <th className="py-3 px-4 text-sm font-semibold text-slate-700">Revenue Change</th>
              </tr>
            </thead>
            <tbody>
              {optimizationData.map((item, index) => (
                <tr key={index} className="border-b border-slate-100">
                  <td className="py-3 px-4">{item.channel}</td>
                  <td className="py-3 px-4">{formatPercentage(item.currentAllocation)}</td>
                  <td className="py-3 px-4">{formatPercentage(item.optimizedAllocation)}</td>
                  <td className="py-3 px-4">€{item.currentRevenue}K</td>
                  <td className="py-3 px-4">€{item.optimizedRevenue}K</td>
                  <td className="py-3 px-4">
                    <div className={`flex items-center ${
                      item.change > 0 ? 'text-success-600' : 
                      item.change < 0 ? 'text-error-600' : 'text-slate-500'
                    }`}>
                      {item.change > 0 ? (
                        <ArrowUp size={14} className="mr-1" />
                      ) : item.change < 0 ? (
                        <ArrowDown size={14} className="mr-1" />
                      ) : (
                        <Minus size={14} className="mr-1" />
                      )}
                      {item.change > 0 ? '+' : ''}{item.change.toFixed(1)}%
                    </div>
                  </td>
                </tr>
              ))}
              {/* Total row */}
              <tr className="bg-slate-50 font-medium">
                <td className="py-3 px-4">Total</td>
                <td className="py-3 px-4">100.0%</td>
                <td className="py-3 px-4">100.0%</td>
                <td className="py-3 px-4">€{optimizationData.reduce((sum, item) => sum + item.currentRevenue, 0)}K</td>
                <td className="py-3 px-4">€{optimizationData.reduce((sum, item) => sum + item.optimizedRevenue, 0)}K</td>
                <td className="py-3 px-4 text-success-600 flex items-center">
                  <ArrowUp size={14} className="mr-1" />
                  +{totalChange.toFixed(1)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* 3. Recommendations */}
      <div className="card bg-slate-50 border border-slate-200">
        <h3 className="text-lg font-medium mb-4">Recommendations</h3>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
              1
            </div>
            <p className="text-slate-700">Shifting 4% from TV to Digital to capitalize on higher digital engagement rates.</p>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
              2
            </div>
            <p className="text-slate-700">Increase CRM investment by 3% to leverage high ROI potential in direct customer communications.</p>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
              3
            </div>
            <p className="text-slate-700">Reduce Print allocation by 4% due to declining performance and diminishing returns.</p>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
              4
            </div>
            <p className="text-slate-700">Overall ROI improvement: +0.8x, with potential for additional gains through seasonal adjustments.</p>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default OptimizationImpact; 