import React from 'react';
import { getVariableColor } from '../../utils/colorGenerator';

interface ChannelColorBadgeProps {
  channel: string;
  className?: string;
}

const ChannelColorBadge: React.FC<ChannelColorBadgeProps> = ({ channel, className = '' }) => {
  const color = getVariableColor(channel);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-sm font-medium">{channel}</span>
    </div>
  );
};

export default ChannelColorBadge;