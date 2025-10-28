import React, { useState, useEffect } from 'react';
import { FilterState } from '../../types';
import { getLLMContext } from '../../data/dataService';
import { Eye, Copy, Check } from 'lucide-react';

interface LLMContextTabProps {
  filters: FilterState;
}

const LLMContextTab: React.FC<LLMContextTabProps> = ({ filters }) => {
  const [context, setContext] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const contextData = getLLMContext(filters);
    setContext(contextData);
  }, [filters]);

  const copyToClipboard = async () => {
    if (context) {
      await navigator.clipboard.writeText(JSON.stringify(context, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatValue = (value: any, depth = 0): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'number') {
      if (value > 1000000) return `€${(value / 1000000).toFixed(1)}M`;
      if (value > 1000) return `€${(value / 1000).toFixed(1)}K`;
      return value.toFixed(2);
    }
    if (typeof value === 'boolean') return value.toString();
    if (typeof value === 'string') return `"${value}"`;
    if (Array.isArray(value)) {
      if (depth > 2) return `[${value.length} items]`;
      return `[\n${value.map((item, i) => 
        `${'  '.repeat(depth + 1)}${i}: ${formatValue(item, depth + 1)}`
      ).join(',\n')}\n${'  '.repeat(depth)}]`;
    }
    if (typeof value === 'object') {
      if (depth > 2) return `{${Object.keys(value).length} properties}`;
      return `{\n${Object.entries(value).map(([key, val]) => 
        `${'  '.repeat(depth + 1)}"${key}": ${formatValue(val, depth + 1)}`
      ).join(',\n')}\n${'  '.repeat(depth)}}`;
    }
    return String(value);
  };

  if (!context) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="w-5 h-5 text-slate-600" />
          <h2 className="text-xl font-semibold text-slate-800">LLM Context Debug</h2>
        </div>
        <div className="text-slate-500">Loading context...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-slate-600" />
          <h2 className="text-xl font-semibold text-slate-800">LLM Context Debug</h2>
        </div>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-slate-600" />
              <span className="text-sm text-slate-600">Copy JSON</span>
            </>
          )}
        </button>
      </div>

      <div className="space-y-6">
        {/* Basic Context */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h3 className="text-lg font-medium text-slate-800 mb-3">Basic Context</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-slate-600">Selected Year:</span>
              <span className="ml-2 text-slate-800">{context.context?.selectedYear}</span>
            </div>
            <div>
              <span className="font-medium text-slate-600">Country:</span>
              <span className="ml-2 text-slate-800">{context.context?.country}</span>
            </div>
            <div>
              <span className="font-medium text-slate-600">Brand:</span>
              <span className="ml-2 text-slate-800">{context.context?.brand}</span>
            </div>
            <div>
              <span className="font-medium text-slate-600">Available Years:</span>
              <span className="ml-2 text-slate-800">{context.context?.availableYears?.join(', ')}</span>
            </div>
            <div>
              <span className="font-medium text-slate-600">Previous Year:</span>
              <span className="ml-2 text-slate-800">{context.context?.previousYear}</span>
            </div>
            <div>
              <span className="font-medium text-slate-600">Has Previous Year Data:</span>
              <span className="ml-2 text-slate-800">{context.context?.hasPreviousYearData ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>

        {/* Selected Year KPIs */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h3 className="text-lg font-medium text-slate-800 mb-3">Selected Year KPIs ({context.context?.selectedYear})</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-slate-600">Total Investment:</span>
              <span className="ml-2 text-slate-800">{formatValue(context.selectedYearKPIs?.totalInvestment)}</span>
            </div>
            <div>
              <span className="font-medium text-slate-600">Total Contribution:</span>
              <span className="ml-2 text-slate-800">{formatValue(context.selectedYearKPIs?.totalContribution)}</span>
            </div>
            <div>
              <span className="font-medium text-slate-600">Total ROI:</span>
              <span className="ml-2 text-slate-800">{formatValue(context.selectedYearKPIs?.totalROI)}x</span>
            </div>
            <div>
              <span className="font-medium text-slate-600">Total Sell Out:</span>
              <span className="ml-2 text-slate-800">{formatValue(context.selectedYearKPIs?.totalSellOut)}</span>
            </div>
          </div>
        </div>

        {/* All Years Data Summary */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h3 className="text-lg font-medium text-slate-800 mb-3">All Years Data Summary</h3>
          <div className="space-y-3">
            {context.allYearsData?.map((yearData: any, index: number) => (
              <div key={index} className="border-l-4 border-slate-200 pl-4">
                <div className="font-medium text-slate-700">{yearData.year}</div>
                <div className="grid grid-cols-4 gap-4 text-sm text-slate-600 mt-1">
                  <div>Investment: {formatValue(yearData.totalInvestment)}</div>
                  <div>Contribution: {formatValue(yearData.totalContribution)}</div>
                  <div>ROI: {formatValue(yearData.totalROI)}x</div>
                  <div>Sell Out: {formatValue(yearData.totalSellOut)}</div>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Channels: {yearData.channelPerformance?.length || 0} channels
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Year-over-Year Comparison */}
        {context.yearOverYear && (
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h3 className="text-lg font-medium text-slate-800 mb-3">Year-over-Year Comparison</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-slate-700 mb-2">Previous Year ({context.context?.previousYear})</h4>
                <div className="space-y-1 text-sm">
                  <div>Investment: {formatValue(context.yearOverYear.previousYear?.totalInvestment)}</div>
                  <div>Contribution: {formatValue(context.yearOverYear.previousYear?.totalContribution)}</div>
                  <div>ROI: {formatValue(context.yearOverYear.previousYear?.totalROI)}x</div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-slate-700 mb-2">Current Year ({context.context?.selectedYear})</h4>
                <div className="space-y-1 text-sm">
                  <div>Investment: {formatValue(context.yearOverYear.currentYear?.totalInvestment)}</div>
                  <div>Contribution: {formatValue(context.yearOverYear.currentYear?.totalContribution)}</div>
                  <div>ROI: {formatValue(context.yearOverYear.currentYear?.totalROI)}x</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Variables */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h3 className="text-lg font-medium text-slate-800 mb-3">Available Variables</h3>
          <div className="text-sm text-slate-600">
            {context.variables?.join(', ') || 'No variables available'}
          </div>
        </div>

        {/* Raw JSON Context */}
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
          <h3 className="text-lg font-medium text-slate-800 mb-3">Raw JSON Context</h3>
          <pre className="text-xs text-slate-600 overflow-auto max-h-96 bg-white p-3 rounded border">
            {JSON.stringify(context, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default LLMContextTab;
