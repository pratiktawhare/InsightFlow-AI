import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverable = false,
}) => {
  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 shadow-sm ${
        hoverable ? 'hover:shadow-md transition-shadow cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
