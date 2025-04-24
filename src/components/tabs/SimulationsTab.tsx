import React, { useState, useEffect } from 'react';
import { FilterState, SimulationData } from '../../types';
import { filterData } from '../../data/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, Treemap } from 'recharts';
import { Play, BarChart4, Calculator, Zap } from 'lucide-react';
import ChannelColorBadge from '../ui/ChannelColorBadge';

interface SimulationConfig {
  name: string;
  kpi: 'ROI' | 'Revenue' | 'Volume';
  totalBudget: number;
  startDate: Date;
  endDate: Date;
  granularity: 'Monthly' | 'Quarterly' | 'Yearly';
  selectedChannels: string[];
}

interface OptimizationConfig {
  name: string;
  kpi: 'ROI' | 'Revenue' | 'Volume';
  totalBudget: number;
  startDate: Date;
  endDate: Date;
  constraints: {
    channel: string;
    min: number;
    max: number;
    fixed: boolean;
  }[];
  allowAiOverride: boolean;
}

interface SimulationsTabProps {
  filters: FilterState;
}

// Return ROI based on budget change (simplified model)
const calculateExpectedROI = (currentBudget: number, newBudget: number, currentROI: number): number => {
  // Simple diminishing returns model
  // If budget increases, ROI decreases (diminishing returns)
  // If budget decreases, ROI increases (efficiency)
  if (newBudget === currentBudget) return currentROI;
  
  const ratio = newBudget / currentBudget;
  // Diminishing returns factor: smaller = more pronounced diminishing returns
  const diminishingFactor = 0.7;
  
  // Calculate adjusted ROI with diminishing returns
  if (ratio > 1) {
    // Budget increased
    return currentROI * Math.pow(ratio, -1 * (1 - diminishingFactor));
  } else {
    // Budget decreased
    return currentROI * Math.pow(ratio, -1 * (diminishingFactor - 0.5));
  }
};

// Optimize budget allocation
const optimizeBudget = (data: SimulationData[], totalBudget: number): SimulationData[] => {
  // Sort channels by ROI (highest first)
  const channelsByEfficiency = [...data].sort((a, b) => {
    // Calculate the marginal ROI (derivative of the ROI function)
    const marginalROIa = calculateExpectedROI(a.currentBudget, a.currentBudget * 1.1, a.expectedROI) - a.expectedROI;
    const marginalROIb = calculateExpectedROI(b.currentBudget, b.currentBudget * 1.1, b.expectedROI) - b.expectedROI;
    
    return marginalROIb - marginalROIa;
  });
  
  // Initial budget is minimum for each channel (50% of current budget as a floor)
  const result = channelsByEfficiency.map(channel => ({
    ...channel,
    newBudget: channel.currentBudget * 0.5
  }));
  
  // Calculate remaining budget
  let remainingBudget = totalBudget - result.reduce((sum, channel) => sum + channel.newBudget, 0);
  
  // Distribute remaining budget to channels with highest ROI first
  while (remainingBudget > 1000 && channelsByEfficiency.length > 0) {
    // Find channel with highest marginal ROI
    const indexOfHighestROI = channelsByEfficiency
      .map((channel, index) => {
        const matchingChannel = result.find(c => c.channel === channel.channel);
        if (!matchingChannel) return { index, marginalROI: 0 };
        
        const currentNewBudget = matchingChannel.newBudget;
        const incrementAmount = Math.min(remainingBudget, 10000);
        const roiAtCurrent = calculateExpectedROI(channel.currentBudget, currentNewBudget, channel.expectedROI);
        const roiAtIncreased = calculateExpectedROI(channel.currentBudget, currentNewBudget + incrementAmount, channel.expectedROI);
        
        // Calculate marginal ROI
        const marginalROI = (roiAtIncreased - roiAtCurrent) / incrementAmount;
        
        return { index, marginalROI };
      })
      .sort((a, b) => b.marginalROI - a.marginalROI)[0].index;
    
    // No more positive marginal ROI
    if (indexOfHighestROI === undefined) break;
    
    const channelToIncrease = channelsByEfficiency[indexOfHighestROI];
    const matchingIndex = result.findIndex(c => c.channel === channelToIncrease.channel);
    
    // Increment budget for this channel
    const incrementAmount = Math.min(remainingBudget, 10000);
    result[matchingIndex].newBudget += incrementAmount;
    remainingBudget -= incrementAmount;
    
    // Check if we've hit max budget for this channel (3x original as a ceiling)
    if (result[matchingIndex].newBudget >= channelToIncrease.currentBudget * 3) {
      // Remove from consideration
      channelsByEfficiency.splice(indexOfHighestROI, 1);
    }
  }
  
  // Update expected ROI based on new budgets
  return result.map(channel => ({
    ...channel,
    expectedROI: calculateExpectedROI(channel.currentBudget, channel.newBudget, channel.expectedROI)
  }));
};

const SimulationsTab: React.FC<SimulationsTabProps> = ({ filters }) => {
  const { simulationData: initialData } = filterData(filters.country, filters.brand, filters.dateRange);
  
  const [simulationData, setSimulationData] = useState<SimulationData[]>(initialData);
  const [isOptimized, setIsOptimized] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showSimulationModal, setShowSimulationModal] = useState(false);
  const [showOptimizationModal, setShowOptimizationModal] = useState(false);
  const [simulationConfig, setSimulationConfig] = useState<SimulationConfig>({
    name: '',
    kpi: 'ROI',
    totalBudget: 0,
    startDate: new Date(),
    endDate: new Date(),
    granularity: 'Monthly',
    selectedChannels: []
  });
  const [optimizationConfig, setOptimizationConfig] = useState<OptimizationConfig>({
    name: '',
    kpi: 'ROI',
    totalBudget: 0,
    startDate: new Date(),
    endDate: new Date(),
    constraints: [],
    allowAiOverride: false
  });

  // Reset simulation when filters change
  useEffect(() => {
    setSimulationData(initialData);
    setIsOptimized(false);
    setIsSimulating(false);
  }, [filters, initialData]);

  const handleBudgetChange = (channel: string, newValue: number) => {
    setIsOptimized(false);
    setSimulationData(prevData => 
      prevData.map(item => {
        if (item.channel === channel) {
          const expectedROI = calculateExpectedROI(item.currentBudget, newValue, item.expectedROI);
          return {
            ...item,
            newBudget: newValue,
            expectedROI
          };
        }
        return item;
      })
    );
  };

  const handleCreateSimulation = () => {
    setShowSimulationModal(true);
  };

  const handleStartSimulation = () => {
    // Implement simulation logic based on config
    setShowSimulationModal(false);
    // Update simulation data...
  };

  const handleOptimize = () => {
    setShowOptimizationModal(true);
  };

  const handleStartOptimization = () => {
    setIsSimulating(true);
    
    // Simulate optimization calculation
    setTimeout(() => {
      const totalCurrentBudget = simulationData.reduce((sum, channel) => sum + channel.currentBudget, 0);
      const optimizedData = optimizeBudget(simulationData, totalCurrentBudget);
      setSimulationData(optimizedData);
      setIsOptimized(true);
      setIsSimulating(false);
      setShowOptimizationModal(false);
    }, 1000);
  };

  const handleResetSimulation = () => {
    setSimulationData(initialData);
    setIsOptimized(false);
  };
  
  // Calculate totals
  const totalCurrentBudget = initialData.reduce((sum, channel) => sum + channel.currentBudget, 0);
  const totalNewBudget = simulationData.reduce((sum, channel) => sum + channel.newBudget, 0);
  
  const totalCurrentRevenue = initialData.reduce((sum, channel) => sum + (channel.currentBudget * channel.expectedROI), 0);
  const totalNewRevenue = simulationData.reduce((sum, channel) => sum + (channel.newBudget * channel.expectedROI), 0);
  
  const avgCurrentROI = totalCurrentRevenue / totalCurrentBudget;
  const avgNewROI = totalNewRevenue / totalNewBudget;
  
  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: value >= 1000000 ? 'compact' : 'standard',
      maximumFractionDigits: 1
    }).format(value);
  };
  
  // Prepare data for comparison chart
  const comparisonChartData = simulationData.map(item => {
    const initialChannel = initialData.find(c => c.channel === item.channel);
    const channelData = filterData(filters.country, filters.brand, filters.dateRange).channelData
      .find(c => c.channel === item.channel);
    
    return {
      name: item.channel,
      current: initialChannel?.currentBudget || 0,
      new: item.newBudget,
      color: channelData?.color || '#94a3b8'
    };
  });
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-slate-800">Budget Simulations</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card h-40 flex flex-col justify-center items-center cursor-pointer hover:bg-slate-50 transition-colors" onClick={handleResetSimulation}>
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mb-3">
            <Play size={24} className="text-primary-600" />
          </div>
          <h3 className="text-lg font-medium">Create New Simulation</h3>
          <p className="text-sm text-slate-500 mt-1">Reset and start a new budget allocation</p>
        </div>
        
        <div 
          className={`card h-40 flex flex-col justify-center items-center cursor-pointer hover:bg-slate-50 transition-colors ${isSimulating ? 'opacity-50 pointer-events-none' : ''}`}
          onClick={handleOptimize}
        >
          <div className="w-12 h-12 rounded-full bg-accent-100 flex items-center justify-center mb-3">
            <Zap size={24} className="text-accent-600" />
          </div>
          <h3 className="text-lg font-medium">Run Optimization</h3>
          <p className="text-sm text-slate-500 mt-1">
            {isSimulating ? 'Calculating optimal allocation...' : 'Automatically optimize budget allocation'}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <Calculator size={18} className="text-secondary-600" />
            Budget Allocation
          </h3>
          <div className="space-y-4">
            {simulationData.map((item, index) => {
              const initialChannel = initialData.find(c => c.channel === item.channel);
              const percentChange = ((item.newBudget - initialChannel!.currentBudget) / initialChannel!.currentBudget) * 100;
              
              return (
                <div key={index} className="border border-slate-100 rounded-md p-4">
                  <div className="flex items-center justify-between mb-3">
                    <ChannelColorBadge channel={item.channel} />
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500">Current: {formatCurrency(initialChannel!.currentBudget)}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        percentChange > 0 
                          ? 'bg-success-100 text-success-700' 
                          : percentChange < 0
                            ? 'bg-error-100 text-error-700'
                            : 'bg-slate-100 text-slate-700'
                      }`}>
                        {percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={initialChannel!.currentBudget * 0.5}
                      max={initialChannel!.currentBudget * 2}
                      step={1000}
                      value={item.newBudget}
                      onChange={(e) => handleBudgetChange(item.channel, Number(e.target.value))}
                      className="flex-1"
                    />
                    <div className="w-32">
                      <input
                        type="number"
                        min={0}
                        step={10000}
                        value={Math.round(item.newBudget)}
                        onChange={(e) => handleBudgetChange(item.channel, Number(e.target.value))}
                        className="input w-full text-right"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-sm text-slate-500">
                      Expected ROI: <span className="font-medium">{item.expectedROI.toFixed(2)}x</span>
                    </span>
                    <span className="text-sm text-slate-500">
                      Revenue: <span className="font-medium">{formatCurrency(item.newBudget * item.expectedROI)}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
            <BarChart4 size={18} className="text-primary-600" />
            Performance Summary
          </h3>
          
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h4 className="text-sm font-medium text-slate-500 mb-2">Total Investment</h4>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-2xl font-semibold">{formatCurrency(totalNewBudget)}</p>
                  <p className="text-sm text-slate-500">New Budget</p>
                </div>
                <div className="text-right">
                  <p className="text-lg text-slate-600">{formatCurrency(totalCurrentBudget)}</p>
                  <p className="text-sm text-slate-500">Current Budget</p>
                </div>
              </div>
            </div>
            
            <div className="border-b border-slate-100 pb-4">
              <h4 className="text-sm font-medium text-slate-500 mb-2">Expected Revenue</h4>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-2xl font-semibold">{formatCurrency(totalNewRevenue)}</p>
                  <p className="text-sm text-slate-500">New Revenue</p>
                </div>
                <div className="text-right">
                  <p className="text-lg text-slate-600">{formatCurrency(totalCurrentRevenue)}</p>
                  <p className="text-sm text-slate-500">Current Revenue</p>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-slate-500 mb-2">Average ROI</h4>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-2xl font-semibold">{avgNewROI.toFixed(2)}x</p>
                  <p className="text-sm text-slate-500">New ROI</p>
                </div>
                <div className="text-right">
                  <p className="text-lg text-slate-600">{avgCurrentROI.toFixed(2)}x</p>
                  <p className="text-sm text-slate-500">Current ROI</p>
                </div>
              </div>
              
              <div className="mt-3">
                <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                  avgNewROI > avgCurrentROI 
                    ? 'bg-success-100 text-success-700' 
                    : 'bg-error-100 text-error-700'
                }`}>
                  {avgNewROI > avgCurrentROI ? '+' : ''}{((avgNewROI / avgCurrentROI - 1) * 100).toFixed(1)}% ROI Change
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Comparison Chart */}
      <div className="card">
        <h3 className="text-lg font-medium mb-4">Current vs {isOptimized ? 'Optimized' : 'New'} Allocation</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={comparisonChartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  formatCurrency(value as number), 
                  name === 'current' ? 'Current Budget' : 'New Budget'
                ]}
              />
              <Legend 
                payload={[
                  { value: 'Current Budget', type: 'square', color: '#94a3b8' },
                  { value: isOptimized ? 'Optimized Budget' : 'New Budget', type: 'square', color: '#3b82f6' }
                ]}
              />
              <Bar dataKey="current" name="Current Budget" fill="#94a3b8" />
              <Bar dataKey="new" name={isOptimized ? 'Optimized Budget' : 'New Budget'}>
                {comparisonChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {isOptimized && (
        <div className="card bg-success-50 border border-success-200">
          <h3 className="text-lg font-medium mb-3 text-success-800">Optimization Results</h3>
          <p className="text-slate-700 mb-3">
            The optimization algorithm has redistributed your budget to maximize overall ROI while maintaining the total investment of {formatCurrency(totalCurrentBudget)}.
          </p>
          <div className="space-y-2">
            <p className="text-sm text-slate-600">
              <span className="font-semibold">Expected Revenue Increase:</span> {formatCurrency(totalNewRevenue - totalCurrentRevenue)} ({((totalNewRevenue / totalCurrentRevenue - 1) * 100).toFixed(1)}%)
            </p>
            <p className="text-sm text-slate-600">
              <span className="font-semibold">ROI Improvement:</span> From {avgCurrentROI.toFixed(2)}x to {avgNewROI.toFixed(2)}x ({((avgNewROI / avgCurrentROI - 1) * 100).toFixed(1)}%)
            </p>
            <p className="text-sm text-slate-600">
              <span className="font-semibold">Major Changes:</span> Increased investment in high-performing channels like {simulationData.sort((a, b) => (b.newBudget/b.currentBudget) - (a.newBudget/a.currentBudget))[0].channel} and decreased in lower-performing channels like {simulationData.sort((a, b) => (a.newBudget/a.currentBudget) - (b.newBudget/b.currentBudget))[0].channel}.
            </p>
          </div>
        </div>
      )}
      
      {/* Simulation Modal */}
      {showSimulationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h2 className="text-xl font-semibold mb-4">Create New Simulation</h2>
            
            {/* Step 1: KPI Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Select KPI</label>
              <select
                className="select w-full"
                value={simulationConfig.kpi}
                onChange={(e) => setSimulationConfig({
                  ...simulationConfig,
                  kpi: e.target.value as 'ROI' | 'Revenue' | 'Volume'
                })}
              >
                <option value="ROI">ROI</option>
                <option value="Revenue">Revenue</option>
                <option value="Volume">Volume</option>
              </select>
            </div>
            
            {/* Step 2: Configuration */}
            <div className="space-y-4">
              {/* ... Configuration fields ... */}
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="btn btn-secondary"
                onClick={() => setShowSimulationModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleStartSimulation}
              >
                Start Simulation
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Optimization Modal */}
      {showOptimizationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h2 className="text-xl font-semibold mb-4">Optimization Settings</h2>
            
            {/* ... Optimization configuration fields ... */}
            
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="btn btn-secondary"
                onClick={() => setShowOptimizationModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleStartOptimization}
              >
                Run Optimization
              </button>
            </div>
          </div>
        </div>
      )}
      
      <footer className="mt-8 text-center text-sm text-slate-500">
        © 2025 All rights reserved. Powered by eleven strategy.
      </footer>
    </div>
  );
};

export default SimulationsTab;