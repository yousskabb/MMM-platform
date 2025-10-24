import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'outline' | 'ghost' | 'link' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    variant = 'default', 
    size = 'md', 
    className = '', 
    children, 
    ...props 
  }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
    
    const variantStyles = {
      default: "bg-slate-900 text-white hover:bg-slate-800",
      primary: "bg-primary-600 text-white hover:bg-primary-700",
      outline: "border border-slate-200 bg-transparent hover:bg-slate-100",
      ghost: "bg-transparent hover:bg-slate-100",
      link: "bg-transparent underline-offset-4 hover:underline text-slate-900",
      destructive: "bg-red-500 text-white hover:bg-red-600"
    };

    const sizeStyles = {
      sm: "h-8 px-3 py-1 text-xs",
      md: "h-10 px-4 py-2",
      lg: "h-12 px-6 text-lg"
    };

    const classes = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

    return (
      <button
        className={classes}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button }; 