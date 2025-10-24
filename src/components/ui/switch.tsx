import React from 'react';

interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked = false, onCheckedChange, disabled = false, className = '', id }, ref) => {
    return (
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        data-state={checked ? 'checked' : 'unchecked'}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50 ${
          checked ? 'bg-primary-600' : 'bg-slate-200'
        } ${className}`}
        onClick={() => onCheckedChange?.(!checked)}
        ref={ref}
      >
        <span
          data-state={checked ? 'checked' : 'unchecked'}
          className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    );
  }
);

Switch.displayName = "Switch";

export { Switch }; 