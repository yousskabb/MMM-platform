import React, { useState, useEffect } from 'react';
import { FilterState } from '../../types';
import { filterDataByYear, getAvailableYears } from '../../data/dataService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ComposedChart, Area, Line } from 'recharts';
import { CheckCircle, AlertCircle } from 'lucide-react';
import ChannelColorBadge from '../ui/ChannelColorBadge';
import { formatNumber, formatNumberDetailed, formatNumberAxis } from '../../utils/numberFormatter';

interface SimulationsTabProps {
  filters: FilterState;
}

interface SimulationRow {
  channel: string;
  referenceBudget: number;
  newBudget: number;
  variation: number;
  roi: number;
  expectedContribution: number;
  color: string;
}

const SimulationsTab: React.FC<SimulationsTabProps> = ({ filters }) => {
  const [latestYear, setLatestYear] = useState<number>(2025);
  const [referenceData, setReferenceData] = useState<any[]>([]);
  const [simulationData, setSimulationData] = useState<SimulationRow[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const [isValidated, setIsValidated] = useState(false);

  // Load latest year data on mount
  useEffect(() => {
    const availableYears = getAvailableYears();
    if (availableYears.length > 0) {
      const latest = availableYears[availableYears.length - 1];
      setLatestYear(latest);

      const data = filterDataByYear(latest);
      setReferenceData(data.channelData);

      // Check if there's saved simulation state
      const savedSimulation = localStorage.getItem('simulationState');
      const savedIsStarted = localStorage.getItem('simulationStarted') === 'true';
      const savedIsValidated = localStorage.getItem('simulationValidated') === 'true';

      if (savedSimulation && savedIsStarted) {
        try {
          const parsedSimulation = JSON.parse(savedSimulation);
          setSimulationData(parsedSimulation);
          setIsStarted(savedIsStarted);
          setIsValidated(savedIsValidated);
        } catch (error) {
          console.error('Error parsing saved simulation:', error);
          // Fallback to default initialization
          initializeSimulationData(data.channelData);
        }
      } else {
        // Initialize simulation data
        initializeSimulationData(data.channelData);
      }
    }
  }, []);

  const initializeSimulationData = (channelData: any[]) => {
    const initData: SimulationRow[] = channelData.map(channel => ({
      channel: channel.channel,
      referenceBudget: channel.investment,
      newBudget: channel.investment, // Start with same as reference
      variation: 0,
      roi: channel.roi,
      expectedContribution: channel.investment * channel.roi, // Will be calculated when user inputs budget
      color: channel.color
    }));
    setSimulationData(initData);
  };

  // Save simulation data to localStorage whenever it changes
  useEffect(() => {
    if (simulationData.length > 0) {
      localStorage.setItem('simulationState', JSON.stringify(simulationData));
    }
  }, [simulationData]);

  const handleBudgetChange = (channel: string, inputValue: string) => {
    // User inputs in millions, accept both ; and , as decimal separators

    // Replace ; with . for parsing
    const normalizedValue = inputValue.replace(/;/g, '.').replace(/,/g, '.');

    // If empty, allow it
    if (normalizedValue === '' || normalizedValue === '.') {
      setSimulationData(prev =>
        prev.map(item => {
          if (item.channel === channel) {
            return {
              ...item,
              newBudget: 0,
              variation: 0,
              expectedContribution: 0
            };
          }
          return item;
        })
      );
      return;
    }

    const parsedValue = parseFloat(normalizedValue);

    // If not a valid number, just return (let user continue typing)
    if (isNaN(parsedValue)) {
      return;
    }

    const newValue = parsedValue * 1000000;

    setSimulationData(prev =>
      prev.map(item => {
        if (item.channel === channel) {
          const variation = item.referenceBudget > 0 ? ((newValue - item.referenceBudget) / item.referenceBudget) * 100 : 0;
          const expectedContribution = newValue * item.roi;
          return {
            ...item,
            newBudget: newValue,
            variation,
            expectedContribution
          };
        }
        return item;
      })
    );
  };

  const handleValidate = () => {
    setIsValidated(true);
    localStorage.setItem('simulationValidated', 'true');
  };

  const handleStartSimulation = () => {
    setIsStarted(true);
    setIsValidated(false);
    localStorage.setItem('simulationStarted', 'true');
  };

  const handleReset = () => {
    const initData: SimulationRow[] = referenceData.map(channel => ({
      channel: channel.channel,
      referenceBudget: channel.investment,
      newBudget: channel.investment,
      variation: 0,
      roi: channel.roi,
      expectedContribution: channel.investment * channel.roi,
      color: channel.color
    }));
    setSimulationData(initData);
    setIsStarted(false);
    setIsValidated(false);

    // Clear saved simulation state
    localStorage.removeItem('simulationState');
    localStorage.removeItem('simulationStarted');
    localStorage.removeItem('simulationValidated');
  };
  
  // Calculate totals
  const totalReferenceBudget = simulationData.reduce((sum, item) => sum + item.referenceBudget, 0);
  const totalNewBudget = simulationData.reduce((sum, item) => sum + item.newBudget, 0);
  const totalReferenceContribution = simulationData.reduce((sum, item) => sum + item.referenceBudget * item.roi, 0);
  const totalNewContribution = simulationData.reduce((sum, item) => sum + item.expectedContribution, 0);
  const totalVariation = ((totalNewBudget - totalReferenceBudget) / totalReferenceBudget) * 100;

  if (!isStarted) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-slate-800">Budget Simulation</h1>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-3">Start Simulation</h2>
            <p className="text-slate-700 mb-4">
              This simulation tool helps you plan your budget allocation for the next period based on historical performance.
            </p>
            <div className="space-y-2 text-sm text-slate-600 mb-6">
              <p>• <strong>Reference Year:</strong> {latestYear}</p>
              <p>• Input new budget allocations for each marketing channel</p>
              <p>• Expected contributions are calculated using ROI from {latestYear}</p>
              <p>• Compare the simulation results with the reference year's performance</p>
            </div>
            <button
              onClick={handleStartSimulation}
              className="btn btn-primary"
            >
              Start Simulation
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isValidated) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-slate-800">Budget Simulation</h1>
          <button
            onClick={() => { setIsStarted(false); handleReset(); }}
            className="btn btn-secondary"
          >
            Reset
            </button>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium mb-4">Input New Budgets (Reference Year: {latestYear})</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b">
                  <th className="p-3 text-left text-sm font-semibold text-slate-700">Channel</th>
                  <th className="p-3 text-right text-sm font-semibold text-slate-700">Reference Budget</th>
                  <th className="p-3 text-right text-sm font-semibold text-slate-700">New Budget</th>
                  <th className="p-3 text-right text-sm font-semibold text-slate-700">Variation</th>
                  <th className="p-3 text-right text-sm font-semibold text-slate-700">Expected ROI</th>
                  <th className="p-3 text-right text-sm font-semibold text-slate-700">Expected Contribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {simulationData.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="p-3">
                      <ChannelColorBadge channel={item.channel} />
                    </td>
                    <td className="p-3 text-right text-sm">{(item.referenceBudget / 1000000).toFixed(1)}M</td>
                    <td className="p-3">
                      <input
                        type="text"
                        value={item.newBudget === item.referenceBudget ? (item.referenceBudget / 1000000).toFixed(1) : (item.newBudget / 1000000).toFixed(1)}
                        onChange={(e) => {
                          handleBudgetChange(item.channel, e.target.value);
                        }}
                        placeholder="Amount in M"
                        className="w-full px-2 py-1 border rounded text-right placeholder:text-xs placeholder:text-slate-400"
                      />
                    </td>
                    <td className={`p-3 text-right text-sm font-medium ${item.variation > 0 ? 'text-green-600' : item.variation < 0 ? 'text-red-600' : 'text-slate-600'
                      }`}>
                      {item.variation > 0 ? '+' : ''}{item.variation.toFixed(1)}%
                    </td>
                    <td className="p-3 text-right text-sm text-slate-600">
                      {item.roi.toFixed(1)}x
                    </td>
                    <td className="p-3 text-right text-sm font-medium text-slate-700">
                      {(item.expectedContribution / 1000000).toFixed(1)}M
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                <tr className="font-semibold">
                  <td className="p-3">Total</td>
                  <td className="p-3 text-right">{(totalReferenceBudget / 1000000).toFixed(1)}M</td>
                  <td className="p-3 text-right">{(totalNewBudget / 1000000).toFixed(1)}M</td>
                  <td className={`p-3 text-right ${totalVariation > 0 ? 'text-green-600' : totalVariation < 0 ? 'text-red-600' : 'text-slate-600'
                    }`}>
                    {totalVariation > 0 ? '+' : ''}{totalVariation.toFixed(1)}%
                  </td>
                  <td className="p-3 text-right">
                    {(totalNewContribution / totalNewBudget).toFixed(1)}x
                  </td>
                  <td className="p-3 text-right">{(totalNewContribution / 1000000).toFixed(1)}M</td>
                </tr>
              </tfoot>
            </table>
            </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleValidate}
              className="btn btn-primary flex items-center gap-2"
            >
              <CheckCircle size={18} />
              Validate Simulation
            </button>
            </div>
        </div>
      </div>
    );
  }

  // Show results after validation
  const comparisonData = simulationData.map(item => ({
    name: item.channel,
    referenceBudget: item.referenceBudget,
    newBudget: item.newBudget,
    referenceContribution: item.referenceBudget * item.roi,
    newContribution: item.expectedContribution,
    color: item.color
  }));

  const contributionData = simulationData.map(item => ({
    name: item.channel,
    reference: item.referenceBudget * item.roi,
    new: item.expectedContribution,
    color: item.color
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-slate-800">Simulation Results</h1>
        <button
          onClick={() => { handleReset(); setIsValidated(false); }}
          className="btn btn-secondary"
        >
          New Simulation
        </button>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="card">
          <h3 className="text-sm font-medium text-slate-500 mb-2">New Budget</h3>
          <p className="text-2xl font-bold text-slate-800">{(totalNewBudget / 1000000).toFixed(1)}M</p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-slate-500 mb-2">Total Budget Variation</h3>
          <p className={`text-2xl font-bold ${totalVariation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totalVariation >= 0 ? '+' : ''}{totalVariation.toFixed(1)}%
          </p>
          <p className="text-xs text-slate-500 mt-1">vs {latestYear}</p>
          </div>
        <div className="card">
          <h3 className="text-sm font-medium text-slate-500 mb-2">Expected Contribution</h3>
          <p className="text-2xl font-bold text-slate-800">{(totalNewContribution / 1000000).toFixed(1)}M</p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-slate-500 mb-2">Contribution Variation</h3>
          <p className={`text-2xl font-bold ${((totalNewContribution - totalReferenceContribution) / totalReferenceContribution * 100) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {((totalNewContribution - totalReferenceContribution) / totalReferenceContribution * 100) >= 0 ? '+' : ''}{((totalNewContribution - totalReferenceContribution) / totalReferenceContribution * 100).toFixed(1)}%
          </p>
          <p className="text-xs text-slate-500 mt-1">vs {latestYear}</p>
          </div>
        <div className="card">
          <h3 className="text-sm font-medium text-slate-500 mb-2">Average ROI</h3>
          <p className="text-2xl font-bold text-slate-800">
            {(totalNewContribution / totalNewBudget).toFixed(1)}x
          </p>
        </div>
      </div>

      {/* Total Comparison Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h3 className="text-lg font-medium mb-4">Total Budget Comparison: {latestYear} vs Simulation</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                {
                  name: 'Total Budget',
                  referenceBudget: simulationData.reduce((sum, item) => sum + item.referenceBudget, 0),
                  newBudget: simulationData.reduce((sum, item) => sum + item.newBudget, 0)
                }
              ]} margin={{ bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => formatNumberAxis(value)} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '4px' }}>
                          <p style={{ color: '#64748b', marginBottom: '5px' }}>Total Budget</p>
                          {payload.map((entry, index) => (
                            <p key={index} style={{ color: entry.color, margin: '2px 0' }}>
                              {entry.dataKey === 'referenceBudget' ? `${latestYear}` : 'Simulation'}: {formatNumberDetailed(entry.value as number)}
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar dataKey="referenceBudget" name={`${latestYear}`} fill="#94a3b8" />
                <Bar dataKey="newBudget" name="Simulation" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium mb-4">Total Contribution Comparison: {latestYear} vs Simulation</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                {
                  name: 'Total Contribution',
                  reference: simulationData.reduce((sum, item) => sum + (item.referenceBudget * item.roi), 0),
                  new: simulationData.reduce((sum, item) => sum + item.expectedContribution, 0)
                }
              ]} margin={{ bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => formatNumberAxis(value)} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '4px' }}>
                          <p style={{ color: '#64748b', marginBottom: '5px' }}>Total Contribution</p>
                          {payload.map((entry, index) => (
                            <p key={index} style={{ color: entry.color, margin: '2px 0' }}>
                              {entry.dataKey === 'reference' ? `${latestYear}` : 'Simulation'}: {formatNumberDetailed(entry.value as number)}
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar dataKey="reference" name={`${latestYear} Contribution`} fill="#94a3b8" />
                <Bar dataKey="new" name="Simulation" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Channel Comparison Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-medium mb-4">Budget Comparison: {latestYear} vs Simulation</h3>
          <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ bottom: Math.max(80, comparisonData.length * 5) }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={Math.max(80, comparisonData.length * 8)}
                  tick={{ fontSize: 11 }}
                  interval={0}
                />
                <YAxis tickFormatter={(value) => formatNumberAxis(value)} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '4px' }}>
                          <p style={{ color: '#64748b', marginBottom: '5px' }}>{payload[0].payload.name}</p>
                          {payload.map((entry, index) => (
                            <p key={index} style={{ color: entry.color, margin: '2px 0' }}>
                              {entry.dataKey === 'referenceBudget' ? `${latestYear}` : 'Simulation'}: {formatNumberDetailed(entry.value as number)}
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                  <Legend />
                <Bar dataKey="referenceBudget" name={`${latestYear}`} fill="#94a3b8" />
                <Bar dataKey="newBudget" name="Simulation">
                  {comparisonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
                </BarChart>
              </ResponsiveContainer>
          </div>
            </div>

        <div className="card">
          <h3 className="text-lg font-medium mb-4">Contribution Comparison: {latestYear} vs Simulation</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={contributionData} margin={{ bottom: Math.max(80, contributionData.length * 5) }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={Math.max(80, contributionData.length * 8)}
                  tick={{ fontSize: 11 }}
                  interval={0}
                />
                <YAxis tickFormatter={(value) => formatNumberAxis(value)} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '4px' }}>
                          <p style={{ color: '#64748b', marginBottom: '5px' }}>{payload[0].payload.name}</p>
                          {payload.map((entry, index) => (
                            <p key={index} style={{ color: entry.color, margin: '2px 0' }}>
                              {entry.dataKey === 'reference' ? `${latestYear}` : 'Simulation'}: {formatNumberDetailed(entry.value as number)}
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar dataKey="reference" name={`${latestYear} Contribution`} fill="#94a3b8" />
                <Bar dataKey="new" name="Simulated Contribution">
                  {contributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Results Table */}
      <div className="card">
        <h3 className="text-lg font-medium mb-4">Detailed Results</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th className="p-3 text-left text-sm font-semibold text-slate-700">Channel</th>
                <th className="p-3 text-right text-sm font-semibold text-slate-700">Budget Change</th>
                <th className="p-3 text-right text-sm font-semibold text-slate-700">Contribution Change</th>
                <th className="p-3 text-right text-sm font-semibold text-slate-700">ROI (x)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {simulationData.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50">
                  <td className="p-3">
                    <ChannelColorBadge channel={item.channel} />
                  </td>
                  <td className={`p-3 text-right text-sm font-medium ${item.variation > 0 ? 'text-green-600' : item.variation < 0 ? 'text-red-600' : 'text-slate-600'
                    }`}>
                    {((item.newBudget - item.referenceBudget) / 1000000).toFixed(1)}M ({item.variation >= 0 ? '+' : ''}{item.variation.toFixed(1)}%)
                  </td>
                  <td className={`p-3 text-right text-sm font-medium ${(item.expectedContribution - item.referenceBudget * item.roi) > 0 ? 'text-green-600' : (item.expectedContribution - item.referenceBudget * item.roi) < 0 ? 'text-red-600' : 'text-slate-600'
                    }`}>
                    {(() => {
                      const oldContribution = item.referenceBudget * item.roi;
                      const newContribution = item.expectedContribution;
                      const contributionChange = newContribution - oldContribution;
                      const contributionPercentage = oldContribution > 0
                        ? ((contributionChange / oldContribution) * 100).toFixed(1)
                        : '0.0';
                      return `${(contributionChange / 1000000).toFixed(1)}M (${contributionChange >= 0 ? '+' : ''}${contributionPercentage}%)`;
                    })()}
                  </td>
                  <td className="p-3 text-right text-sm text-slate-600">
                    {item.roi.toFixed(1)}x
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
            </div>
    </div>
  );
};

export default SimulationsTab;
