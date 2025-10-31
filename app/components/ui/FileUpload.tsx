import React, { useState, useRef, useCallback } from 'react';
import { Upload, X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  acceptedTypes?: string[];
  maxSize?: number; // en MB
  label?: string;
  helpText?: string;
  disabled?: boolean;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  acceptedTypes = ['image/*'],
  maxSize = 5,
  label,
  helpText,
  disabled = false,
  className,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    // Vérifier le type de fichier
    const isValidType = acceptedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1));
      }
      return file.type === type;
    });

    if (!isValidType) {
      return `Type de fichier non supporté. Types acceptés: ${acceptedTypes.join(', ')}`;
    }

    // Vérifier la taille
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `Fichier trop volumineux. Taille maximale: ${maxSize}MB`;
    }

    return null;
  }, [acceptedTypes, maxSize]);

  const handleFileSelect = useCallback((file: File) => {
    setError(null);
    const validationError = validateFile(file);
    
    if (validationError) {
      setError(validationError);
      return;
    }

    onFileSelect(file);
  }, [validateFile, onFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [disabled, handleFileSelect]);

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer',
          'hover:border-blue-400 hover:bg-blue-50/50',
          'dark:hover:border-blue-500 dark:hover:bg-blue-900/20',
          isDragOver && 'border-blue-500 bg-blue-50 dark:bg-blue-900/30',
          disabled && 'opacity-50 cursor-not-allowed hover:border-gray-300 hover:bg-transparent',
          error && 'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20',
          'focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-label="Sélectionner un fichier"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleFileInputChange}
          className="hidden absolute w-0 h-0 p-0 m-0 overflow-hidden"
          style={{ display: 'none' }}
          tabIndex={-1}
          aria-hidden="true"
          disabled={disabled}
        />
        
        <div className="space-y-2">
          <Upload className={cn(
            'h-8 w-8 mx-auto',
            isDragOver ? 'text-blue-500' : 'text-gray-400',
            error && 'text-red-400'
          )} />
          
          <div className="space-y-1">
            <p className={cn(
              'text-sm font-medium',
              isDragOver ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400',
              error && 'text-red-600 dark:text-red-400'
            )}>
              Choisir un fichier
            </p>
            <p className={cn(
              'text-xs',
              isDragOver ? 'text-blue-500 dark:text-blue-400' : 'text-gray-500 dark:text-gray-500',
              error && 'text-red-500 dark:text-red-400'
            )}>
              Glissez-déposez un fichier ici ou cliquez pour sélectionner
            </p>
          </div>
        </div>
      </div>

      {helpText && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {helpText}
        </p>
      )}

      {error && (
        <div className="flex items-center space-x-2 text-sm text-red-600 dark:text-red-400">
          <X className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
