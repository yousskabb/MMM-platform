import React, { useState, useEffect } from 'react';
import { FilterState, SimulationData } from '../../types';
import { filterData } from '../../data/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, Treemap } from 'recharts';
import { Play, BarChart4, Calculator, Zap, Eye, X } from 'lucide-react';
import ChannelColorBadge from '../ui/ChannelColorBadge';
// Import the components (adjust paths if necessary)
import CreateSimulation from '../simulations/CreateSimulation';
import CreateOptimization from '../optimization/CreateOptimization';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';

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
  const [selectedScenario, setSelectedScenario] = useState<any>(null);
  const [showScenarioDetails, setShowScenarioDetails] = useState(false);
  
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
  
  const handleViewScenario = (scenario: any) => {
    setSelectedScenario(scenario);
    setShowScenarioDetails(true);
  };
  
  const closeScenarioDetails = () => {
    setShowScenarioDetails(false);
    setSelectedScenario(null);
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
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-EU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
  
  // Update the optimized budget data to include expected contribution and ROI
  const optimizedBudget = [
    { name: "TV", size: 125000, percentage: 35.7, contribution: 375000, roi: 3.0 },
    { name: "Digital", size: 92000, percentage: 26.3, contribution: 331200, roi: 3.6 },
    { name: "Radio", size: 48000, percentage: 13.7, contribution: 124800, roi: 2.6 },
    { name: "Print", size: 18000, percentage: 5.1, contribution: 39600, roi: 2.2 },
    { name: "CRM", size: 42000, percentage: 12.0, contribution: 189000, roi: 4.5 },
    { name: "Promo", size: 25000, percentage: 7.2, contribution: 87500, roi: 3.5 }
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

  // Render channel distribution for a selected scenario
  const renderScenarioChannelDistribution = (scenario: any) => {
    if (!scenario) return null;

    const scenarioData = scenario.type === 'optimization' 
      ? scenario.channels 
      : scenario.levers.map((lever: any) => ({
          name: lever.name,
          size: lever.newBudget,
          percentage: Math.round((lever.newBudget / scenario.totalBudget) * 100 * 10) / 10
        }));

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-auto">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold">{scenario.name} Details</h2>
            <button onClick={closeScenarioDetails} className="text-gray-500 hover:text-gray-700">
              <X size={20} />
            </button>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Type</p>
                <p className="font-medium capitalize">{scenario.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium capitalize">{scenario.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">ROI</p>
                <p className="font-medium">{scenario.roi}x</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Contribution</p>
                <p className="font-medium">{formatCurrency(scenario.contribution)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Budget</p>
                <p className="font-medium">{formatCurrency(scenario.totalBudget)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Timeframe</p>
                <p className="font-medium">{scenario.timeframe}</p>
              </div>
        </div>

            <h3 className="text-lg font-medium mb-4">Channel Distribution</h3>
            
            <div className="h-80 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <Treemap
                  data={scenarioData}
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

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Channel</TableHead>
                  <TableHead className="text-right">Budget</TableHead>
                  <TableHead className="text-right">Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {scenarioData.map((item: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">€{item.size.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{item.percentage}%</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-medium">
                    <TableCell>Total</TableCell>
                  <TableCell className="text-right">€{scenarioData.reduce((sum: number, item: any) => sum + item.size, 0).toLocaleString()}</TableCell>
                  <TableCell className="text-right">100%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-slate-800">Budget Simulations</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg bg-white p-6 shadow-sm flex flex-col h-auto">
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2">Create New Simulation</h3>
            <p className="text-sm text-slate-600 mb-4">
              Run a what-if analysis based on different budget allocations
            </p>
            <ul className="list-disc pl-5 text-sm text-slate-500 space-y-1 mb-4">
              <li>Simulate different budget scenarios without constraints</li>
              <li>See how changing your budget allocation affects your overall marketing performance</li>
              <li>Test incremental investments across channels</li>
              <li>Recalculate contributions on the fly</li>
              <li>Compare up to 5 scenarios at once</li>
            </ul>
          </div>
          <Button 
            className="mt-auto w-full"
            onClick={() => setShowSimulation(true)}
          >
            <Play size={16} className="mr-2" /> Start Simulation
          </Button>
        </div>
        
        <div className="border rounded-lg bg-white p-6 shadow-sm flex flex-col h-auto">
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2">Run Optimization</h3>
            <p className="text-sm text-slate-600 mb-4">
              Let AI optimize your budget allocation for maximum performance
            </p>
            <ul className="list-disc pl-5 text-sm text-slate-500 space-y-1 mb-4">
              <li>Simulate different budget scenarios without constraints</li>
              <li>See how changing your budget allocation affects your overall marketing performance</li>
              <li>Test incremental investments across channels</li>
              <li>Recalculate contributions on the fly</li>
              <li>Compare up to 5 scenarios at once</li>
            </ul>
          </div>
          <Button 
            className="mt-auto w-full"
            variant="primary"
            onClick={() => setShowOptimization(true)}
          >
            <Zap size={16} className="mr-2" /> Start Optimization
          </Button>
        </div>
      </div>

      {/* Always show scenarios table, even if empty */}
      <div className="border rounded-lg bg-white p-4 shadow-sm">
        <h3 className="text-lg font-medium mb-4">Your Scenarios</h3>
        <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                <TableHead>ROI</TableHead>
                <TableHead>Contribution</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
              {scenarios.length > 0 ? (
                scenarios.map((scenario, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{scenario.name}</TableCell>
                    <TableCell className="capitalize">{scenario.type}</TableCell>
                    <TableCell className="capitalize">{scenario.status}</TableCell>
                    <TableCell>{scenario.roi}x</TableCell>
                    <TableCell>{formatCurrency(scenario.contribution)}</TableCell>
                    <TableCell>{formatDate(scenario.date)}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleViewScenario(scenario)} 
                        className="flex items-center gap-1"
                      >
                        <Eye size={16} /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-slate-500">
                    No scenarios created yet. Create a simulation or run an optimization to get started.
                  </TableCell>
                </TableRow>
              )}
              </TableBody>
            </Table>
        </div>
      </div>
      
      {/* Show scenario details modal if a scenario is selected */}
      {showScenarioDetails && selectedScenario && renderScenarioChannelDistribution(selectedScenario)}
      
      {/* Moved below the scenarios table - Optimized Budget Allocation card */}
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
                <BarChart
                  data={optimizedBudget}
                margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                {/* Single Y axis with Euro values */}
                <YAxis 
                  label={{ value: 'Amount (€)', angle: -90, position: 'insideLeft' }} 
                  tickFormatter={(value) => `€${value >= 1000 ? `${value/1000}k` : value}`}
                />
                <Tooltip formatter={(value) => [`€${Number(value).toLocaleString()}`, '']} />
                  <Legend />
                <Bar dataKey="size" name="Budget" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="contribution" name="Expected Contribution" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Channel</TableHead>
                  <TableHead className="text-right">Budget (€)</TableHead>
                  <TableHead className="text-right">Expected Contribution (€)</TableHead>
                  <TableHead className="text-right">ROI (multiple)</TableHead>
                  <TableHead className="text-right">Percentage (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {optimizedBudget.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">€{item.size.toLocaleString()}</TableCell>
                      <TableCell className="text-right">€{item.contribution.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{item.roi}x</TableCell>
                      <TableCell className="text-right">{item.percentage}%</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-medium">
                    <TableCell>Total</TableCell>
                  <TableCell className="text-right">€{optimizedBudget.reduce((sum, item) => sum + item.size, 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right">€{optimizedBudget.reduce((sum, item) => sum + item.contribution, 0).toLocaleString()}</TableCell>
                  <TableCell className="text-right">{(optimizedBudget.reduce((sum, item) => sum + item.contribution, 0) / optimizedBudget.reduce((sum, item) => sum + item.size, 0)).toFixed(1)}x</TableCell>
                    <TableCell className="text-right">100%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      
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
    </div>
  );
};

export default SimulationsTab;
