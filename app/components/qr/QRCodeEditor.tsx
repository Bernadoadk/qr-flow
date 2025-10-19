import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { generateQRCodePreview, validateQRData, getQRCodeType } from '../../utils/qrcodeUtils';
import { Download, Eye, EyeOff, Palette } from 'lucide-react';
import QRTemplateSelector from './QRTemplateSelector';
import { type QRTemplate } from '../../utils/qrTemplates';

interface QRCodeEditorProps {
  data?: string;
  onDataChange?: (data: string) => void;
  onQRCodeGenerated?: (qrCode: any) => void;
  className?: string;
}

const QRCodeEditor: React.FC<QRCodeEditorProps> = ({
  data = '',
  onDataChange,
  onQRCodeGenerated,
  className,
}) => {
  const [qrData, setQrData] = useState(data);
  const [foregroundColor, setForegroundColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [qrStyle, setQrStyle] = useState('rounded');
  const [showPreview, setShowPreview] = useState(true);
  const [isValid, setIsValid] = useState(true);
  const [qrType, setQrType] = useState('text');
  const [showTemplates, setShowTemplates] = useState(false);
  
  const previewRef = useRef<HTMLDivElement>(null);
  const qrCodeRef = useRef<any>(null);

  useEffect(() => {
    if (qrData && previewRef.current) {
      const valid = validateQRData(qrData);
      setIsValid(valid);
      
      if (valid) {
        const type = getQRCodeType(qrData);
        setQrType(type);
        
        try {
          const qrCode = generateQRCodePreview(qrData, previewRef.current, {
            foregroundColor,
            backgroundColor,
            dotsOptions: {
              color: foregroundColor,
              type: qrStyle as any,
            },
            backgroundOptions: {
              color: backgroundColor,
            },
          });
          
          qrCodeRef.current = qrCode;
          onQRCodeGenerated?.(qrCode);
        } catch (error) {
          console.error('Error generating QR code:', error);
        }
      }
    }
  }, [qrData, foregroundColor, backgroundColor, qrStyle, onQRCodeGenerated]);

  const handleDataChange = (value: string) => {
    setQrData(value);
    onDataChange?.(value);
  };

  const handleDownload = () => {
    if (qrCodeRef.current) {
      qrCodeRef.current.download({ name: 'qrcode', extension: 'png' });
    }
  };

  const handleTemplateSelect = (template: QRTemplate) => {
    setForegroundColor(template.options.dotsOptions?.color || '#000000');
    setBackgroundColor(template.options.backgroundOptions?.color || '#ffffff');
    setQrStyle(template.options.dotsOptions?.type || 'rounded');
    setShowTemplates(false);
  };

  const presetColors = [
    { name: 'Noir', value: '#000000' },
    { name: 'Bleu', value: '#3B82F6' },
    { name: 'Violet', value: '#8B5CF6' },
    { name: 'Vert', value: '#10B981' },
    { name: 'Rouge', value: '#EF4444' },
    { name: 'Orange', value: '#F59E0B' },
  ];

  const presetBackgrounds = [
    { name: 'Blanc', value: '#FFFFFF' },
    { name: 'Gris clair', value: '#F3F4F6' },
    { name: 'Bleu clair', value: '#EFF6FF' },
    { name: 'Violet clair', value: '#F3F0FF' },
    { name: 'Vert clair', value: '#ECFDF5' },
    { name: 'Rouge clair', value: '#FEF2F2' },
  ];

  const styleOptions = [
    { value: 'square', label: 'Carré' },
    { value: 'rounded', label: 'Arrondi' },
    { value: 'dots', label: 'Points' },
    { value: 'classy', label: 'Classique' },
    { value: 'classy-rounded', label: 'Classique arrondi' },
    { value: 'extra-rounded', label: 'Très arrondi' },
  ];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Data Input */}
      <Card>
        <CardHeader>
          <CardTitle>Contenu du QR Code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="qr-data">Données</Label>
            <Input
              id="qr-data"
              type="text"
              value={qrData}
              onChange={(e) => handleDataChange(e.target.value)}
              placeholder="Entrez l'URL, le texte ou les données..."
              className={cn(
                'mt-1',
                !isValid && qrData && 'border-red-500 focus:border-red-500 focus:ring-red-500'
              )}
            />
            {!isValid && qrData && (
              <p className="mt-1 text-sm text-red-600">
                Format de données invalide
              </p>
            )}
            {isValid && qrData && (
              <p className="mt-1 text-sm text-green-600">
                Type détecté: {qrType}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Customization */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Personnalisation</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTemplates(!showTemplates)}
              className="flex items-center gap-2"
            >
              <Palette className="h-4 w-4" />
              Templates
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Foreground Color */}
          <div>
            <Label>Couleur principale</Label>
            <div className="mt-2 grid grid-cols-6 gap-2">
              {presetColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setForegroundColor(color.value)}
                  className={cn(
                    'h-8 w-8 rounded border-2 transition-all',
                    foregroundColor === color.value
                      ? 'border-gray-900 scale-110'
                      : 'border-gray-300 hover:scale-105'
                  )}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
            <div className="mt-2 flex items-center space-x-2">
              <Input
                type="color"
                value={foregroundColor}
                onChange={(e) => setForegroundColor(e.target.value)}
                className="h-8 w-16 p-1"
              />
              <Input
                type="text"
                value={foregroundColor}
                onChange={(e) => setForegroundColor(e.target.value)}
                className="flex-1"
                placeholder="#000000"
              />
            </div>
          </div>

          {/* Background Color */}
          <div>
            <Label>Couleur de fond</Label>
            <div className="mt-2 grid grid-cols-6 gap-2">
              {presetBackgrounds.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setBackgroundColor(color.value)}
                  className={cn(
                    'h-8 w-8 rounded border-2 transition-all',
                    backgroundColor === color.value
                      ? 'border-gray-900 scale-110'
                      : 'border-gray-300 hover:scale-105'
                  )}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
            <div className="mt-2 flex items-center space-x-2">
              <Input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="h-8 w-16 p-1"
              />
              <Input
                type="text"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="flex-1"
                placeholder="#FFFFFF"
              />
            </div>
          </div>

          {/* Style */}
          <div>
            <Label htmlFor="qr-style">Style des points</Label>
            <Select
              id="qr-style"
              value={qrStyle}
              onChange={(e) => setQrStyle(e.target.value)}
              className="mt-1"
            >
              {styleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates */}
      {showTemplates && (
        <Card>
          <CardContent className="p-6">
            <QRTemplateSelector
              onTemplateSelect={handleTemplateSelect}
              onPreview={(template) => {
                // Preview functionality could be implemented here
                console.log('Preview template:', template);
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Aperçu</CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!qrData || !isValid}
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {showPreview && qrData && isValid ? (
            <div className="flex justify-center">
              <div
                ref={previewRef}
                className="rounded-lg border border-gray-200 p-4 bg-white"
              />
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  {!qrData ? 'Entrez des données pour voir l\'aperçu' : 'Données invalides'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QRCodeEditor;
