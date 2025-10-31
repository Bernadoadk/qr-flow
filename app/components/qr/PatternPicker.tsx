import React, { useState } from 'react';

interface PatternPickerProps {
  onSelect: (pattern: string) => void;
  selectedPattern?: string;
  className?: string;
}

// Patterns disponibles dans qr-code-styling
const PATTERNS = [
  { id: 'rounded', name: 'Rounded', description: 'Points arrondis' },
  { id: 'square', name: 'Square', description: 'Points carrés' },
  { id: 'dots', name: 'Dots', description: 'Points simples' },
  { id: 'classy', name: 'Classy', description: 'Style classique' },
  { id: 'classy-rounded', name: 'Classy Rounded', description: 'Classique arrondi' },
  { id: 'extra-rounded', name: 'Extra Rounded', description: 'Très arrondi' }
];

const PatternPicker: React.FC<PatternPickerProps> = ({
  onSelect,
  selectedPattern,
  className = ''
}) => {
  const [hoveredPattern, setHoveredPattern] = useState<string | null>(null);

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800">Pattern des points</h3>
      <div className="grid grid-cols-2 gap-3">
        {PATTERNS.map((pattern) => (
          <button
            key={pattern.id}
            onClick={() => onSelect(pattern.id)}
            onMouseEnter={() => setHoveredPattern(pattern.id)}
            onMouseLeave={() => setHoveredPattern(null)}
            className={`
              relative p-3 rounded-lg border-2 transition-all duration-200
              ${selectedPattern === pattern.id
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }
              ${hoveredPattern === pattern.id ? 'scale-105' : 'scale-100'}
            `}
          >
            {/* Visualisation du pattern */}
            <div className="flex justify-center mb-2">
              <div className="w-8 h-8 grid grid-cols-3 gap-0.5">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={i}
                    className={`
                      bg-gray-600 transition-all duration-200
                      ${pattern.id === 'rounded' ? 'rounded-full' : ''}
                      ${pattern.id === 'square' ? 'rounded-none' : ''}
                      ${pattern.id === 'dots' ? 'rounded-sm' : ''}
                      ${pattern.id === 'classy' ? 'rounded-sm' : ''}
                      ${pattern.id === 'classy-rounded' ? 'rounded-md' : ''}
                      ${pattern.id === 'extra-rounded' ? 'rounded-full' : ''}
                    `}
                    style={{
                      width: pattern.id === 'dots' ? '2px' : '4px',
                      height: pattern.id === 'dots' ? '2px' : '4px'
                    }}
                  />
                ))}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-sm font-medium text-gray-700">
                {pattern.name}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {pattern.description}
              </div>
            </div>

            {/* Indicateur de sélection */}
            {selectedPattern === pattern.id && (
              <div className="absolute top-2 right-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PatternPicker;
