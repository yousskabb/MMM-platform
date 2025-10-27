import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatNumber } from '../../utils/numberFormatter';

interface KPICardProps {
  title: string;
  value: string | number;
  indicator?: number;
  previousYear?: number;
  icon?: React.ReactNode;
  color?: string;
  className?: string;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  indicator,
  previousYear,
  icon,
  color = 'primary-600',
  className = ''
}) => {
  const formattedValue = typeof value === 'number'
    ? formatNumber(value)
    : value;

  const isPositive = indicator !== undefined ? indicator > 0 : undefined;

  return (
    <div className={`card animate-scale-up h-full ${className}`}>
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
        {icon && <span className={`text-${color}`}>{icon}</span>}
      </div>

      <div className="flex flex-col">
        <span className="text-2xl font-semibold">{formattedValue}</span>

        {indicator !== undefined && (
          <div className="flex items-center mt-2">
            <span className={`text-xs font-medium flex items-center gap-1 ${isPositive ? 'text-success-600' : 'text-error-600'
              }`}>
              {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {isPositive ? '+' : ''}{indicator.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-500 ml-1">vs prev. period{previousYear ? ` (${previousYear})` : ''}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default KPICard;