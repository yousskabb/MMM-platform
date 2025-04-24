import React, { useState, useEffect } from 'react';
import { FilterState, SimulationData } from '../../types';
import { filterData } from '../../data/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, Treemap } from 'recharts';
import { Play, BarChart4, Calculator, Zap } from 'lucide-react';
import ChannelColorBadge from '../ui/ChannelColorBadge';
// Import the components (adjust paths if necessary)
import CreateSimulation from '../simulations/CreateSimulation';
import CreateOptimization from '../optimization/CreateOptimization';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';

interface SimulationsTabProps {
  filters: FilterState;
}

// Custom component for the Treemap
const CustomizedContent = (props: any) => {
  const { x, y, width, height, index, name, percentage, value } = props;
  
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{ fill: COLORS[index % COLORS.length], stroke: '#fff', strokeWidth: 2 }}
      />
      {width > 70 && height > 60 ? (
        <>
          <text x={x + width / 2} y={y + height / 2 - 12} textAnchor="middle" fill="#fff" fontWeight="bold">
            {name}
          </text>
          <text x={x + width / 2} y={y + height / 2 + 12} textAnchor="middle" fill="#fff">
            {percentage}%
          </text>
        </>
      ) : null}
    </g>
  );
};

// Colors for the channels
const COLORS = ["#8884d8", "#55B78D", "#82ca9d", "#ffc658", "#ff8042", "#0088fe"];

const SimulationsTab: React.FC<SimulationsTabProps> = ({ filters }) => {
  const { simulationData: initialData } = filterData(filters.country, filters.brand, filters.dateRange);
  
  const [simulationData, setSimulationData] = useState<SimulationData[]>(initialData);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);
  const [showOptimization, setShowOptimization] = useState(false);
  const [scenarios, setScenarios] = useState<any[]>([]);
  
  // Reset simulation when filters change
  useEffect(() => {
    setSimulationData(initialData);
    setIsSimulating(false);
  }, [filters, initialData]);
  
  const handleBudgetChange = (channel: string, newValue: number) => {
    setSimulationData(prevData => 
      prevData.map(item => {
        if (item.channel === channel) {
          // Simple ROI calculation based on budget change
          const expectedROI = item.expectedROI * (1 - (newValue - item.currentBudget) / item.currentBudget * 0.1);
          return {
            ...item,
            newBudget: newValue,
            expectedROI: expectedROI > 0 ? expectedROI : item.expectedROI * 0.5
          };
        }
        return item;
      })
    );
  };
  
  const handleAddScenario = (newScenario: any) => {
    setScenarios(prev => [newScenario, ...prev]);
    setShowSimulation(false);
    setShowOptimization(false);
  };
  
  // Calculate totals
  const totalCurrentBudget = initialData.reduce((sum, channel) => sum + channel.currentBudget, 0);
  const totalNewBudget = simulationData.reduce((sum, channel) => sum + channel.newBudget, 0);
  
  const totalCurrentRevenue = initialData.reduce((sum, channel) => sum + (channel.currentBudget * channel.expectedROI), 0);
  const totalNewRevenue = simulationData.reduce((sum, channel) => sum + (channel.newBudget * channel.expectedROI), 0);
  
  const avgCurrentROI = totalCurrentRevenue / totalCurrentBudget;
  const avgNewROI = totalNewRevenue / totalNewBudget;
  
  // Format currency - update to use Euro symbol
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency: 'EUR',
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
  
  // Mock optimized budget data for the treemap
  const optimizedBudget = [
    { name: "TV", size: 125000, percentage: 35.7 },
    { name: "Digital", size: 92000, percentage: 26.3 },
    { name: "Radio", size: 48000, percentage: 13.7 },
    { name: "Print", size: 18000, percentage: 5.1 },
    { name: "CRM", size: 42000, percentage: 12.0 },
    { name: "Promo", size: 25000, percentage: 7.2 }
  ];
  
  // Render create simulation or optimization components if needed
  if (showSimulation) {
    return (
      <CreateSimulation 
        onClose={() => setShowSimulation(false)}
        onComplete={handleAddScenario}
      />
    );
  }
  
  if (showOptimization) {
    return (
      <CreateOptimization 
        onClose={() => setShowOptimization(false)}
        onComplete={handleAddScenario}
      />
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-slate-800">Budget Simulations</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div 
          className="border rounded-lg bg-white p-4 shadow-sm h-40 flex flex-col justify-center items-center cursor-pointer hover:bg-slate-50 transition-colors"
          onClick={() => setShowSimulation(true)}
        >
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mb-3">
            <Play size={24} className="text-primary-600" />
          </div>
          <h3 className="text-lg font-medium">Create New Simulation</h3>
          <p className="text-sm text-slate-500 mt-1">Create a new budget allocation</p>
        </div>
        
        <div 
          className="border rounded-lg bg-white p-4 shadow-sm h-40 flex flex-col justify-center items-center cursor-pointer hover:bg-slate-50 transition-colors"
          onClick={() => setShowOptimization(true)}
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
      
      {scenarios.length > 0 && (
        <div className="border rounded-lg bg-white p-4 shadow-sm">
          <h3 className="text-lg font-medium mb-4">Your Scenarios</h3>
          <div className="space-y-2">
            {scenarios.map((scenario, index) => (
              <div key={index} className="p-3 border rounded flex justify-between items-center">
                <div>
                  <h4 className="font-medium">{scenario.name}</h4>
                  <p className="text-sm text-slate-500">
                    {scenario.type} - ROI: {scenario.roi}x
                  </p>
                </div>
                <p className="text-sm font-medium">{formatCurrency(scenario.contribution)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border rounded-lg bg-white p-4 shadow-sm">
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
        
        <div className="border rounded-lg bg-white p-4 shadow-sm">
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
      
      <div className="border rounded-lg bg-white p-4 shadow-sm">
        <h3 className="text-lg font-medium mb-4">Current vs New Allocation</h3>
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
                  { value: 'New Budget', type: 'square', color: '#3b82f6' }
                ]}
              />
              <Bar dataKey="current" name="Current Budget" fill="#94a3b8" />
              <Bar dataKey="new" name="New Budget">
                {comparisonChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Add the optimized budget allocation chart */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Optimized Budget Allocation</CardTitle>
          <CardDescription>
            Recommended budget distribution based on best performing scenario
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={optimizedBudget}
                dataKey="size"
                aspectRatio={4 / 3}
                stroke="#fff"
                content={<CustomizedContent />}
              >
                <Tooltip
                  formatter={(value) => [`€${Number(value).toLocaleString()}`, "Budget"]}
                  labelFormatter={(name) => `${name}`}
                />
              </Treemap>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Channel</TableHead>
                  <TableHead className="text-right">Budget</TableHead>
                  <TableHead className="text-right">Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {optimizedBudget.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">€{item.size.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{item.percentage}%</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-medium">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right">€{optimizedBudget.reduce((sum, item) => sum + item.size, 0).toLocaleString()}</TableCell>
                  <TableCell className="text-right">100%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <footer className="mt-8 text-center text-sm text-slate-500">
        © 2025 All rights reserved. Powered by eleven strategy.
      </footer>
    </div>
  );
};

export default SimulationsTab;
