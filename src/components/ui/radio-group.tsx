import React from 'react';

interface RadioGroupProps {
  className?: string;
  children: React.ReactNode;
  value?: string;
  onChange?: (value: string) => void;
  onValueChange?: (value: string) => void;
}

const RadioGroup = ({ className = '', children, value, onChange, onValueChange }: RadioGroupProps) => {
  const handleChange = (value: string) => {
    onChange?.(value);
    onValueChange?.(value);
  };

  return (
    <div className={`flex gap-4 ${className}`} role="radiogroup">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as any, {
            checked: child.props.value === value,
            onChange: () => handleChange(child.props.value),
          });
        }
        return child;
      })}
    </div>
  );
};

interface RadioGroupItemProps {
  className?: string;
  value: string;
  id?: string;
  checked?: boolean;
  onChange?: () => void;
  children?: React.ReactNode;
}

const RadioGroupItem = ({ className = '', value, id, checked, onChange, children }: RadioGroupItemProps) => {
  return (
    <label className={`flex items-center gap-2 cursor-pointer ${className}`} htmlFor={id || value}>
      <input
        type="radio"
        className="sr-only"
        id={id || value}
        value={value}
        checked={checked}
        onChange={onChange}
      />
      <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${checked ? 'border-primary-500 border-2' : 'border-slate-300'}`}>
        {checked && <div className="h-2 w-2 rounded-full bg-primary-500" />}
      </div>
      {children}
    </label>
  );
};

export { RadioGroup, RadioGroupItem }; 