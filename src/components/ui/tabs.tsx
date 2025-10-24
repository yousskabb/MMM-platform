import React, { useState } from 'react';

interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}

const Tabs = ({ defaultValue, value, onValueChange, className = '', children }: TabsProps) => {
  const [selectedTab, setSelectedTab] = useState(value || defaultValue || '');
  
  const handleTabChange = (newValue: string) => {
    if (!value) {
      setSelectedTab(newValue);
    }
    onValueChange?.(newValue);
  };
  
  const currentValue = value || selectedTab;
  
  return (
    <div className={className}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          if (child.type === TabsList) {
            return React.cloneElement(child, {
              selectedValue: currentValue,
              onSelect: handleTabChange,
            });
          }
          
          if (child.type === TabsContent) {
            return React.cloneElement(child, {
              value: child.props.value,
              selected: child.props.value === currentValue,
            });
          }
        }
        return child;
      })}
    </div>
  );
};

interface TabsListProps {
  className?: string;
  children: React.ReactNode;
  selectedValue?: string;
  onSelect?: (value: string) => void;
}

const TabsList = ({ className = '', children, selectedValue, onSelect }: TabsListProps) => {
  return (
    <div className={`inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 ${className}`}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child) && child.type === TabsTrigger) {
          return React.cloneElement(child as React.ReactElement<any>, {
            selected: child.props.value === selectedValue,
            onSelect: () => onSelect?.(child.props.value),
          });
        }
        return child;
      })}
    </div>
  );
};

interface TabsTriggerProps {
  className?: string;
  value: string;
  children: React.ReactNode;
  selected?: boolean;
  onSelect?: () => void;
}

const TabsTrigger = ({ className = '', value, children, selected, onSelect }: TabsTriggerProps) => {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      data-state={selected ? 'active' : 'inactive'}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm ${className}`}
      onClick={onSelect}
    >
      {children}
    </button>
  );
};

interface TabsContentProps {
  className?: string;
  value: string;
  children: React.ReactNode;
  selected?: boolean;
}

const TabsContent = ({ className = '', value, children, selected }: TabsContentProps) => {
  if (!selected) {
    return null;
  }
  
  return (
    <div
      role="tabpanel"
      data-state={selected ? 'active' : 'inactive'}
      className={`mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 ${className}`}
    >
      {children}
    </div>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent }; 