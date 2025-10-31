import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, useNavigation, useSubmit, useNavigate } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { Page } from "@shopify/polaris";
import React, { useState } from 'react';
import { prisma } from '../db.server';
import { getOrCreateMerchant } from '../utils/merchant.server';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import Loader from '../components/ui/Loader';
import QRCodeEditor from '../components/qr/QRCodeEditor';
import BatchExportModal from '../components/qr/BatchExportModal';
import { formatNumber, formatDate, formatCurrency } from '../utils/formatters';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuickNotifications } from '../components/ui/NotificationSystem';
import { Tooltip } from '../components/ui/Tooltip';
import { FEATURES } from '../config/features';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Calendar,
  Target,
  DollarSign,
  QrCode,
  TrendingUp,
  ArrowUpRight,
  Clock,
  Check,
  AlertCircle,
  Play,
  Pause,
  BarChart3,
  Activity,
  Zap,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Settings,
  Gift,
  Download,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { StyledQRCode } from '../components/qr/StyledQRCode';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  
  const merchant = await getOrCreateMerchant(session.shop, session.accessToken);
  
  // Get QR codes with analytics
  const qrCodes = await prisma.qRCode.findMany({
    where: { merchantId: merchant.id },
    include: {
      campaign: true,
      analytics: {
        select: {
          type: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Get campaigns for dropdown
  const campaigns = await prisma.campaign.findMany({
    where: { merchantId: merchant.id },
    select: { id: true, name: true },
  });

  // Get merchant stats
  const stats = await prisma.analyticsEvent.groupBy({
    by: ['type'],
    where: {
      qr: { merchantId: merchant.id },
    },
    _count: { type: true },
  });

  return json({
    shop: session.shop,
    merchant,
    qrCodes,
    campaigns,
    stats,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const merchant = await getOrCreateMerchant(session.shop, session.accessToken);
  
  const formData = await request.formData();
  const action = formData.get("action") as string;

  try {
    switch (action) {
      case "create": {
        // Plan limits check removed - simplified for basic functionality

        const title = formData.get("title") as string;
        const destination = formData.get("destination") as string;
        const type = formData.get("type") as string;
        const color = formData.get("color") as string;
        const campaignId = formData.get("campaignId") as string;

        const qrCode = await prisma.qRCode.create({
          data: {
            merchantId: merchant.id,
            title,
            destination,
            type: type as any,
            color,
            campaignId: campaignId || null,
            slug: title.toLowerCase().replace(/\s+/g, '-'),
          },
        });

        return json({ success: true, qrCode });
      }

      case "update": {
        const id = formData.get("id") as string;
        const title = formData.get("title") as string;
        const destination = formData.get("destination") as string;
        const type = formData.get("type") as string;
        const color = formData.get("color") as string;
        const active = formData.get("active") === "true";

        const qrCode = await prisma.qRCode.update({
          where: { id },
          data: {
            title,
            destination,
            type: type as any,
            color,
            active,
          },
        });

        return json({ success: true, qrCode });
      }

      case "delete": {
        const id = formData.get("id") as string;

        try {
          // First, delete all analytics events related to this QR code
          await prisma.analyticsEvent.deleteMany({
            where: { qrId: id },
          });

          // Then delete the QR code
          await prisma.qRCode.delete({
            where: { id },
          });

          return json({ success: true });
        } catch (error) {
          console.error("Error deleting QR code:", error);
          
          // If there are still foreign key constraints, try to deactivate instead
          await prisma.qRCode.update({
            where: { id },
            data: { active: false },
          });

          return json({ success: true, message: "QR code deactivated instead of deleted due to constraints" });
        }
      }

      case "toggle": {
        const id = formData.get("id") as string;
        const active = formData.get("active") === "true";

        const qrCode = await prisma.qRCode.update({
          where: { id },
          data: { active },
        });

        return json({ success: true, qrCode });
      }

      default:
        return json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("QR Manager action error:", error);
    return json({ error: "An error occurred" }, { status: 500 });
  }
};

export default function QRManagerRoute() {
  const { shop, merchant, qrCodes, campaigns, stats } = useLoaderData<typeof loader>();
  const { success: notifySuccess, error: notifyError, info: notifyInfo } = useQuickNotifications();
  
  // Generate scan URL for QR code preview
  const generateScanURL = (qr: any) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';
    
    // Use the QR code ID for reliable identification
    return `${baseUrl}/api/scan/${qr.id}`;
  };

  // Generate destination URL based on type and input
  const generateDestination = (type: string, input: string) => {
    if (!input) return '';
    
    switch (type) {
      case 'PRODUCT':
        return `https://${shop}/products/${input}`;
      case 'CAMPAIGN':
        // For campaign QR codes, store the campaign ID
        return input;
      case 'VIDEO':
        return input.startsWith('http') ? input : `https://youtube.com/watch?v=${input}`;
      case 'LOYALTY':
        // For loyalty QR codes, we'll use our custom loyalty page
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        return `${baseUrl}/loyalty/${input}`;
      default:
        return input.startsWith('http') ? input : `https://${input}`;
    }
  };

  // Extract input value from destination URL for editing
  const extractInputFromDestination = (type: string, destination: string) => {
    switch (type) {
      case 'PRODUCT':
        return destination.replace(`https://${shop}/products/`, '');
      case 'CAMPAIGN':
        // For campaign QR codes, the destination is the campaign ID
        return destination;
      case 'LOYALTY':
        // Extract the loyalty program name from the destination URL
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        return destination.replace(`${baseUrl}/loyalty/`, '');
      case 'VIDEO':
        if (destination.includes('youtube.com/watch?v=')) {
          return destination.replace('https://youtube.com/watch?v=', '');
        }
        return destination;
      default:
        return destination;
    }
  };
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submit = useSubmit();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingQR, setEditingQR] = useState<any>(null);
  const [destinationInput, setDestinationInput] = useState('');
  const [isBatchExportOpen, setIsBatchExportOpen] = useState(false);
  const [selectedQRCodes, setSelectedQRCodes] = useState<string[]>([]);
  const [newQRData, setNewQRData] = useState({
    title: '',
    destination: '',
    type: 'LINK',
    color: '#007b5c',
    campaignId: '',
  });


  const filteredQRCodes = qrCodes.filter(qr => {
    const matchesSearch = qr.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         qr.destination.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || qr.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleCreateQR = async () => {
    const formData = new FormData();
    formData.append("action", "create");
    formData.append("title", newQRData.title);
    formData.append("destination", newQRData.destination);
    formData.append("type", newQRData.type);
    formData.append("color", newQRData.color);
    formData.append("campaignId", newQRData.campaignId);

    submit(formData, { method: "post" });
    setIsCreateModalOpen(false);
    setNewQRData({
      title: '',
      destination: '',
      type: 'LINK',
      color: '#007b5c',
      campaignId: '',
    });
  };

  const handleEditQR = (qr: any) => {
    setEditingQR(qr);
    // Extract the input value from the destination URL for editing
    const inputValue = extractInputFromDestination(qr.type, qr.destination);
    setDestinationInput(inputValue);
    setIsEditModalOpen(true);
  };

  const handleUpdateQR = async () => {
    // Generate the destination URL based on type and input
    const generatedDestination = generateDestination(editingQR.type, destinationInput);
    
    const formData = new FormData();
    formData.append("action", "update");
    formData.append("id", editingQR.id);
    formData.append("title", editingQR.title);
    formData.append("destination", generatedDestination);
    formData.append("type", editingQR.type);
    formData.append("color", editingQR.color);
    formData.append("active", editingQR.active.toString());

    submit(formData, { method: "post" });
    setIsEditModalOpen(false);
    setEditingQR(null);
    setDestinationInput('');
  };

  const handleDeleteQR = async (id: string) => {
    notifyInfo('Suppression en cours...', 'Suppression du QR code, veuillez patienter.');
    
    const formData = new FormData();
    formData.append("action", "delete");
    formData.append("id", id);

    submit(formData, { method: "post" });
  };

  const handleToggleQR = async (id: string, active: boolean) => {
    notifyInfo('Modification en cours...', `${active ? 'Activation' : 'Désactivation'} du QR code...`);
    
    const formData = new FormData();
    formData.append("action", "toggle");
    formData.append("id", id);
    formData.append("active", (!active).toString());

    submit(formData, { method: "post" });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'LINK': return <ExternalLink className="h-4 w-4" />;
      case 'PRODUCT': return <Target className="h-4 w-4" />;
      case 'VIDEO': return <Play className="h-4 w-4" />;
      case 'LOYALTY': return <Zap className="h-4 w-4" />;
      case 'CAMPAIGN': return <BarChart3 className="h-4 w-4" />;
      default: return <QrCode className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'LINK': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PRODUCT': return 'bg-green-100 text-green-800 border-green-200';
      case 'VIDEO': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'LOYALTY': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CAMPAIGN': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const statsCards = [
    {
      name: 'QR Codes créés',
      value: qrCodes.length,
      change: '+2',
      changeType: 'positive' as const,
      icon: QrCode,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      name: 'Scans totaux',
      value: qrCodes.reduce((sum, qr) => sum + qr.scanCount, 0),
      change: '+15%',
      changeType: 'positive' as const,
      icon: TrendingUp,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      name: 'QR actifs',
      value: qrCodes.filter(qr => qr.active).length,
      change: '+1',
      changeType: 'positive' as const,
      icon: Activity,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      name: 'Campagnes',
      value: campaigns.length,
      change: '+1',
      changeType: 'positive' as const,
      icon: BarChart3,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
  ];

  if (navigation.state === "loading") {
    return (
      <Page>
        <Loader />
      </Page>
    );
  }

  return (
    <Page>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-4xl font-bold ${false ? 'text-white' : 'text-gray-900'}`}>
                Gestionnaire QR
              </h1>
              <p className={`mt-2 text-lg ${false ? 'text-gray-300' : 'text-gray-600'}`}>
                Gérez tous vos QR codes et leurs performances
              </p>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau QR Code
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {statsCards.map((stat, index) => (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="group"
            >
              <Card className={`${false ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-lg hover:shadow-xl transition-all duration-300`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${false ? 'text-gray-400' : 'text-gray-600'}`}>
                        {stat.name}
                      </p>
                      <p className={`text-3xl font-bold mt-2 ${false ? 'text-white' : 'text-gray-900'}`}>
                        {formatNumber(stat.value)}
                      </p>
                      <div className="flex items-center mt-2">
                        <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                        <span className="text-sm text-green-600 font-medium">{stat.change}</span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                      <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4 mb-8">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher des QR codes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 ${false ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
              />
            </div>
          </div>
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={`w-40 ${false ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
          >
            <option value="all">Tous les types</option>
            <option value="LINK">Lien</option>
            <option value="PRODUCT">Produit</option>
            <option value="VIDEO">Vidéo</option>
            <option value="LOYALTY">Fidélité</option>
            <option value="CAMPAIGN">Campagne</option>
          </Select>
          <Button
            variant="outline"
            onClick={() => setIsBatchExportOpen(true)}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export en lot
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/app/conversion-analytics')}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </Button>
        </div>

        {/* QR Codes Grid */}
        {filteredQRCodes.length === 0 ? (
          <EmptyState
            icon={<QrCode className="h-12 w-12" />}
            title="Aucun QR code trouvé"
            description="Créez votre premier QR code pour commencer"
            action={{
              label: "Créer un QR code",
              onClick: () => setIsCreateModalOpen(true)
            }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredQRCodes.map((qr, index) => (
              <motion.div
                key={qr.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="group"
              >
                <Card className={`${false ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-lg hover:shadow-xl transition-all duration-300`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className={`text-lg font-semibold mb-1 ${false ? 'text-white' : 'text-gray-900'}`}>
                          {qr.title}
                        </h3>
                        <p className={`text-sm mb-3 ${false ? 'text-gray-400' : 'text-gray-500'}`}>
                          {qr.destination}
                        </p>
                        <div className="flex items-center space-x-2">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(qr.type)}`}>
                            {getTypeIcon(qr.type)}
                            <span className="ml-1">{qr.type}</span>
                          </div>
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                            qr.active 
                              ? 'bg-green-100 text-green-800 border-green-200' 
                              : 'bg-gray-100 text-gray-800 border-gray-200'
                          }`}>
                            {qr.active ? <Check className="h-3 w-3 mr-1" /> : <Pause className="h-3 w-3 mr-1" />}
                            {qr.active ? 'Actif' : 'Inactif'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditQR(qr)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/app/upsell/${qr.id}`)}
                          className="h-8 w-8 p-0"
                          title="Configurer l'upsell/cross-sell"
                        >
                          <Gift className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleQR(qr.id, qr.active)}
                          className="h-8 w-8 p-0"
                        >
                          {qr.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteQR(qr.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* QR Code Stats */}
                    <div className="grid grid-cols-2 gap-4 text-center mb-4">
                      <div>
                        <p className={`text-2xl font-bold ${false ? 'text-white' : 'text-gray-900'}`}>
                          {formatNumber(qr.scanCount)}
                        </p>
                        <p className={`text-xs ${false ? 'text-gray-400' : 'text-gray-500'}`}>Scans</p>
                      </div>
                      <div>
                        <p className={`text-2xl font-bold ${false ? 'text-white' : 'text-gray-900'}`}>
                          {qr.analytics.length}
                        </p>
                        <p className={`text-xs ${false ? 'text-gray-400' : 'text-gray-500'}`}>Événements</p>
                      </div>
                    </div>

                    {/* QR Code Info */}
                    <div className={`space-y-2 text-sm pt-4 border-t ${false ? 'border-gray-700' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between">
                        <span className={`${false ? 'text-gray-400' : 'text-gray-500'}`}>
                          <Calendar className="h-4 w-4 inline mr-1" />
                          Créé le
                        </span>
                        <span className={`font-medium ${false ? 'text-white' : 'text-gray-900'}`}>
                          {formatDate(qr.createdAt, 'DD/MM/YYYY')}
                        </span>
                      </div>
                      {qr.campaign && (
                        <div className="flex items-center justify-between">
                          <span className={`${false ? 'text-gray-400' : 'text-gray-500'}`}>
                            <BarChart3 className="h-4 w-4 inline mr-1" />
                            Campagne
                          </span>
                          <span className={`font-medium ${false ? 'text-white' : 'text-gray-900'}`}>
                            {qr.campaign.name}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* QR Code Preview */}
                    <div className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-sm font-medium ${false ? 'text-white' : 'text-gray-800'}`}>
                          <QrCode className="h-4 w-4 inline mr-1" />
                          Aperçu QR
                        </span>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => {
                              navigator.clipboard.writeText(generateScanURL(qr));
                              // Vous pourriez ajouter une notification ici
                            }}
                            title="Copier l'URL"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={async () => {
                              try {
                                // Find the preview container for this QR code
                                const previewContainer = document.querySelector(`[data-qr-id="${qr.id}"]`) as HTMLElement;
                                if (!previewContainer) {
                                  console.error('Impossible de trouver le conteneur de preview');
                                  return;
                                }

                                // Use html2canvas to capture the entire preview container with all customizations
                                const html2canvas = (await import('html2canvas')).default;
                                const canvas = await html2canvas(previewContainer, {
                                  backgroundColor: (qr.backgroundColor as string) || '#ffffff',
                                  scale: 4, // Very high quality for perfect resolution
                                  logging: false,
                                  useCORS: true,
                                  allowTaint: true,
                                  windowWidth: previewContainer.scrollWidth,
                                  windowHeight: previewContainer.scrollHeight,
                                });

                                // Create download link with maximum quality
                                const link = document.createElement('a');
                                link.download = `qr-code-${qr.title.replace(/\s+/g, '-')}.png`;
                                link.href = canvas.toDataURL('image/png', 1.0); // Maximum quality
                                link.click();
                              } catch (err) {
                                console.error('Erreur lors du téléchargement:', err);
                                notifyError('Erreur de téléchargement', 'Impossible de télécharger le QR code.');
                              }
                            }}
                            title="Télécharger le QR code"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-center">
                        <div 
                          className="p-4 bg-white rounded-lg shadow-sm flex items-center justify-center" 
                          data-qr-id={qr.id}
                          style={{ 
                            backgroundColor: (qr.backgroundColor as string) || '#ffffff',
                            minHeight: '280px',
                            minWidth: '280px'
                          }}
                        >
                          <StyledQRCode
                            value={generateScanURL(qr)}
                            size={256}
                            foregroundColor={(qr.foregroundColor as string) || (qr.color as string) || '#000000'}
                            backgroundColor={(qr.backgroundColor as string) || '#ffffff'}
                            backgroundImage={(qr.backgroundImage as string) || undefined}
                            logo={(qr.logoUrl as string) || undefined}
                            logoSize={((qr.logoStyle as any)?.enabled && (qr.logoStyle as any)?.size) ? (qr.logoStyle as any).size : 0}
                            logoBackground={((qr as any).logoBackground?.enabled) ? {
                              color: (qr as any).logoBackground.color || '#FFFFFF',
                              shape: (qr as any).logoBackground.shape || 'circle',
                              padding: (qr as any).logoBackground.padding || 10
                            } : undefined}
                            frameStyle={(qr.frameStyle as any) || { enabled: false }}
                            designOptions={(qr.designOptions as any) || {
                              pattern: 'default',
                              marker: 'default',
                              centerDotStyle: 'default',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Créer un nouveau QR code"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titre du QR code
              </label>
              <Input
                value={newQRData.title}
                onChange={(e) => setNewQRData({ ...newQRData, title: e.target.value })}
                placeholder="Mon QR code"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destination
              </label>
              <Input
                value={newQRData.destination}
                onChange={(e) => setNewQRData({ ...newQRData, destination: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <Select
                value={newQRData.type}
                onChange={(e) => setNewQRData({ ...newQRData, type: e.target.value })}
                disabled={!FEATURES.FIDELITY_ENABLED && newQRData.type === 'LOYALTY'}
              >
                <option value="LINK">Lien</option>
                <option value="PRODUCT">Produit</option>
                <option value="LOYALTY" disabled={!FEATURES.FIDELITY_ENABLED}>
                  Fidélité {!FEATURES.FIDELITY_ENABLED ? '(Bientôt disponible)' : ''}
                </option>
                <option value="CAMPAIGN">Campagne</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Couleur
              </label>
              <Input
                type="color"
                value={newQRData.color}
                onChange={(e) => setNewQRData({ ...newQRData, color: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Campagne (optionnel)
              </label>
              <Select
                value={newQRData.campaignId}
                onChange={(e) => setNewQRData({ ...newQRData, campaignId: e.target.value })}
              >
                <option value="">Aucune campagne</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleCreateQR}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0"
              >
                Créer
              </Button>
            </div>
          </div>
        </Modal>

        {/* Edit Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Modifier le QR code"
        >
          {editingQR && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre du QR code
                </label>
                <Input
                  value={editingQR.title}
                  onChange={(e) => setEditingQR({ ...editingQR, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <Select
                  value={editingQR.type}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setEditingQR({ ...editingQR, type: newType });
                    // Update destination when type changes
                    const newDestination = generateDestination(newType, destinationInput);
                    setEditingQR((prev: any) => ({ ...prev, destination: newDestination }));
                  }}
                >
                  <option value="LINK">Lien</option>
                  <option value="PRODUCT">Produit</option>
                  <option value="VIDEO">Vidéo</option>
                  <option value="LOYALTY">Fidélité</option>
                  <option value="CAMPAIGN">Campagne</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editingQR.type === 'PRODUCT' && 'Handle du produit'}
                  {editingQR.type === 'CAMPAIGN' && 'ID de la campagne'}
                  {editingQR.type === 'VIDEO' && 'URL de la vidéo ou ID YouTube'}
                  {editingQR.type === 'LOYALTY' && 'Nom du programme de fidélité'}
                  {editingQR.type === 'LINK' && 'URL de destination'}
                </label>
                <Input
                  value={destinationInput}
                  onChange={(e) => {
                    const newInput = e.target.value;
                    setDestinationInput(newInput);
                    // Update destination in real-time
                    const newDestination = generateDestination(editingQR.type, newInput);
                    setEditingQR((prev: any) => ({ ...prev, destination: newDestination }));
                  }}
                  placeholder={
                    editingQR.type === 'PRODUCT' ? 'ex: mon-produit'
                    : editingQR.type === 'CAMPAIGN' ? 'ex: campaign-id-123'
                    : editingQR.type === 'VIDEO' ? 'ex: dQw4w9WgXcQ ou https://youtube.com/watch?v=...'
                    : editingQR.type === 'LOYALTY' ? 'ex: programme-fidelite'
                    : 'ex: https://example.com'
                  }
                />
                {editingQR.destination && (
                  <p className="text-xs text-gray-500 mt-1">
                    Destination finale: {editingQR.destination}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Couleur
                </label>
                <Input
                  type="color"
                  value={editingQR.color}
                  onChange={(e) => setEditingQR({ ...editingQR, color: e.target.value })}
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Annuler
                </Button>
                <Button 
                  onClick={handleUpdateQR}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0"
                >
                  Sauvegarder
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Batch Export Modal */}
        <BatchExportModal
          isOpen={isBatchExportOpen}
          onClose={() => {
            setIsBatchExportOpen(false);
            setSelectedQRCodes([]);
          }}
          qrCodes={qrCodes}
          selectedQRCodes={selectedQRCodes}
          onSelectionChange={setSelectedQRCodes}
        />
      </div>
    </Page>
  );
}