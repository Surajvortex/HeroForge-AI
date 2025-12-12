import React from 'react';

export const Spinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center space-y-4">
    <div className="relative w-16 h-16">
      <div className="absolute top-0 left-0 w-full h-full border-4 border-brand-800 rounded-full opacity-30"></div>
      <div className="absolute top-0 left-0 w-full h-full border-4 border-t-brand-400 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
    </div>
    <span className="text-brand-200 text-sm font-medium animate-pulse">Designing your vision...</span>
  </div>
);