import React, { useState } from 'react';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { QR_TEMPLATES, getTemplatesByCategory, searchTemplates, getTemplateCategories, type QRTemplate } from '../../utils/qrTemplates';
import { 
  Search, 
  Palette, 
  Star, 
  Sparkles, 
  Crown, 
  Smile, 
  Building, 
  Brush,
  Check,
  Eye
} from 'lucide-react';

interface QRTemplateSelectorProps {
  onTemplateSelect?: (template: QRTemplate) => void;
  onPreview?: (template: QRTemplate) => void;
  className?: string;
}

const QRTemplateSelector: React.FC<QRTemplateSelectorProps> = ({
  onTemplateSelect,
  onPreview,
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const categories = getTemplateCategories();
  
  const filteredTemplates = searchQuery 
    ? searchTemplates(searchQuery)
    : selectedCategory === 'all'
    ? QR_TEMPLATES
    : getTemplatesByCategory(selectedCategory);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'minimalist': return <Palette className="h-4 w-4" />;
      case 'luxury': return <Crown className="h-4 w-4" />;
      case 'fun': return <Smile className="h-4 w-4" />;
      case 'corporate': return <Building className="h-4 w-4" />;
      case 'creative': return <Brush className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'minimalist': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'luxury': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'fun': return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'corporate': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'creative': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleTemplateSelect = (template: QRTemplate) => {
    setSelectedTemplate(template.id);
    onTemplateSelect?.(template);
  };

  const handlePreview = (template: QRTemplate) => {
    onPreview?.(template);
  };

  const renderTemplatePreview = (template: QRTemplate) => {
    // This is a simplified preview - in a real implementation, you'd generate actual QR code previews
    return (
      <div 
        className="w-full h-32 rounded-lg border-2 border-dashed flex items-center justify-center"
        style={{ 
          backgroundColor: template.options.backgroundOptions?.color || '#ffffff',
          borderColor: template.options.dotsOptions?.color || '#000000'
        }}
      >
        <div className="text-center">
          <div 
            className="w-16 h-16 mx-auto mb-2 rounded"
            style={{ 
              backgroundColor: template.options.dotsOptions?.color || '#000000',
              opacity: 0.1
            }}
          />
          <div className="text-xs font-medium" style={{ color: template.options.dotsOptions?.color || '#000000' }}>
            {template.name}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Templates QR Code</h2>
        <p className="text-gray-600">Choisissez un design prédéfini pour votre QR code</p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un template..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
            className="flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Tous
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="flex items-center gap-2"
            >
              {getCategoryIcon(category)}
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <Card 
            key={template.id} 
            className={cn(
              'cursor-pointer transition-all duration-200 hover:shadow-lg',
              selectedTemplate === template.id && 'ring-2 ring-blue-500 shadow-lg'
            )}
            onClick={() => handleTemplateSelect(template)}
          >
            <CardContent className="p-4">
              {/* Preview */}
              {renderTemplatePreview(template)}
              
              {/* Template Info */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">{template.name}</h3>
                  {selectedTemplate === template.id && (
                    <Check className="h-4 w-4 text-blue-500" />
                  )}
                </div>
                
                <p className="text-xs text-gray-600 line-clamp-2">
                  {template.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <Badge 
                    variant="secondary" 
                    className={cn('text-xs', getCategoryColor(template.category))}
                  >
                    {getCategoryIcon(template.category)}
                    <span className="ml-1">{template.category}</span>
                  </Badge>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreview(template);
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {template.tags.slice(0, 2).map((tag) => (
                    <span 
                      key={tag}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {template.tags.length > 2 && (
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                      +{template.tags.length - 2}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun template trouvé</h3>
          <p className="text-gray-600">
            Essayez de modifier votre recherche ou de changer de catégorie
          </p>
        </div>
      )}

      {/* Selected Template Actions */}
      {selectedTemplate && (
        <div className="flex justify-center space-x-4 pt-4 border-t">
          <Button
            onClick={() => {
              const template = QR_TEMPLATES.find(t => t.id === selectedTemplate);
              if (template) handleTemplateSelect(template);
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Check className="h-4 w-4 mr-2" />
            Utiliser ce template
          </Button>
          <Button
            variant="outline"
            onClick={() => setSelectedTemplate(null)}
          >
            Annuler
          </Button>
        </div>
      )}
    </div>
  );
};

export default QRTemplateSelector;

