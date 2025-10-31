import React, { useState, useRef } from 'react';

interface ImagePickerProps {
  onSelect: (image: string | null) => void;
  selectedImage?: string | null;
  className?: string;
}

const PREDEFINED_IMAGES = [
  { id: 'gradient-blue', name: 'Dégradé bleu', src: '/qr-styles/backgrounds/gradient-blue.svg' },
  { id: 'gradient-purple', name: 'Dégradé violet', src: '/qr-styles/backgrounds/gradient-purple.svg' },
  { id: 'gradient-green', name: 'Dégradé vert', src: '/qr-styles/backgrounds/gradient-green.svg' },
  { id: 'pattern-dots', name: 'Motif points', src: '/qr-styles/backgrounds/pattern-dots.svg' },
  { id: 'pattern-grid', name: 'Grille', src: '/qr-styles/backgrounds/pattern-grid.svg' },
];

const ImagePicker: React.FC<ImagePickerProps> = ({ onSelect, selectedImage, className = '' }) => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(selectedImage ?? null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 2 * 1024 * 1024) return; // 2MB
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUploadedImage(result);
      onSelect(result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800">Image (logo)</h3>

      {/* Upload */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Uploader une image</label>
        <div
          onClick={() => fileInputRef.current?.click()}
          className="relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all duration-200 border-gray-300 hover:border-gray-400"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFileSelect(f);
            }}
            className="hidden"
          />

          {uploadedImage ? (
            <div className="space-y-3">
              <div className="relative inline-block">
                <img src={uploadedImage} alt="Preview" className="w-20 h-20 object-contain rounded-lg border border-gray-200" />
                <button
                  onClick={(e) => { e.stopPropagation(); setUploadedImage(null); onSelect(null); }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ×
                </button>
              </div>
              <div className="text-sm text-gray-600">Cliquez pour changer l'image</div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="text-sm text-gray-600">Cliquez pour sélectionner</div>
              <div className="text-xs text-gray-500">PNG, JPG, SVG jusqu'à 2MB</div>
            </div>
          )}
        </div>
      </div>

      {/* Prédéfinies */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">Images prédéfinies</label>
        <div className="grid grid-cols-2 gap-3">
          {PREDEFINED_IMAGES.map((img) => (
            <button
              key={img.id}
              onClick={() => { setUploadedImage(null); onSelect(img.src); }}
              onMouseEnter={() => setHoveredId(img.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`relative p-3 rounded-lg border-2 transition-all duration-200 ${selectedImage === img.src ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'} ${hoveredId === img.id ? 'scale-105' : 'scale-100'}`}
            >
              <div className="flex justify-center mb-3">
                <div className="w-16 h-16 rounded border border-gray-200 overflow-hidden bg-white">
                  <img src={img.src} alt={img.name} className="w-full h-full object-contain" />
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-700">{img.name}</div>
              </div>
              {selectedImage === img.src && (
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
    </div>
  );
};

export default ImagePicker;


