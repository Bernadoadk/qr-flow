import React, { useState, useEffect } from 'react';

interface FramePickerProps {
  onSelect: (frame: string) => void;
  selectedFrame?: string;
  className?: string;
}

// Frames disponibles
const FRAMES = [
  { 
    id: 'none', 
    name: 'Aucun', 
    description: 'Pas de frame',
    preview: null
  },
  { 
    id: 'border-simple', 
    name: 'Bordure simple', 
    description: 'Bordure fine',
    preview: '/qr-styles/frames/border-simple.svg'
  },
  { 
    id: 'border-thick', 
    name: 'Bordure épaisse', 
    description: 'Bordure large',
    preview: '/qr-styles/frames/border-thick.svg'
  },
  { 
    id: 'gradient-border', 
    name: 'Bordure dégradé', 
    description: 'Bordure avec dégradé',
    preview: '/qr-styles/frames/gradient-border.svg'
  }
];

const FramePicker: React.FC<FramePickerProps> = ({
  onSelect,
  selectedFrame,
  className = ''
}) => {
  const [hoveredFrame, setHoveredFrame] = useState<string | null>(null);

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800">Frame</h3>
      <div className="grid grid-cols-2 gap-3">
        {FRAMES.map((frame) => (
          <button
            key={frame.id}
            onClick={() => onSelect(frame.id === 'none' ? '' : frame.id)}
            onMouseEnter={() => setHoveredFrame(frame.id)}
            onMouseLeave={() => setHoveredFrame(null)}
            className={`
              relative p-4 rounded-lg border-2 transition-all duration-200
              ${selectedFrame === frame.id || (frame.id === 'none' && !selectedFrame)
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }
              ${hoveredFrame === frame.id ? 'scale-105' : 'scale-100'}
            `}
          >
            {/* Visualisation du frame */}
            <div className="flex justify-center mb-3">
              <div className="w-16 h-16 border-2 border-gray-300 rounded-lg flex items-center justify-center bg-white">
                {frame.preview ? (
                  <img 
                    src={frame.preview} 
                    alt={frame.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-gray-400 text-xs text-center">
                    <div className="w-8 h-8 border border-gray-300 rounded"></div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-sm font-medium text-gray-700">
                {frame.name}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {frame.description}
              </div>
            </div>

            {/* Indicateur de sélection */}
            {(selectedFrame === frame.id || (frame.id === 'none' && !selectedFrame)) && (
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

export default FramePicker;
