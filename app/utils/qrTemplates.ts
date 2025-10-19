import { QRCodeOptions } from './qrcodeUtils';

export interface QRTemplate {
  id: string;
  name: string;
  description: string;
  category: 'minimalist' | 'luxury' | 'fun' | 'corporate' | 'creative';
  options: QRCodeOptions;
  preview: string; // Base64 preview image or CSS class
  tags: string[];
}

export const QR_TEMPLATES: QRTemplate[] = [
  // Minimalist Templates
  {
    id: 'minimalist-black',
    name: 'Minimaliste Noir',
    description: 'Design épuré avec des points noirs sur fond blanc',
    category: 'minimalist',
    options: {
      width: 300,
      height: 300,
      type: 'svg',
      data: '',
      dotsOptions: {
        color: '#000000',
        type: 'square',
      },
      backgroundOptions: {
        color: '#ffffff',
      },
      cornersSquareOptions: {
        color: '#000000',
        type: 'square',
      },
      cornersDotOptions: {
        color: '#000000',
        type: 'dot',
      },
    },
    preview: 'minimalist-black',
    tags: ['épuré', 'professionnel', 'moderne'],
  },
  {
    id: 'minimalist-gray',
    name: 'Minimaliste Gris',
    description: 'Version douce avec des tons gris',
    category: 'minimalist',
    options: {
      width: 300,
      height: 300,
      type: 'svg',
      data: '',
      dotsOptions: {
        color: '#6b7280',
        type: 'rounded',
      },
      backgroundOptions: {
        color: '#f9fafb',
      },
      cornersSquareOptions: {
        color: '#6b7280',
        type: 'square',
      },
      cornersDotOptions: {
        color: '#6b7280',
        type: 'dot',
      },
    },
    preview: 'minimalist-gray',
    tags: ['doux', 'élégant', 'neutre'],
  },

  // Luxury Templates
  {
    id: 'luxury-gold',
    name: 'Luxe Or',
    description: 'Design premium avec des accents dorés',
    category: 'luxury',
    options: {
      width: 300,
      height: 300,
      type: 'svg',
      data: '',
      dotsOptions: {
        color: '#d4af37',
        type: 'classy',
      },
      backgroundOptions: {
        color: '#1a1a1a',
      },
      cornersSquareOptions: {
        color: '#d4af37',
        type: 'square',
      },
      cornersDotOptions: {
        color: '#d4af37',
        type: 'square',
      },
    },
    preview: 'luxury-gold',
    tags: ['premium', 'luxueux', 'élégant'],
  },
  {
    id: 'luxury-silver',
    name: 'Luxe Argent',
    description: 'Design sophistiqué avec des tons argentés',
    category: 'luxury',
    options: {
      width: 300,
      height: 300,
      type: 'svg',
      data: '',
      dotsOptions: {
        color: '#c0c0c0',
        type: 'classy-rounded',
      },
      backgroundOptions: {
        color: '#2d2d2d',
      },
      cornersSquareOptions: {
        color: '#c0c0c0',
        type: 'square',
      },
      cornersDotOptions: {
        color: '#c0c0c0',
        type: 'square',
      },
    },
    preview: 'luxury-silver',
    tags: ['sophistiqué', 'métallique', 'premium'],
  },
  {
    id: 'luxury-royal',
    name: 'Luxe Royal',
    description: 'Design royal avec des tons pourpres',
    category: 'luxury',
    options: {
      width: 300,
      height: 300,
      type: 'svg',
      data: '',
      dotsOptions: {
        color: '#8b5cf6',
        type: 'classy',
      },
      backgroundOptions: {
        color: '#1e1b4b',
      },
      cornersSquareOptions: {
        color: '#8b5cf6',
        type: 'square',
      },
      cornersDotOptions: {
        color: '#8b5cf6',
        type: 'square',
      },
    },
    preview: 'luxury-royal',
    tags: ['royal', 'violet', 'premium'],
  },

  // Fun Templates
  {
    id: 'fun-rainbow',
    name: 'Arc-en-ciel',
    description: 'Design coloré et joyeux',
    category: 'fun',
    options: {
      width: 300,
      height: 300,
      type: 'svg',
      data: '',
      dotsOptions: {
        color: '#ef4444',
        type: 'extra-rounded',
      },
      backgroundOptions: {
        color: '#fef3c7',
      },
      cornersSquareOptions: {
        color: '#3b82f6',
        type: 'extra-rounded',
      },
      cornersDotOptions: {
        color: '#10b981',
        type: 'dot',
      },
    },
    preview: 'fun-rainbow',
    tags: ['coloré', 'joyeux', 'créatif'],
  },
  {
    id: 'fun-neon',
    name: 'Néon',
    description: 'Design cyberpunk avec des couleurs néon',
    category: 'fun',
    options: {
      width: 300,
      height: 300,
      type: 'svg',
      data: '',
      dotsOptions: {
        color: '#00ff88',
        type: 'dots',
      },
      backgroundOptions: {
        color: '#0a0a0a',
      },
      cornersSquareOptions: {
        color: '#ff0080',
        type: 'square',
      },
      cornersDotOptions: {
        color: '#00ffff',
        type: 'dot',
      },
    },
    preview: 'fun-neon',
    tags: ['néon', 'cyberpunk', 'futuriste'],
  },
  {
    id: 'fun-pastel',
    name: 'Pastel',
    description: 'Design doux avec des couleurs pastel',
    category: 'fun',
    options: {
      width: 300,
      height: 300,
      type: 'svg',
      data: '',
      dotsOptions: {
        color: '#f472b6',
        type: 'rounded',
      },
      backgroundOptions: {
        color: '#fdf2f8',
      },
      cornersSquareOptions: {
        color: '#a78bfa',
        type: 'extra-rounded',
      },
      cornersDotOptions: {
        color: '#34d399',
        type: 'dot',
      },
    },
    preview: 'fun-pastel',
    tags: ['doux', 'pastel', 'mignon'],
  },

  // Corporate Templates
  {
    id: 'corporate-blue',
    name: 'Corporate Bleu',
    description: 'Design professionnel pour entreprises',
    category: 'corporate',
    options: {
      width: 300,
      height: 300,
      type: 'svg',
      data: '',
      dotsOptions: {
        color: '#1e40af',
        type: 'square',
      },
      backgroundOptions: {
        color: '#ffffff',
      },
      cornersSquareOptions: {
        color: '#1e40af',
        type: 'square',
      },
      cornersDotOptions: {
        color: '#1e40af',
        type: 'square',
      },
    },
    preview: 'corporate-blue',
    tags: ['professionnel', 'entreprise', 'fiable'],
  },
  {
    id: 'corporate-green',
    name: 'Corporate Vert',
    description: 'Design écologique et durable',
    category: 'corporate',
    options: {
      width: 300,
      height: 300,
      type: 'svg',
      data: '',
      dotsOptions: {
        color: '#059669',
        type: 'rounded',
      },
      backgroundOptions: {
        color: '#f0fdf4',
      },
      cornersSquareOptions: {
        color: '#059669',
        type: 'square',
      },
      cornersDotOptions: {
        color: '#059669',
        type: 'dot',
      },
    },
    preview: 'corporate-green',
    tags: ['écologique', 'durable', 'naturel'],
  },

  // Creative Templates
  {
    id: 'creative-gradient',
    name: 'Dégradé',
    description: 'Design avec dégradé de couleurs',
    category: 'creative',
    options: {
      width: 300,
      height: 300,
      type: 'svg',
      data: '',
      dotsOptions: {
        color: '#8b5cf6',
        type: 'classy-rounded',
      },
      backgroundOptions: {
        color: '#ffffff',
      },
      cornersSquareOptions: {
        color: '#3b82f6',
        type: 'extra-rounded',
      },
      cornersDotOptions: {
        color: '#10b981',
        type: 'dot',
      },
    },
    preview: 'creative-gradient',
    tags: ['créatif', 'dégradé', 'artistique'],
  },
  {
    id: 'creative-monochrome',
    name: 'Monochrome',
    description: 'Design en nuances de gris',
    category: 'creative',
    options: {
      width: 300,
      height: 300,
      type: 'svg',
      data: '',
      dotsOptions: {
        color: '#374151',
        type: 'dots',
      },
      backgroundOptions: {
        color: '#f3f4f6',
      },
      cornersSquareOptions: {
        color: '#6b7280',
        type: 'square',
      },
      cornersDotOptions: {
        color: '#9ca3af',
        type: 'dot',
      },
    },
    preview: 'creative-monochrome',
    tags: ['monochrome', 'nuances', 'artistique'],
  },
];

export const getTemplateById = (id: string): QRTemplate | undefined => {
  return QR_TEMPLATES.find(template => template.id === id);
};

export const getTemplatesByCategory = (category: string): QRTemplate[] => {
  return QR_TEMPLATES.filter(template => template.category === category);
};

export const searchTemplates = (query: string): QRTemplate[] => {
  const lowercaseQuery = query.toLowerCase();
  return QR_TEMPLATES.filter(template => 
    template.name.toLowerCase().includes(lowercaseQuery) ||
    template.description.toLowerCase().includes(lowercaseQuery) ||
    template.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
};

export const getTemplateCategories = (): string[] => {
  return Array.from(new Set(QR_TEMPLATES.map(template => template.category)));
};

