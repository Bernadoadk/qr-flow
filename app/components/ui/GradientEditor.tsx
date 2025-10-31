import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';
import { 
  Plus, 
  X, 
  RotateCw, 
  Move, 
  Eye,
  Download,
  Copy,
  Check
} from 'lucide-react';

interface GradientEditorProps {
  isOpen: boolean;
  onClose: () => void;
  currentColor: string;
  currentGradient: {
    direction: string;
    colors: string[];
    isGradient: boolean;
  };
  onSave: (result: {
    color: string;
    direction: string;
    colors: string[];
    isGradient: boolean;
  }) => void;
  fieldName: string;
}

interface ColorStop {
  id: string;
  color: string;
  position: number;
}

export default function GradientEditor({ 
  isOpen, 
  onClose, 
  currentColor,
  currentGradient, 
  onSave, 
  fieldName 
}: GradientEditorProps) {
  const [gradientType, setGradientType] = useState<'linear' | 'radial' | 'conic'>('linear');
  const [direction, setDirection] = useState(currentGradient.direction || 'to right');
  const [colorStops, setColorStops] = useState<ColorStop[]>(() => {
    if (currentGradient.isGradient && currentGradient.colors && currentGradient.colors.length > 0) {
      return currentGradient.colors.map((color, index) => ({
        id: `stop-${index}`,
        color,
        position: (index / (currentGradient.colors.length - 1)) * 100
      }));
    }
    return [
      { id: 'stop-0', color: currentColor || '#007b5c', position: 0 },
      { id: 'stop-1', color: currentColor || '#007b5c', position: 100 }
    ];
  });
  const [isGradient, setIsGradient] = useState(currentGradient.isGradient || false);
  const [simpleColor, setSimpleColor] = useState(currentColor || '#007b5c');
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mettre à jour les données quand les props changent
  useEffect(() => {
    console.log("🎨 GradientEditor - Props changed:", { currentColor, currentGradient, fieldName });
    
    setDirection(currentGradient.direction || 'to right');
    setSimpleColor(currentColor || '#007b5c');
    setIsGradient(currentGradient.isGradient || false);
    
    if (currentGradient.isGradient && currentGradient.colors && currentGradient.colors.length > 0) {
      setColorStops(currentGradient.colors.map((color, index) => ({
        id: `stop-${index}`,
        color,
        position: (index / (currentGradient.colors.length - 1)) * 100
      })));
    } else {
      setColorStops([
        { id: 'stop-0', color: currentColor || '#007b5c', position: 0 },
        { id: 'stop-1', color: currentColor || '#007b5c', position: 100 }
      ]);
    }
  }, [currentColor, currentGradient, fieldName]);

  // Directions prédéfinies
  const linearDirections = [
    { value: 'to right', label: 'Gauche → Droite', icon: '→' },
    { value: 'to left', label: 'Droite → Gauche', icon: '←' },
    { value: 'to bottom', label: 'Haut → Bas', icon: '↓' },
    { value: 'to top', label: 'Bas → Haut', icon: '↑' },
    { value: 'to bottom right', label: 'Haut gauche → Bas droite', icon: '↘' },
    { value: 'to top left', label: 'Bas droite → Haut gauche', icon: '↖' },
    { value: 'to bottom left', label: 'Haut droite → Bas gauche', icon: '↙' },
    { value: 'to top right', label: 'Bas gauche → Haut droite', icon: '↗' },
    { value: '45deg', label: '45°', icon: '↗' },
    { value: '90deg', label: '90°', icon: '→' },
    { value: '135deg', label: '135°', icon: '↘' },
    { value: '180deg', label: '180°', icon: '↓' },
    { value: '225deg', label: '225°', icon: '↙' },
    { value: '270deg', label: '270°', icon: '←' },
    { value: '315deg', label: '315°', icon: '↖' }
  ];

  const radialDirections = [
    { value: 'circle', label: 'Cercle' },
    { value: 'ellipse', label: 'Ellipse' },
    { value: 'circle at center', label: 'Cercle au centre' },
    { value: 'circle at top', label: 'Cercle en haut' },
    { value: 'circle at bottom', label: 'Cercle en bas' },
    { value: 'circle at left', label: 'Cercle à gauche' },
    { value: 'circle at right', label: 'Cercle à droite' }
  ];

  // Générer le CSS du dégradé
  const generateGradientCSS = () => {
    if (!isGradient) {
      return simpleColor;
    }

    if (colorStops.length < 2) {
      return colorStops[0]?.color || simpleColor;
    }

    const sortedStops = [...colorStops].sort((a, b) => a.position - b.position);
    const colorString = sortedStops
      .map(stop => `${stop.color} ${stop.position}%`)
      .join(', ');

    switch (gradientType) {
      case 'linear':
        return `linear-gradient(${direction}, ${colorString})`;
      case 'radial':
        return `radial-gradient(${direction}, ${colorString})`;
      case 'conic':
        return `conic-gradient(${colorString})`;
      default:
        return `linear-gradient(${direction}, ${colorString})`;
    }
  };

  // Dessiner le dégradé sur le canvas
  const drawGradient = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    if (!isGradient) {
      // Couleur simple
      ctx.fillStyle = simpleColor;
      ctx.fillRect(0, 0, width, height);
      return;
    }

    // Créer un dégradé
    let gradient;
    if (gradientType === 'linear') {
      const coords = getLinearGradientCoords(direction, width, height);
      gradient = ctx.createLinearGradient(coords.x1, coords.y1, coords.x2, coords.y2);
    } else if (gradientType === 'radial') {
      gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.min(width, height)/2);
    } else {
      gradient = ctx.createConicGradient(0, width/2, height/2);
    }

    // Ajouter les couleurs
    const sortedStops = [...colorStops].sort((a, b) => a.position - b.position);
    sortedStops.forEach(stop => {
      gradient.addColorStop(stop.position / 100, stop.color);
    });

    // Dessiner le dégradé
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  };

  const getLinearGradientCoords = (dir: string, width: number, height: number) => {
    const coords: { x1: number; y1: number; x2: number; y2: number } = {
      x1: 0, y1: 0, x2: width, y2: 0
    };

    switch (dir) {
      case 'to right':
        return { x1: 0, y1: 0, x2: width, y2: 0 };
      case 'to left':
        return { x1: width, y1: 0, x2: 0, y2: 0 };
      case 'to bottom':
        return { x1: 0, y1: 0, x2: 0, y2: height };
      case 'to top':
        return { x1: 0, y1: height, x2: 0, y2: 0 };
      case 'to bottom right':
        return { x1: 0, y1: 0, x2: width, y2: height };
      case 'to top left':
        return { x1: width, y1: height, x2: 0, y2: 0 };
      case 'to bottom left':
        return { x1: width, y1: 0, x2: 0, y2: height };
      case 'to top right':
        return { x1: 0, y1: height, x2: width, y2: 0 };
      default:
        // Pour les angles en degrés
        if (dir.includes('deg')) {
          const angle = parseInt(dir);
          const radians = (angle * Math.PI) / 180;
          const x2 = Math.cos(radians) * width;
          const y2 = Math.sin(radians) * height;
          return { x1: width/2, y1: height/2, x2: width/2 + x2, y2: height/2 + y2 };
        }
        return coords;
    }
  };

  // Redessiner quand les paramètres changent
  useEffect(() => {
    drawGradient();
  }, [gradientType, direction, colorStops, isGradient, simpleColor]);

  const addColorStop = () => {
    const newStop: ColorStop = {
      id: `stop-${Date.now()}`,
      color: '#000000',
      position: 50
    };
    setColorStops([...colorStops, newStop]);
  };

  const removeColorStop = (id: string) => {
    if (colorStops.length > 2) {
      setColorStops(colorStops.filter(stop => stop.id !== id));
    }
  };

  const updateColorStop = (id: string, field: 'color' | 'position', value: string | number) => {
    setColorStops(colorStops.map(stop => 
      stop.id === id ? { ...stop, [field]: value } : stop
    ));
  };

  const copyCSS = async () => {
    const css = generateGradientCSS();
    await navigator.clipboard.writeText(css);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    const css = generateGradientCSS();
    console.log("🎨 GradientEditor - Generated CSS:", css);
    
    const result = {
      color: isGradient ? css : simpleColor, // Utiliser le CSS généré pour les dégradés
      direction,
      colors: colorStops.map(stop => stop.color),
      isGradient
    };
    
    console.log("🎨 GradientEditor - Save result:", result);
    onSave(result);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-semibold">
            Éditeur de couleur - {fieldName}
          </h3>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Mode couleur simple vs dégradé */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mode de couleur
            </label>
            <div className="flex space-x-2">
              <Button
                variant={!isGradient ? 'default' : 'outline'}
                onClick={() => setIsGradient(false)}
                className="flex items-center space-x-2"
              >
                <span>🎨</span>
                <span>Couleur simple</span>
              </Button>
              <Button
                variant={isGradient ? 'default' : 'outline'}
                onClick={() => setIsGradient(true)}
                className="flex items-center space-x-2"
              >
                <span>🌈</span>
                <span>Dégradé</span>
              </Button>
            </div>
          </div>

          {/* Couleur simple */}
          {!isGradient && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Couleur
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={simpleColor}
                  onChange={(e) => setSimpleColor(e.target.value)}
                  className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                />
                <Input
                  value={simpleColor}
                  onChange={(e) => setSimpleColor(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          )}

          {/* Type de dégradé */}
          {isGradient && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de dégradé
              </label>
              <div className="flex space-x-2">
                {[
                  { value: 'linear', label: 'Linéaire', icon: '📏' },
                  { value: 'radial', label: 'Radial', icon: '⭕' },
                  { value: 'conic', label: 'Conique', icon: '🔄' }
                ].map(type => (
                  <Button
                    key={type.value}
                    variant={gradientType === type.value ? 'default' : 'outline'}
                    onClick={() => setGradientType(type.value as any)}
                    className="flex items-center space-x-2"
                  >
                    <span>{type.icon}</span>
                    <span>{type.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Direction */}
          {isGradient && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Direction
              </label>
              <Select
                value={direction}
                onChange={(e) => setDirection(e.target.value)}
              >
                {(gradientType === 'linear' ? linearDirections : radialDirections).map(dir => (
                  <option key={dir.value} value={dir.value}>
                    {dir.label}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {/* Aperçu du dégradé */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Aperçu
            </label>
            <div className="space-y-4">
              {/* Canvas pour l'aperçu */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={200}
                  className="w-full max-w-md mx-auto rounded border"
                />
              </div>

              {/* Aperçu CSS */}
              <div className="bg-gray-100 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Code CSS généré :</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyCSS}
                    className="flex items-center space-x-1"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span>{copied ? 'Copié !' : 'Copier'}</span>
                  </Button>
                </div>
                <code className="text-sm bg-white p-2 rounded border block">
                  {generateGradientCSS()}
                </code>
              </div>
            </div>
          </div>

          {/* Contrôles des couleurs */}
          {isGradient && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Couleurs du dégradé
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addColorStop}
                  className="flex items-center space-x-1"
                >
                  <Plus className="h-4 w-4" />
                  <span>Ajouter une couleur</span>
                </Button>
              </div>

              <div className="space-y-3">
                {colorStops.map((stop, index) => (
                  <div key={stop.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={stop.color}
                        onChange={(e) => updateColorStop(stop.id, 'color', e.target.value)}
                        className="w-8 h-8 rounded border cursor-pointer"
                      />
                      <Input
                        value={stop.color}
                        onChange={(e) => updateColorStop(stop.id, 'color', e.target.value)}
                        className="w-24"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Position:</span>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={stop.position}
                        onChange={(e) => updateColorStop(stop.id, 'position', parseInt(e.target.value))}
                        className="w-16"
                      />
                      <span className="text-sm text-gray-600">%</span>
                    </div>

                    {colorStops.length > 2 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeColorStop(stop.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={handleSave} className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <Download className="h-4 w-4 mr-2" />
              Appliquer la couleur
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
