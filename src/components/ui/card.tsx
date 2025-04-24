import React from 'react';

interface CardProps {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

const Card = ({ className = '', children, onClick }: CardProps) => {
  return (
    <div 
      className={`rounded-lg border bg-white shadow-sm ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ className = '', children }: CardProps) => {
  return (
    <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>
      {children}
    </div>
  );
};

const CardTitle = ({ className = '', children }: CardProps) => {
  return (
    <h3 className={`text-lg font-semibold ${className}`}>
      {children}
    </h3>
  );
};

const CardDescription = ({ className = '', children }: CardProps) => {
  return (
    <p className={`text-sm text-muted-foreground text-slate-500 ${className}`}>
      {children}
    </p>
  );
};

const CardContent = ({ className = '', children }: CardProps) => {
  return (
    <div className={`p-6 pt-0 ${className}`}>
      {children}
    </div>
  );
};

const CardFooter = ({ className = '', children }: CardProps) => {
  return (
    <div className={`flex items-center p-6 pt-0 ${className}`}>
      {children}
    </div>
  );
};

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }; 