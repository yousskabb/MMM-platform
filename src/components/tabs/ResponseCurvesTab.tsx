import React, { useState, useEffect } from 'react';
import { FilterState } from '../../types';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { getCachedData } from '../../data/dataService';
import { getVariableColor } from '../../utils/colorGenerator';

interface ResponseCurvesTabProps {
  filters: FilterState;
}

// Helper function to generate scatter plot data from actual Excel data
const generateScatterData = (selectedVariable: string) => {
  const cachedData = getCachedData();
  if (!cachedData || !cachedData.investments || !cachedData.contributions) return [];

  const scatterData: Array<{
    x: number;
    y: number;
    date: string;
    year: number;
    month: string;
  }> = [];

  // Create a map of contributions by date for quick lookup
  const contributionsByDate = new Map<string, number>();
  cachedData.contributions.forEach(week => {
    const dateKey = week.date.toISOString().split('T')[0];
    const contribution = week[selectedVariable] as number || 0;
    contributionsByDate.set(dateKey, contribution);
  });

  // Match investments with contributions by date
  cachedData.investments.forEach(week => {
    const investment = week[selectedVariable] as number || 0;
    const dateKey = week.date.toISOString().split('T')[0];
    const contribution = contributionsByDate.get(dateKey) || 0;

    if (investment > 0 || contribution > 0) {
      const date = new Date(week.date);
      scatterData.push({
        x: investment,
        y: contribution,
        date: week.date.toISOString(),
        year: date.getFullYear(),
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      });
    }
  });

  return scatterData;
};

// Get available variables from the data
const getAvailableVariables = () => {
  const cachedData = getCachedData();
  if (!cachedData || !cachedData.variables || cachedData.variables.length === 0) return [];

  return cachedData.variables.sort();
};

// Generate ROI = 1 reference line data
const generateROILineData = (scatterData: Array<{ x: number; y: number }>) => {
  if (scatterData.length === 0) return [];

  const minX = Math.min(...scatterData.map(d => d.x));
  const maxX = Math.max(...scatterData.map(d => d.x));
  const minY = Math.min(...scatterData.map(d => d.y));
  const maxY = Math.max(...scatterData.map(d => d.y));

  const min = Math.min(minX, minY);
  const max = Math.max(maxX, maxY);

  return [
    { x: min, y: min },
    { x: max, y: max }
  ];
};

// Round to next thousand for axis limits
const roundToNextThousand = (value: number): number => {
  return Math.ceil(value / 1000) * 1000;
};

const ResponseCurvesTab: React.FC<ResponseCurvesTabProps> = () => {
  const [availableVariables, setAvailableVariables] = useState<string[]>([]);
  const [selectedVariable, setSelectedVariable] = useState<string>('');

  useEffect(() => {
    const variables = getAvailableVariables();
    if (variables.length > 0) {
      setAvailableVariables(variables);
      if (!selectedVariable) {
        setSelectedVariable(variables[0]);
      }
    }
  });

  const scatterData = generateScatterData(selectedVariable);
  const roiLineData = generateROILineData(scatterData);

  // Calculate rounded axis limits based on investment data (x values)
  const maxInvestment = scatterData.length > 0 ? Math.max(...scatterData.map(d => d.x)) : 0;
  const maxContribution = scatterData.length > 0 ? Math.max(...scatterData.map(d => d.y)) : 0;

  const maxX = roundToNextThousand(maxInvestment);
  const maxY = roundToNextThousand(maxContribution);

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

  if (availableVariables.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-slate-800">Response Curves Analysis</h1>
        <div className="card">
          <p className="text-slate-600">No data available for analysis.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-slate-800">Response Curves Analysis</h1>
        <div className="flex items-center gap-4">
          <select
            className="select min-w-40"
            value={selectedVariable}
            onChange={(e) => setSelectedVariable(e.target.value)}
          >
            {availableVariables.map(variable => (
              <option key={variable} value={variable}>{variable}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-primary-600" />
          Investment vs. Contribution - {selectedVariable}
        </h3>

        <div className="h-[800px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 20, right: 30, bottom: 60, left: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

              <XAxis
                type="number"
                dataKey="x"
                name="Investment"
                unit=""
                tickFormatter={formatCompactCurrency}
                label={{ value: 'Investment', position: 'insideBottom', offset: -10, style: { fontSize: '14px', fontWeight: 'bold' } }}
                domain={[0, maxX]}
                allowDataOverflow={true}
                allowDecimals={false}
              />
              
              <YAxis
                type="number"
                dataKey="y"
                name="Contribution"
                unit=""
                tickFormatter={formatCompactCurrency}
                label={{ value: 'Contribution', angle: -90, position: 'insideLeft', offset: -10, style: { fontSize: '14px', fontWeight: 'bold' } }}
                domain={[0, maxY]}
                allowDataOverflow={true}
                allowDecimals={false}
              />

              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length > 0) {
                    const data = payload[0].payload;
                    if (data.month) {
                      return (
                        <div className="bg-white p-6 border-2 border-gray-300 rounded-xl shadow-xl min-w-[300px]">
                          <p className="font-bold text-lg text-gray-800 mb-3">{selectedVariable}</p>
                          <div className="space-y-2">
                            <p className="text-base text-gray-700">
                              <span className="font-semibold">Investment:</span> {formatCurrency(data.x)}
                            </p>
                            <p className="text-base text-gray-700">
                              <span className="font-semibold">Contribution:</span> {formatCurrency(data.y)}
                            </p>
                            <p className="text-base text-gray-700">
                              <span className="font-semibold">Date:</span> {data.month}
                            </p>
                            <p className="text-base text-gray-700">
                              <span className="font-semibold">ROI:</span> {(data.y / data.x).toFixed(2)}x
                            </p>
                          </div>
                        </div>
                      );
                    }
                  }
                  return null;
                }}
              />

              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />

              {/* ROI = 1 reference line */}
              <Scatter
                name="ROI = 1"
                data={roiLineData}
                line={{ stroke: '#9ca3af', strokeWidth: 2, strokeDasharray: '5 5' }}
                legendType="line"
              />

              {/* Main scatter plot */}
              <Scatter
                name={selectedVariable}
                data={scatterData}
                fill={getVariableColor(selectedVariable)}
              >
                {scatterData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={getVariableColor(selectedVariable)} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          {scatterData.length > 0 ? (
            <>
              <p>
                <span className="font-medium">Data points:</span> {scatterData.length} weeks across all years
              </p>
              <p>
                <span className="font-medium">Investment range:</span> {formatCurrency(Math.min(...scatterData.map(d => d.x)))} - {formatCurrency(Math.max(...scatterData.map(d => d.x)))}
              </p>
              <p>
                <span className="font-medium">Contribution range:</span> {formatCurrency(Math.min(...scatterData.map(d => d.y)))} - {formatCurrency(Math.max(...scatterData.map(d => d.y)))}
              </p>
            </>
          ) : (
            <p className="text-gray-500">No data points available for the selected variable.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResponseCurvesTab;