'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hover = true }) => {
  return (
    <div
      className={`
        bg-white rounded-2xl shadow-xl overflow-hidden
        ${hover ? 'transition-all duration-300 hover:shadow-2xl hover:-translate-y-1' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};