import React, { useState, useRef } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import Modal from './Modal';
import { Badge } from './Badge';
import { motion } from 'framer-motion';
import {
  Image,
  Upload,
  X,
  Check,
  AlertCircle,
  Eye,
  Download,
  Calendar,
  Heart,
  Gift,
  Zap
} from 'lucide-react';

interface BackgroundSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  currentBackground?: string;
  onSelect: (backgroundUrl: string) => void;
}

// Configuration des catégories d'événements
const EVENT_CATEGORIES = [
  {
    id: 'noel',
    name: 'Noël',
    icon: Gift,
    color: 'red',
    path: '/images/Noel/'
  },
  {
    id: 'paques',
    name: 'Pâques',
    icon: Calendar,
    color: 'green',
    path: '/images/Pâques/'
  },
  {
    id: 'halloween',
    name: 'Halloween',
    icon: Zap,
    color: 'orange',
    path: '/images/Halloween/'
  },
  {
    id: 'saint-valentin',
    name: 'Saint-Valentin',
    icon: Heart,
    color: 'pink',
    path: '/images/Saint-Valentin/'
  }
];

// Images prédéfinies par catégorie
const BACKGROUND_IMAGES = {
  noel: [
    'diliara-garifullina-MOAi0WIcc9k-unsplash.jpg',
    'etienne-delorieux-6jKF9canFsE-unsplash.jpg',
    'etienne-girardet-4eqmIWYm_Rg-unsplash.jpg',
    'family-life-xYYotkgR0NM-unsplash.jpg',
    'yevhenii-dubrovskyi-hNxNxJMMIy4-unsplash.jpg'
  ],
  paques: [
    'bobysbk-Zbvez5nSF1k-unsplash.jpg',
    'filip-baotic-6s3J4RVGOl0-unsplash.jpg',
    'ioana-cristiana-cM9JhkN042Q-unsplash.jpg',
    'tim-mossholder-hmkkbJR9Br4-unsplash.jpg',
    'yuliia-kucherenko-Zo5f5IF4Nh4-unsplash.jpg'
  ],
  halloween: [
    'bob-chambers-piVWTl6zRfs-unsplash.jpg',
    'millie-sanz-r4e_XAyecUM-unsplash.jpg',
    'tamara-badran-9bu4uP6PG4Y-unsplash.jpg',
    'tatsuya-000-QUJBj57aV1Q-unsplash.jpg'
  ],
  'saint-valentin': [
    'hamide-jafari-ngP6ALBa-5A-unsplash.jpg',
    'hanna-balan-aqhEkYD7Fd4-unsplash.jpg',
    'izumi-jS4UNRCMqUk-unsplash.jpg',
    'sidney-pearce-yPMJliKzyc4-unsplash.jpg',
    'sixteen-miles-out-iz1OzTbk61c-unsplash.jpg'
  ]
};

export default function BackgroundSelector({
  isOpen,
  onClose,
  currentBackground,
  onSelect
}: BackgroundSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState('noel');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [previewModal, setPreviewModal] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation des fichiers uploadés
  const validateFile = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 2 * 1024 * 1024; // 2MB
    const minWidth = 1920;
    const minHeight = 1080;

    if (!allowedTypes.includes(file.type)) {
      return 'Format non supporté. Utilisez JPG, PNG ou WebP.';
    }

    if (file.size > maxSize) {
      return 'Fichier trop volumineux. Taille maximale : 2MB.';
    }

    return null;
  };

  // Vérification des dimensions d'image
  const checkImageDimensions = (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = document.createElement('img');
      img.onload = () => {
        if (img.width < 1920 || img.height < 1080) {
          resolve('Résolution insuffisante. Minimum requis : 1920x1080px.');
        } else {
          resolve(null);
        }
      };
      img.onerror = () => resolve('Impossible de lire les dimensions de l\'image.');
      img.src = URL.createObjectURL(file);
    });
  };

  // Gestion de l'upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadSuccess(false);

    // Validation du fichier
    const fileError = validateFile(file);
    if (fileError) {
      setUploadError(fileError);
      return;
    }

    // Vérification des dimensions
    const dimensionError = await checkImageDimensions(file);
    if (dimensionError) {
      setUploadError(dimensionError);
      return;
    }

    // Conversion en base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      onSelect(result);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    };
    reader.readAsDataURL(file);
  };

  // Sélection d'une image prédéfinie
  const handleImageSelect = (imageName: string) => {
    const imageUrl = `${EVENT_CATEGORIES.find(cat => cat.id === selectedCategory)?.path}${imageName}`;
    setSelectedImage(imageUrl);
    setPreviewModal(true);
  };

  // Application de l'image sélectionnée
  const applySelectedImage = () => {
    if (selectedImage) {
      onSelect(selectedImage);
      setPreviewModal(false);
      setSelectedImage(null);
    }
  };

  // Récupération des images de la catégorie sélectionnée
  const getCategoryImages = () => {
    return BACKGROUND_IMAGES[selectedCategory as keyof typeof BACKGROUND_IMAGES] || [];
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Sélectionner un fond d'écran"
        size="2xl"
      >
        <div className="space-y-6">
          {/* Sélection de catégorie */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Catégorie d'événement
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {EVENT_CATEGORIES.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedCategory === category.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                    <span className="text-sm font-medium">{category.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grille d'images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Images disponibles
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {getCategoryImages().map((imageName, index) => {
                const imageUrl = `${EVENT_CATEGORIES.find(cat => cat.id === selectedCategory)?.path}${imageName}`;
                return (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative group cursor-pointer"
                    onClick={() => handleImageSelect(imageName)}
                  >
                    <div className="aspect-video rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-colors">
                      <img
                        src={imageUrl}
                        alt={`Background ${index + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                      <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Upload personnalisé */}
          <div className="border-t pt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Uploader votre propre image
            </label>
            
            {/* Messages d'erreur/succès */}
            {uploadError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-red-700 text-sm">{uploadError}</span>
              </div>
            )}
            
            {uploadSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
                <Check className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-green-700 text-sm">Image uploadée avec succès !</span>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-2"
                >
                  <Upload className="h-4 w-4" />
                  <span>Sélectionner un fichier</span>
                </Button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              
              <div className="text-xs text-gray-500 space-y-1">
                <p><strong>Formats acceptés :</strong> JPG, PNG, WebP</p>
                <p><strong>Résolution minimale :</strong> 1920x1080px</p>
                <p><strong>Taille maximale :</strong> 2MB</p>
                <p><strong>Ratio recommandé :</strong> 16:9</p>
              </div>
            </div>
          </div>

          {/* Fond actuel */}
          {currentBackground && (
            <div className="border-t pt-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Fond actuel
              </label>
              <div className="aspect-video rounded-lg overflow-hidden border-2 border-gray-200">
                <img
                  src={currentBackground}
                  alt="Fond actuel"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal de prévisualisation */}
      <Modal
        isOpen={previewModal}
        onClose={() => setPreviewModal(false)}
        title="Prévisualisation"
        size="xl"
      >
        {selectedImage && (
          <div className="space-y-4">
            <div className="aspect-video rounded-lg overflow-hidden border-2 border-gray-200">
              <img
                src={selectedImage}
                alt="Prévisualisation"
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setPreviewModal(false)}
              >
                Annuler
              </Button>
              <Button
                onClick={applySelectedImage}
                className="flex items-center space-x-2"
              >
                <Check className="h-4 w-4" />
                <span>Utiliser comme fond</span>
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
