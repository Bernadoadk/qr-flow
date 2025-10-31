import React, { useState } from 'react';
import QRPreview from './QRPreview';
import PatternPicker from './PatternPicker';
import MarkerPicker from './MarkerPicker';
import CenterPicker from './CenterPicker';
import FramePicker from './FramePicker';
import ImagePicker from './ImagePicker';

interface QRDesignerProps {
  initialData?: string;
  onConfigChange?: (config: QRConfig) => void;
  className?: string;
}

export interface QRConfig {
  data: string;
  pattern: string;
  marker: string;
  center: string;
  frame: string;
  foregroundColor: string;
  backgroundColor: string;
  image: string | null;
}

const QRDesigner: React.FC<QRDesignerProps> = ({
  initialData = 'https://example.com',
  onConfigChange,
  className = ''
}) => {
  const [data, setData] = useState(initialData);
  const [pattern, setPattern] = useState('rounded');
  const [marker, setMarker] = useState('extra-rounded');
  const [center, setCenter] = useState('dot');
  const [frame, setFrame] = useState('');
  const [foregroundColor, setForegroundColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [image, setImage] = useState<string | null>(null);

  // Notifier les changements de configuration
  React.useEffect(() => {
    const config: QRConfig = {
      data,
      pattern,
      marker,
      center,
      frame,
      foregroundColor,
      backgroundColor,
      image
    };
    onConfigChange?.(config);
  }, [data, pattern, marker, center, frame, foregroundColor, backgroundColor, image, onConfigChange]);

  return (
    <div className={`max-w-7xl mx-auto p-6 ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Panneau de configuration */}
        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Configurateur de QR Code
            </h2>
            
            {/* URL Input */}
            <div className="mb-6">
              <label htmlFor="qr-data" className="block text-sm font-medium text-gray-700 mb-2">
                URL ou texte à encoder
              </label>
              <input
                id="qr-data"
                type="text"
                value={data}
                onChange={(e) => setData(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Configuration des styles */}
            <div className="space-y-8">
              <PatternPicker
                onSelect={setPattern}
                selectedPattern={pattern}
              />
              
              <MarkerPicker
                onSelect={setMarker}
                selectedMarker={marker}
              />
              
              <CenterPicker
                onSelect={setCenter}
                selectedCenter={center}
              />
              
              <FramePicker
                onSelect={setFrame}
                selectedFrame={frame}
              />

              {/* Couleurs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Couleur du QR</label>
                  <input type="color" value={foregroundColor} onChange={(e) => setForegroundColor(e.target.value)} className="w-12 h-8 border border-gray-300 rounded cursor-pointer" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Couleur du fond</label>
                  <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="w-12 h-8 border border-gray-300 rounded cursor-pointer" />
                </div>
              </div>

              <ImagePicker onSelect={setImage} selectedImage={image ?? undefined} />
            </div>
          </div>
        </div>

        {/* Aperçu du QR Code */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Aperçu en temps réel
            </h3>
            
            <div className="flex justify-center">
              <QRPreview
                data={data}
                pattern={pattern}
                marker={marker}
                center={center}
                frame={frame}
                foregroundColor={foregroundColor}
                backgroundColor={backgroundColor}
                logo={image || undefined}
                size={300}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50"
              />
            </div>

            {/* Informations sur la configuration */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Configuration actuelle
              </h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div><span className="font-medium">Pattern:</span> {pattern}</div>
                <div><span className="font-medium">Marker:</span> {marker}</div>
                <div><span className="font-medium">Center:</span> {center}</div>
                <div><span className="font-medium">Frame:</span> {frame || 'Aucun'}</div>
                <div><span className="font-medium">QR:</span> {foregroundColor}</div>
                <div><span className="font-medium">Fond:</span> {backgroundColor}</div>
                <div><span className="font-medium">Image:</span> {image ? 'Oui' : 'Non'}</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Actions
            </h3>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  // Fonction pour télécharger le QR code
                  const canvas = document.querySelector('canvas');
                  if (canvas) {
                    const link = document.createElement('a');
                    link.download = 'qr-code.png';
                    link.href = canvas.toDataURL();
                    link.click();
                  }
                }}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Télécharger le QR Code
              </button>
              
              <button
                onClick={() => {
                  // Fonction pour copier la configuration
                  const config = { data, pattern, marker, center, frame, foregroundColor, backgroundColor, image };
                  navigator.clipboard.writeText(JSON.stringify(config, null, 2));
                  alert('Configuration copiée dans le presse-papiers');
                }}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
              >
                Copier la configuration
              </button>
              
              <button
                onClick={() => {
                  // Reset de la configuration
                  setPattern('rounded');
                  setMarker('extra-rounded');
                  setCenter('dot');
                  setFrame('');
                  setForegroundColor('#000000');
                  setBackgroundColor('#ffffff');
                  setImage(null);
                }}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRDesigner;
