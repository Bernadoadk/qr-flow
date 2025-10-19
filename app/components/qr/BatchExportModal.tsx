import React, { useState } from 'react';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Checkbox } from '../ui/Checkbox';
import { useToast } from '../ui/Toast';
import { useLoading } from '../../hooks/useLoading';
import {
  Download,
  Package,
  FileText,
  Image,
  FileImage,
  Settings,
  Check,
  X,
  AlertCircle,
  Info,
} from 'lucide-react';

interface QRCode {
  id: string;
  title: string;
  type: string;
  destination: string;
  scanCount: number;
  active: boolean;
  createdAt: string;
}

interface BatchExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCodes: QRCode[];
  selectedQRCodes: string[];
  onSelectionChange: (selectedIds: string[]) => void;
}

const BatchExportModal: React.FC<BatchExportModalProps> = ({
  isOpen,
  onClose,
  qrCodes,
  selectedQRCodes,
  onSelectionChange,
}) => {
  const [exportFormat, setExportFormat] = useState<'png' | 'svg' | 'pdf'>('png');
  const [exportSize, setExportSize] = useState(300);
  const [includeMetadata, setIncludeMetadata] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  
  const { success, error: showError } = useToast();
  const { isLoading: isExporting, withLoading } = useLoading();

  const availableQRCodes = qrCodes.filter(qr => qr.active);
  const selectedCount = selectedQRCodes.length;

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      onSelectionChange(availableQRCodes.map(qr => qr.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleQRCodeSelect = (qrId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedQRCodes, qrId]);
    } else {
      onSelectionChange(selectedQRCodes.filter(id => id !== qrId));
    }
  };

  const handleExport = async () => {
    if (selectedQRCodes.length === 0) {
      showError('Erreur', 'Veuillez sélectionner au moins un QR code à exporter.');
      return;
    }

    if (selectedQRCodes.length > 50) {
      showError('Erreur', 'Vous ne pouvez pas exporter plus de 50 QR codes à la fois.');
      return;
    }

    try {
      await withLoading('export', async () => {
        const response = await fetch('/api/export/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            qrCodeIds: selectedQRCodes,
            format: exportFormat,
            size: exportSize,
            includeMetadata,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erreur lors de l\'export');
        }

        // Download the ZIP file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qr-codes-batch-export-${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        success('Export réussi!', `${selectedQRCodes.length} QR codes ont été exportés avec succès.`);
        onClose();
      });
    } catch (error) {
      console.error('Error exporting QR codes:', error);
      showError('Erreur d\'export', error instanceof Error ? error.message : 'Une erreur est survenue.');
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'png': return <Image className="h-4 w-4" />;
      case 'svg': return <FileImage className="h-4 w-4" />;
      case 'pdf': return <FileText className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getFormatDescription = (format: string) => {
    switch (format) {
      case 'png': return 'Images PNG haute qualité';
      case 'svg': return 'Vecteurs SVG évolutifs';
      case 'pdf': return 'Documents PDF imprimables';
      default: return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Download className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Export en lot</h2>
              <p className="text-sm text-gray-600">Exporter plusieurs QR codes simultanément</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel - QR Code Selection */}
          <div className="w-1/2 border-r overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Sélection des QR codes</h3>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectAll}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                  <Label className="text-sm">Tout sélectionner</Label>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableQRCodes.map((qr) => (
                  <div
                    key={qr.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                      selectedQRCodes.includes(qr.id)
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    )}
                  >
                    <Checkbox
                      checked={selectedQRCodes.includes(qr.id)}
                      onChange={(e) => handleQRCodeSelect(qr.id, e.target.checked)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm truncate">{qr.title}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {qr.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{qr.destination}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">
                          {qr.scanCount} scans
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-400">
                          {new Date(qr.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {availableQRCodes.length === 0 && (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun QR code actif</h3>
                  <p className="text-gray-600">Activez des QR codes pour pouvoir les exporter.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Export Settings */}
          <div className="w-1/2 overflow-y-auto">
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Options d'export</h3>
                
                {/* Format Selection */}
                <div className="space-y-3">
                  <Label>Format d'export</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {(['png', 'svg', 'pdf'] as const).map((format) => (
                      <div
                        key={format}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                          exportFormat === format
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        )}
                        onClick={() => setExportFormat(format)}
                      >
                        <div className={cn(
                          'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                          exportFormat === format
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        )}>
                          {exportFormat === format && (
                            <Check className="h-2.5 w-2.5 text-white" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {getFormatIcon(format)}
                          <span className="font-medium capitalize">{format}</span>
                        </div>
                        <div className="flex-1 text-right">
                          <span className="text-xs text-gray-500">
                            {getFormatDescription(format)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Size Selection */}
                <div className="space-y-3">
                  <Label>Taille (pixels)</Label>
                  <Select
                    value={exportSize.toString()}
                    onChange={(e) => setExportSize(parseInt(e.target.value))}
                  >
                    <option value="150">150px - Petite</option>
                    <option value="300">300px - Standard</option>
                    <option value="500">500px - Grande</option>
                    <option value="800">800px - Très grande</option>
                    <option value="1000">1000px - Maximum</option>
                  </Select>
                </div>

                {/* Metadata Option */}
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={includeMetadata}
                    onChange={(e) => setIncludeMetadata(e.target.checked)}
                  />
                  <div>
                    <Label>Inclure les métadonnées</Label>
                    <p className="text-xs text-gray-500">
                      Ajoute un fichier JSON avec les informations de chaque QR code
                    </p>
                  </div>
                </div>
              </div>

              {/* Export Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Résumé de l'export
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">QR codes sélectionnés:</span>
                    <span className="font-medium">{selectedCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Format:</span>
                    <span className="font-medium capitalize">{exportFormat}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Taille:</span>
                    <span className="font-medium">{exportSize}px</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Métadonnées:</span>
                    <span className="font-medium">{includeMetadata ? 'Oui' : 'Non'}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleExport}
                  disabled={selectedCount === 0 || isExporting('export')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting('export') ? 'Export en cours...' : `Exporter ${selectedCount} QR codes`}
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Annuler
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchExportModal;

