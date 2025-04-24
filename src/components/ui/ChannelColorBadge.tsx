import React from 'react';
import { Channel } from '../../types';
import { channelDefinitions } from '../../data/mockData';

interface ChannelColorBadgeProps {
  channel: Channel;
  className?: string;
}

const ChannelColorBadge: React.FC<ChannelColorBadgeProps> = ({ channel, className = '' }) => {
  const { color } = channelDefinitions[channel];
  
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