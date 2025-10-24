import React from 'react';

interface SeparatorProps {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

const Separator = ({ className = '', orientation = 'horizontal' }: SeparatorProps) => {
  return (
    <div
      className={`${
        orientation === 'horizontal' 
          ? 'h-[1px] w-full' 
          : 'h-full w-[1px]'
      } bg-slate-200 ${className}`}
      role="separator"
    />
  );
};

export { Separator }; 