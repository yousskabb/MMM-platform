import React from 'react';

interface SliderProps {
  value?: number[];
  onValueChange?: (value: number[]) => void;
  defaultValue?: number[];
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  disabled?: boolean;
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ value, onValueChange, defaultValue = [0], min = 0, max = 100, step = 1, className = '', disabled = false }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseFloat(e.target.value);
      onValueChange?.([newValue]);
    };

    const getValue = () => {
      if (value !== undefined) {
        return value[0];
      }
      return defaultValue[0];
    };

    return (
      <div ref={ref} className={`relative w-full ${className}`}>
        <input
          type="range"
          className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          min={min}
          max={max}
          step={step}
          value={getValue()}
          onChange={handleChange}
          disabled={disabled}
        />
      </div>
    );
  }
);

Slider.displayName = "Slider";

export { Slider }; 