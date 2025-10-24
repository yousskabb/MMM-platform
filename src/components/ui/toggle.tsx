import React from 'react';

interface ToggleProps {
  className?: string;
  children?: React.ReactNode;
  pressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  disabled?: boolean;
}

const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  ({ className = '', children, pressed = false, onPressedChange, disabled = false }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        aria-pressed={pressed}
        data-state={pressed ? 'on' : 'off'}
        className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-slate-200 ${className}`}
        onClick={() => onPressedChange?.(!pressed)}
        disabled={disabled}
      >
        {children}
      </button>
    );
  }
);

Toggle.displayName = "Toggle";

export { Toggle }; 