import React, { useState } from 'react';

interface MarkerPickerProps {
  onSelect: (marker: string) => void;
  selectedMarker?: string;
  className?: string;
}

// Markers disponibles dans qr-code-styling (cornersSquareOptions)
const MARKERS = [
  { id: 'square', name: 'Square', description: 'Carré simple' },
  { id: 'extra-rounded', name: 'Extra Rounded', description: 'Carré très arrondi' },
  { id: 'dot', name: 'Dot', description: 'Point simple' },
  { id: 'classy', name: 'Classy', description: 'Style classique' },
  { id: 'classy-rounded', name: 'Classy Rounded', description: 'Classique arrondi' }
];

const MarkerPicker: React.FC<MarkerPickerProps> = ({
  onSelect,
  selectedMarker,
  className = ''
}) => {
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);

  const renderMarkerPreview = (markerId: string) => {
    const size = 24;
    const strokeWidth = 2;
    
    switch (markerId) {
      case 'square':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" className="text-gray-600">
            <rect x="4" y="4" width="16" height="16" stroke="currentColor" strokeWidth={strokeWidth} fill="none" />
          </svg>
        );
      case 'extra-rounded':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" className="text-gray-600">
            <rect x="4" y="4" width="16" height="16" rx="6" ry="6" stroke="currentColor" strokeWidth={strokeWidth} fill="none" />
          </svg>
        );
      case 'dot':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" className="text-gray-600">
            <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth={strokeWidth} fill="none" />
          </svg>
        );
      case 'classy':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" className="text-gray-600">
            <rect x="4" y="4" width="16" height="16" rx="1" ry="1" stroke="currentColor" strokeWidth={strokeWidth} fill="none" />
          </svg>
        );
      case 'classy-rounded':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" className="text-gray-600">
            <rect x="4" y="4" width="16" height="16" rx="3" ry="3" stroke="currentColor" strokeWidth={strokeWidth} fill="none" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800">Forme des yeux</h3>
      <div className="grid grid-cols-2 gap-3">
        {MARKERS.map((marker) => (
          <button
            key={marker.id}
            onClick={() => onSelect(marker.id)}
            onMouseEnter={() => setHoveredMarker(marker.id)}
            onMouseLeave={() => setHoveredMarker(null)}
            className={`
              relative p-4 rounded-lg border-2 transition-all duration-200
              ${selectedMarker === marker.id
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }
              ${hoveredMarker === marker.id ? 'scale-105' : 'scale-100'}
            `}
          >
            {/* Visualisation du marker */}
            <div className="flex justify-center mb-3">
              {renderMarkerPreview(marker.id)}
            </div>
            
            <div className="text-center">
              <div className="text-sm font-medium text-gray-700">
                {marker.name}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {marker.description}
              </div>
            </div>

            {/* Indicateur de sélection */}
            {selectedMarker === marker.id && (
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

export default MarkerPicker;
