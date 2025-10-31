import React, { useState, useRef } from 'react';

interface LogoUploaderProps {
  onChange: (logo: string | null) => void;
  currentLogo?: string;
  className?: string;
}

const LogoUploader: React.FC<LogoUploaderProps> = ({
  onChange,
  currentLogo,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentLogo || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image valide');
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      alert('Le fichier est trop volumineux. Taille maximale: 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
      onChange(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleRemoveLogo = () => {
    setPreview(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800">Logo central</h3>
      
      {/* Zone de drop */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
          ${isDragging 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${preview ? 'border-solid' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {preview ? (
          <div className="space-y-3">
            <div className="relative inline-block">
              <img
                src={preview}
                alt="Logo preview"
                className="w-20 h-20 object-contain rounded-lg border border-gray-200"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveLogo();
                }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
              >
                ×
              </button>
            </div>
            <div className="text-sm text-gray-600">
              Cliquez pour changer le logo
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div className="text-sm text-gray-600">
              {isDragging ? (
                'Déposez votre image ici'
              ) : (
                <>
                  Glissez-déposez une image ou{' '}
                  <span className="text-blue-600 hover:text-blue-700 underline">
                    cliquez pour sélectionner
                  </span>
                </>
              )}
            </div>
            <div className="text-xs text-gray-500">
              PNG, JPG, SVG jusqu'à 2MB
            </div>
          </div>
        )}
      </div>

      {/* Options de logo */}
      {preview && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">Options du logo</div>
          <div className="text-xs text-gray-500">
            Le logo sera automatiquement redimensionné et centré dans le QR code
          </div>
        </div>
      )}
    </div>
  );
};

export default LogoUploader;
