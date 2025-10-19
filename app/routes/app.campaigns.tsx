import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, useNavigation, useSubmit } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { Page } from "@shopify/polaris";
import React, { useState, useEffect } from 'react';
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
import { formatNumber, formatDate, formatCurrency, formatPercentage } from '../utils/formatters';
import { motion, AnimatePresence } from 'framer-motion';
import CampaignPersonalization from '../components/campaigns/CampaignPersonalization';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Calendar,
  Target,
  DollarSign,
  Megaphone,
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
  Palette,
} from 'lucide-react';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  
  const merchant = await getOrCreateMerchant(session.shop, session.accessToken);
  
  // Get campaigns with QR codes and analytics
  const campaigns = await prisma.campaign.findMany({
    where: { merchantId: merchant.id },
    include: {
      qrcodes: {
        include: {
          analytics: {
            select: {
              type: true,
              createdAt: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Calculate campaign statistics
  const campaignStats = campaigns.map(campaign => {
    const totalScans = campaign.qrcodes.reduce((sum, qr) => sum + qr.scanCount, 0);
    const totalEvents = campaign.qrcodes.reduce((sum, qr) => sum + qr.analytics.length, 0);
    const conversionRate = totalScans > 0 ? (totalEvents / totalScans) * 100 : 0;
    const revenue = totalScans * 5; // Mock revenue calculation

    return {
      ...campaign,
      totalScans,
      totalEvents,
      conversionRate,
      revenue,
    };
  });

  return json({
    shop: session.shop,
    merchant,
    campaigns: campaignStats,
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

        const name = formData.get("name") as string;
        const description = formData.get("description") as string;
        const startDate = formData.get("startDate") as string;
        const endDate = formData.get("endDate") as string;

        const campaign = await prisma.campaign.create({
          data: {
            merchantId: merchant.id,
            name,
            description,
            startDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : null,
            status: 'active',
          },
        });

        return json({ success: true, campaign });
      }

      case "update": {
        const id = formData.get("id") as string;
        const name = formData.get("name") as string;
        const description = formData.get("description") as string;
        const startDate = formData.get("startDate") as string;
        const endDate = formData.get("endDate") as string;
        const status = formData.get("status") as string;

        const campaign = await prisma.campaign.update({
          where: { id },
          data: {
            name,
            description,
            startDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : null,
            status,
          },
        });

        return json({ success: true, campaign });
      }

      case "delete": {
        const id = formData.get("id") as string;

        // Delete associated QR codes first
        await prisma.qRCode.deleteMany({
          where: { campaignId: id },
        });

        // Delete campaign
        await prisma.campaign.delete({
          where: { id },
        });

        return json({ success: true });
      }

      case "toggle": {
        const id = formData.get("id") as string;
        const status = formData.get("status") as string;

        const campaign = await prisma.campaign.update({
          where: { id },
          data: { status },
        });

        return json({ success: true, campaign });
      }

      case "update_personalization": {
        const id = formData.get("id") as string;
        
        // Récupérer toutes les données de personnalisation
        const personalizationData = {
          primaryColor: formData.get("primaryColor") as string,
          secondaryColor: formData.get("secondaryColor") as string,
          backgroundColor: formData.get("backgroundColor") as string,
          logoUrl: formData.get("logoUrl") as string,
          bannerUrl: formData.get("bannerUrl") as string,
          fontFamily: formData.get("fontFamily") as string,
          mainOffer: formData.get("mainOffer") as string,
          ctaText: formData.get("ctaText") as string,
          ctaButtonColor: formData.get("ctaButtonColor") as string,
          targetScans: formData.get("targetScans") ? parseInt(formData.get("targetScans") as string) : null,
          targetSignups: formData.get("targetSignups") ? parseInt(formData.get("targetSignups") as string) : null,
          budget: formData.get("budget") ? parseFloat(formData.get("budget") as string) : null,
          expectedROI: formData.get("expectedROI") ? parseFloat(formData.get("expectedROI") as string) : null,
          googleAnalyticsId: formData.get("googleAnalyticsId") as string,
          mailchimpListId: formData.get("mailchimpListId") as string,
          klaviyoListId: formData.get("klaviyoListId") as string,
          facebookPixelId: formData.get("facebookPixelId") as string,
        };

        const campaign = await prisma.campaign.update({
          where: { id },
          data: personalizationData,
        });

        return json({ success: true, campaign });
      }

      default:
        return json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Campaigns action error:", error);
    return json({ error: "An error occurred" }, { status: 500 });
  }
};

export default function CampaignsRoute() {
  const { shop, merchant, campaigns } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submit = useSubmit();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPersonalizationModalOpen, setIsPersonalizationModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [personalizingCampaign, setPersonalizingCampaign] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [newCampaignData, setNewCampaignData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    // Detect dark mode preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateCampaign = async () => {
    const formData = new FormData();
    formData.append("action", "create");
    formData.append("name", newCampaignData.name);
    formData.append("description", newCampaignData.description);
    formData.append("startDate", newCampaignData.startDate);
    formData.append("endDate", newCampaignData.endDate);

    submit(formData, { method: "post" });
    setIsCreateModalOpen(false);
    setNewCampaignData({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
    });
  };

  const handleEditCampaign = (campaign: any) => {
    setEditingCampaign(campaign);
    setIsEditModalOpen(true);
  };

  const handleUpdateCampaign = async () => {
    const formData = new FormData();
    formData.append("action", "update");
    formData.append("id", editingCampaign.id);
    formData.append("name", editingCampaign.name);
    formData.append("description", editingCampaign.description);
    formData.append("startDate", editingCampaign.startDate);
    formData.append("endDate", editingCampaign.endDate);
    formData.append("status", editingCampaign.status);

    submit(formData, { method: "post" });
    setIsEditModalOpen(false);
    setEditingCampaign(null);
  };

  const handleDeleteCampaign = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette campagne ?')) {
      const formData = new FormData();
      formData.append("action", "delete");
      formData.append("id", id);

      submit(formData, { method: "post" });
    }
  };

  const handleToggleCampaign = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    const formData = new FormData();
    formData.append("action", "toggle");
    formData.append("id", id);
    formData.append("status", newStatus);

    submit(formData, { method: "post" });
  };

  const handlePersonalizeCampaign = (campaign: any) => {
    setPersonalizingCampaign(campaign);
    setIsPersonalizationModalOpen(true);
  };

  const handleSavePersonalization = async (personalizationData: any) => {
    const formData = new FormData();
    formData.append("action", "update_personalization");
    formData.append("id", personalizingCampaign.id);
    
    // Ajouter toutes les données de personnalisation
    Object.entries(personalizationData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    submit(formData, { method: "post" });
    setIsPersonalizationModalOpen(false);
    setPersonalizingCampaign(null);
  };

  const handlePreviewCampaign = () => {
    if (personalizingCampaign) {
      // Ouvrir la page de campagne dans un nouvel onglet
      window.open(`/campaign/${personalizingCampaign.id}`, '_blank');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play className="h-4 w-4" />;
      case 'paused': return <Pause className="h-4 w-4" />;
      case 'ended': return <Check className="h-4 w-4" />;
      case 'draft': return <Edit className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ended': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'draft': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const stats = [
    {
      name: 'Campagnes actives',
      value: campaigns.filter(c => c.status === 'active').length,
      change: '+2',
      changeType: 'positive' as const,
      icon: Megaphone,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      name: 'QR Codes associés',
      value: campaigns.reduce((sum, c) => sum + c.qrcodes.length, 0),
      change: '+5',
      changeType: 'positive' as const,
      icon: Target,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      name: 'Scans totaux',
      value: formatNumber(campaigns.reduce((sum, c) => sum + c.totalScans, 0)),
      change: '+15%',
      changeType: 'positive' as const,
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      name: 'Revenus estimés',
      value: formatCurrency(campaigns.reduce((sum, c) => sum + c.revenue, 0)),
      change: '+12%',
      changeType: 'positive' as const,
      icon: DollarSign,
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
              <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Campagnes
              </h1>
              <p className={`mt-2 text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Gérez vos campagnes marketing QR
              </p>
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle campagne
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="group"
            >
              <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-lg hover:shadow-xl transition-all duration-300`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {stat.name}
                      </p>
                      <p className={`text-3xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {stat.value}
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
                placeholder="Rechercher des campagnes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
              />
            </div>
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`w-40 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="paused">En pause</option>
            <option value="ended">Terminé</option>
            <option value="draft">Brouillon</option>
          </Select>
        </div>

        {/* Campaigns Grid */}
        {filteredCampaigns.length === 0 ? (
          <EmptyState
            icon={<Megaphone className="h-12 w-12" />}
            title="Aucune campagne trouvée"
            description="Créez votre première campagne pour commencer"
            action={{
              label: "Créer une campagne",
              onClick: () => setIsCreateModalOpen(true)
            }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCampaigns.map((campaign, index) => (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="group"
              >
                <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-lg hover:shadow-xl transition-all duration-300`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className={`text-lg font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {campaign.name}
                        </h3>
                        <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {campaign.description}
                        </p>
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(campaign.status)}`}>
                          {getStatusIcon(campaign.status)}
                          <span className="ml-1 capitalize">{campaign.status}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCampaign(campaign)}
                          className="h-8 w-8 p-0"
                          title="Modifier la campagne"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePersonalizeCampaign(campaign)}
                          className="h-8 w-8 p-0"
                          title="Personnaliser la campagne"
                        >
                          <Palette className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleCampaign(campaign.id, campaign.status)}
                          className="h-8 w-8 p-0"
                        >
                          {campaign.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCampaign(campaign.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Campaign Stats */}
                    <div className="grid grid-cols-3 gap-4 text-center mb-4">
                      <div>
                        <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {campaign.qrcodes.length}
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>QR Codes</p>
                      </div>
                      <div>
                        <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {formatNumber(campaign.totalScans)}
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Scans</p>
                      </div>
                      <div>
                        <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {formatPercentage(campaign.conversionRate)}
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Conversion</p>
                      </div>
                    </div>

                    {/* Campaign Dates */}
                    <div className={`space-y-2 text-sm pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between">
                        <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          <Calendar className="h-4 w-4 inline mr-1" />
                          Début
                        </span>
                        <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {formatDate(campaign.startDate, 'DD/MM/YYYY')}
                        </span>
                      </div>
                      {campaign.endDate && (
                        <div className="flex items-center justify-between">
                          <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            <Clock className="h-4 w-4 inline mr-1" />
                            Fin
                          </span>
                          <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {formatDate(campaign.endDate, 'DD/MM/YYYY')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Revenue */}
                    {campaign.revenue > 0 && (
                      <div className={`mt-4 p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-green-50'} border ${isDarkMode ? 'border-gray-600' : 'border-green-200'}`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-green-800'}`}>
                            Revenus estimés
                          </span>
                          <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-green-900'}`}>
                            {formatCurrency(campaign.revenue)}
                          </span>
                        </div>
                      </div>
                    )}
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
          title="Créer une nouvelle campagne"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom de la campagne
              </label>
              <Input
                value={newCampaignData.name}
                onChange={(e) => setNewCampaignData({ ...newCampaignData, name: e.target.value })}
                placeholder="Ma campagne"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <Input
                value={newCampaignData.description}
                onChange={(e) => setNewCampaignData({ ...newCampaignData, description: e.target.value })}
                placeholder="Description de la campagne"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de début
                </label>
                <Input
                  type="date"
                  value={newCampaignData.startDate}
                  onChange={(e) => setNewCampaignData({ ...newCampaignData, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de fin (optionnel)
                </label>
                <Input
                  type="date"
                  value={newCampaignData.endDate}
                  onChange={(e) => setNewCampaignData({ ...newCampaignData, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleCreateCampaign}
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
          title="Modifier la campagne"
        >
          {editingCampaign && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la campagne
                </label>
                <Input
                  value={editingCampaign.name}
                  onChange={(e) => setEditingCampaign({ ...editingCampaign, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Input
                  value={editingCampaign.description}
                  onChange={(e) => setEditingCampaign({ ...editingCampaign, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de début
                  </label>
                  <Input
                    type="date"
                    value={editingCampaign.startDate}
                    onChange={(e) => setEditingCampaign({ ...editingCampaign, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de fin
                  </label>
                  <Input
                    type="date"
                    value={editingCampaign.endDate}
                    onChange={(e) => setEditingCampaign({ ...editingCampaign, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut
                </label>
                <Select
                  value={editingCampaign.status}
                  onChange={(e) => setEditingCampaign({ ...editingCampaign, status: e.target.value })}
                >
                  <option value="draft">Brouillon</option>
                  <option value="active">Actif</option>
                  <option value="paused">En pause</option>
                  <option value="ended">Terminé</option>
                </Select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Annuler
                </Button>
                <Button 
                  onClick={handleUpdateCampaign}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0"
                >
                  Sauvegarder
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Personalization Modal */}
        <Modal
          isOpen={isPersonalizationModalOpen}
          onClose={() => setIsPersonalizationModalOpen(false)}
          title="Personnaliser la campagne"
          size="xl"
        >
          {personalizingCampaign && (
            <CampaignPersonalization
              campaign={personalizingCampaign}
              onSave={handleSavePersonalization}
              onPreview={handlePreviewCampaign}
              isLoading={navigation.state === "submitting"}
            />
          )}
        </Modal>
      </div>
    </Page>
  );
}