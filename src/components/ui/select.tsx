import React, { ReactNode, useState } from "react";

export interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  defaultValue?: string;
  placeholder?: string;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

export interface SelectTriggerProps {
  children: ReactNode;
  onClick: () => void;
  open: boolean;
  className?: string;
}

export interface SelectContentProps {
  children: ReactNode;
  onClose: () => void;
  onChange: (value: string) => void;
  className?: string;
}

export interface SelectItemProps {
  value: string;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

export interface SelectValueProps {
  placeholder?: string;
  children?: ReactNode;
  className?: string;
}

export const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({ value, onValueChange, onChange, defaultValue, placeholder, children, disabled, className = "" }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedValue, setSelectedValue] = useState(value || defaultValue || "");

    const handleChange = (newValue: string) => {
      setSelectedValue(newValue);
      if (onChange) {
        const event = { target: { value: newValue } } as React.ChangeEvent<HTMLSelectElement>;
        onChange(event);
      }
      if (onValueChange) {
        onValueChange(newValue);
      }
      setIsOpen(false);
    };

    // Find SelectValue and SelectTrigger children
    let triggerChild: React.ReactElement | null = null;
    let contentChild: React.ReactElement | null = null;

    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child)) {
        if (child.type === SelectTrigger) {
          triggerChild = child;
        } else if (child.type === SelectContent) {
          contentChild = child;
        }
      }
    });

    return (
      <div ref={ref} className={`relative inline-block w-full ${className}`} role="combobox" aria-expanded={isOpen}>
        {triggerChild && React.cloneElement(triggerChild, {
          onClick: () => !disabled && setIsOpen(!isOpen),
          open: isOpen,
        })}
        {isOpen && contentChild && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg">
            {React.cloneElement(contentChild, {
              onClose: () => setIsOpen(false),
              onChange: handleChange,
            })}
          </div>
        )}
      </div>
    );
  }
);

export const SelectTrigger = React.forwardRef<HTMLDivElement, SelectTriggerProps>(
  ({ children, onClick, open, className = "" }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex items-center justify-between px-3 py-2 border rounded-md cursor-pointer ${
          open ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-300"
        } ${className}`}
        onClick={onClick}
      >
        {children}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-4 w-4 transition-transform ${open ? "transform rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
    );
  }
);

export const SelectValue = React.forwardRef<HTMLSpanElement, SelectValueProps>(
  ({ placeholder, children, className = "" }, ref) => {
    return (
      <span ref={ref} className={`block truncate ${!children ? "text-gray-500" : ""} ${className}`}>
        {children || placeholder}
      </span>
    );
  }
);

export const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ children, onClose, onChange, className = "" }, ref) => {
    return (
      <div
        ref={ref}
        className={`py-1 max-h-60 overflow-auto ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && child.type === SelectItem) {
            return React.cloneElement(child, {
              ...child.props,
              onClick: () => {
                if (child.props.value !== undefined) {
                  onChange?.(child.props.value);
                }
              }
            });
          }
          return child;
        })}
      </div>
    );
  }
);

export const SelectItem = React.forwardRef<
  HTMLDivElement,
  SelectItemProps & { onClick?: () => void }
>(({ value, children, disabled, onClick, className = "" }, ref) => {
  return (
    <div
      ref={ref}
      className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
      onClick={disabled ? undefined : onClick}
      role="option"
      aria-selected={false}
      data-value={value}
    >
      {children}
    </div>
  );
});

// Assign display names
Select.displayName = "Select";
SelectTrigger.displayName = "SelectTrigger";
SelectValue.displayName = "SelectValue";
SelectContent.displayName = "SelectContent";
SelectItem.displayName = "SelectItem";

export default Select; 