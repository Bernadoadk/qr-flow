import React, { memo } from 'react';
import { Tooltip } from '../ui/Tooltip';

interface DesignOptionProps {
  label: string;
  value: string;
  options: Array<{
    value: string;
    label: string;
    icon: React.ReactNode;
    description: string;
  }>;
  onChange: (value: string) => void;
  isDarkMode: boolean;
}

export const DesignOption = memo(function DesignOption({ label, value, options, onChange, isDarkMode }: DesignOptionProps) {
  return (
    <div>
      <label className={`block text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        {label}
      </label>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <Tooltip key={option.value} content={option.description}>
            <button
              onClick={() => onChange(option.value)}
              className={`flex items-center space-x-2 p-3 rounded-lg border-2 transition-all ${
                value === option.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500'
              }`}
            >
              <div className={`p-2 rounded-lg ${
                value === option.value 
                  ? 'bg-blue-100 dark:bg-blue-800' 
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                {option.icon}
              </div>
              <span className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {option.label}
              </span>
            </button>
          </Tooltip>
        ))}
      </div>
    </div>
  );
});
