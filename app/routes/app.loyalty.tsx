import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, useNavigation, useSubmit } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { Page } from "@shopify/polaris";
import React, { useState, useEffect } from 'react';
import { prisma } from "../db.server";
import { getOrCreateMerchant } from "../utils/merchant.server";
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
import {
  Plus,
  Search,
  Users,
  Star,
  Gift,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  Calendar,
  Award,
  Target,
  Zap,
  Crown,
  Heart,
  Trophy,
  Activity,
  Clock,
  Check,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  
  // Get or create merchant
  const merchant = await getOrCreateMerchant(
    session?.shop || (admin as any).shopifyDomain || (admin as any).shop || (admin as any).domain,
    session?.accessToken
  );

  // Get loyalty programs
  const loyaltyPrograms = await prisma.loyaltyProgram.findMany({
    where: {
      merchantId: merchant.id,
    },
  });

  // Get customer points
  const customerPoints = await prisma.customerPoints.findMany({
    where: {
      merchantId: merchant.id,
    },
  });

  return json({
    shop: session?.shop || (admin as any).shopifyDomain || (admin as any).shop || (admin as any).domain,
    loyaltyPrograms,
    customerPoints,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const action = formData.get("action") as string;

  // Get or create merchant
  const merchant = await getOrCreateMerchant(
    session?.shop || (admin as any).shopifyDomain || (admin as any).shop || (admin as any).domain,
    session?.accessToken
  );

  try {
    switch (action) {
      case "create_loyalty_program": {
        const name = formData.get("name") as string;
        const description = formData.get("description") as string;
        const pointsPerScan = Number(formData.get("pointsPerScan"));
        const pointsPerPurchase = Number(formData.get("pointsPerPurchase"));
        const pointsPerDollar = Number(formData.get("pointsPerDollar"));
        const isActive = formData.get("isActive") === "true";

        const loyaltyProgram = await prisma.loyaltyProgram.create({
          data: {
            name,
            description,
            pointsPerScan,
            active: isActive,
            merchantId: merchant.id,
          },
        });

        return json({ success: true, loyaltyProgram });
      }

      case "update_loyalty_program": {
        const id = formData.get("id") as string;
        const name = formData.get("name") as string;
        const description = formData.get("description") as string;
        const pointsPerScan = Number(formData.get("pointsPerScan"));
        const pointsPerPurchase = Number(formData.get("pointsPerPurchase"));
        const pointsPerDollar = Number(formData.get("pointsPerDollar"));
        const isActive = formData.get("isActive") === "true";

        const loyaltyProgram = await prisma.loyaltyProgram.update({
          where: { id },
          data: {
            name,
            description,
            pointsPerScan,
            active: isActive,
          },
        });

        return json({ success: true, loyaltyProgram });
      }

      case "delete_loyalty_program": {
        const id = formData.get("id") as string;

        await prisma.loyaltyProgram.delete({
          where: { id },
        });

        return json({ success: true });
      }

      case "add_customer_points": {
        const customerId = formData.get("customerId") as string;
        const points = Number(formData.get("points"));
        const name = formData.get("name") as string;
        const tier = formData.get("tier") as string;

        const customerPoints = await prisma.customerPoints.upsert({
          where: {
            id: `${merchant.id}_${customerId}`,
          },
          update: {
            points: {
              increment: points,
            },
            meta: {
              name,
              tier,
              addedManually: true,
              addedAt: new Date().toISOString(),
            },
          },
          create: {
            merchantId: merchant.id,
            customerId,
            points,
            meta: {
              name,
              tier,
              addedManually: true,
              addedAt: new Date().toISOString(),
            },
          },
        });

        return json({ success: true, customerPoints });
      }

      default:
        return json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Loyalty action error:", error);
    return json({ error: "An error occurred" }, { status: 500 });
  }
};

export default function LoyaltyRoute() {
  const { shop, loyaltyPrograms, customerPoints } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [newMemberData, setNewMemberData] = useState({
    name: '',
    email: '',
    tier: 'bronze',
    points: 0
  });

  const isLoading = navigation.state === "loading";
  const submit = useSubmit();

  const handleAddMember = () => {
    if (!newMemberData.name || !newMemberData.email) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Calculate initial points based on tier
    const tierPoints = {
      bronze: 0,
      silver: 100,
      gold: 500,
      platinum: 1000
    };

    const formData = new FormData();
    formData.append("action", "add_customer_points");
    formData.append("customerId", newMemberData.email);
    formData.append("points", (tierPoints[newMemberData.tier as keyof typeof tierPoints] + newMemberData.points).toString());
    formData.append("name", newMemberData.name);
    formData.append("tier", newMemberData.tier);

    submit(formData, { method: "post" });
    
    // Reset form and close modal
    setNewMemberData({ name: '', email: '', tier: 'bronze', points: 0 });
    setIsCreateModalOpen(false);
  };

  useEffect(() => {
    // Detect dark mode preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Show success message when member is added
  useEffect(() => {
    if (actionData && 'success' in actionData && actionData.success) {
      alert('Membre ajouté avec succès !');
    }
  }, [actionData]);

  // Calculate summary stats from real data
  const summary = {
    activeMembers: customerPoints.length,
    totalPoints: customerPoints.reduce((sum, cp) => sum + cp.points, 0),
    redeemedRewards: 0, // This would need to be calculated from actual reward redemptions
    totalValue: customerPoints.reduce((sum, cp) => sum + (cp.points * 0.01), 0), // Assuming 1 point = $0.01
    newMembersThisMonth: customerPoints.filter(cp => {
      const createdAt = new Date(cp.createdAt);
      const now = new Date();
      return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
    }).length,
    averagePointsPerMember: customerPoints.length > 0 ? customerPoints.reduce((sum, cp) => sum + cp.points, 0) / customerPoints.length : 0,
  };

  // Define tiers
  const tiers = [
    { name: 'Bronze', minPoints: 0, maxPoints: 999, color: 'from-amber-500 to-amber-600', bgColor: 'bg-amber-50', iconColor: 'text-amber-600' },
    { name: 'Silver', minPoints: 1000, maxPoints: 2499, color: 'from-gray-400 to-gray-500', bgColor: 'bg-gray-50', iconColor: 'text-gray-600' },
    { name: 'Gold', minPoints: 2500, maxPoints: 9999, color: 'from-yellow-400 to-yellow-500', bgColor: 'bg-yellow-50', iconColor: 'text-yellow-600' },
    { name: 'Platinum', minPoints: 10000, maxPoints: 99999, color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-50', iconColor: 'text-purple-600' },
  ];

  // Transform customer points to members format
  const members = customerPoints.map(cp => {
    const tier = tiers.find(t => cp.points >= t.minPoints && cp.points <= t.maxPoints) || tiers[0];
    return {
      id: cp.id,
      name: cp.customerId || 'Customer',
      email: cp.customerId || 'No email',
      tier: tier.name,
      points: cp.points,
      scans: 0, // This would need to be calculated from analytics
      joinedAt: cp.createdAt,
      lastActivity: cp.updatedAt,
      totalSpent: 0, // This would need to be calculated from orders
      rewardsRedeemed: 0, // This would need to be calculated from redemptions
      avatar: (cp.customerId || 'C').charAt(0).toUpperCase(),
    };
  });

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier = tierFilter === 'all' || member.tier.toLowerCase() === tierFilter.toLowerCase();
    return matchesSearch && matchesTier;
  });

  const getTierInfo = (tier: string) => {
    return tiers.find(t => t.name === tier) || tiers[0];
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'Bronze': return <Award className="h-4 w-4" />;
      case 'Silver': return <Star className="h-4 w-4" />;
      case 'Gold': return <Crown className="h-4 w-4" />;
      case 'Platinum': return <Trophy className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  const stats = [
    {
      name: 'Membres actifs',
      value: formatNumber(summary.activeMembers),
      change: `+${summary.newMembersThisMonth}`,
      changeType: 'positive' as const,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      name: 'Points distribués',
      value: formatNumber(summary.totalPoints),
      change: '+8%',
      changeType: 'positive' as const,
      icon: Star,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
    },
    {
      name: 'Récompenses échangées',
      value: summary.redeemedRewards,
      change: '+15%',
      changeType: 'positive' as const,
      icon: Gift,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      name: 'Valeur totale',
      value: formatCurrency(summary.totalValue),
      change: '+5%',
      changeType: 'positive' as const,
      icon: DollarSign,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
  ];

  if (isLoading) {
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
                  Programme de fidélité
                </h1>
                <p className={`mt-2 text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Gérez votre programme de fidélité QR
                </p>
              </div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau membre
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

          {/* Tiers Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-lg`}>
              <CardHeader>
                <CardTitle className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Niveaux de fidélité
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {tiers.map((tier, index) => {
                    const memberCount = members.filter(m => m.tier === tier.name).length;
                    const percentage = members.length > 0 ? (memberCount / members.length) * 100 : 0;
                    
                    return (
                      <motion.div
                        key={tier.name}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
                      >
                        <div className="flex items-center space-x-3 mb-3">
                          <div className={`p-2 rounded-lg ${tier.bgColor}`}>
                            {getTierIcon(tier.name)}
                          </div>
                          <div>
                            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {tier.name}
                            </h3>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {tier.minPoints} - {tier.maxPoints === 99999 ? '∞' : tier.maxPoints} points
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Membres</span>
                            <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {memberCount}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div
                              className={`bg-gradient-to-r ${tier.color} h-2 rounded-full transition-all duration-1000`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <div className="text-xs text-right">
                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Search and Filters */}
          <div className="flex items-center space-x-4 mb-8">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher des membres..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-10 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                />
              </div>
            </div>
            <Select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className={`w-40 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
            >
              <option value="all">Tous les niveaux</option>
              <option value="bronze">Bronze</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
              <option value="platinum">Platinum</option>
            </Select>
          </div>

          {/* Members Grid */}
          {filteredMembers.length === 0 ? (
            <EmptyState
              icon={<Users className="h-12 w-12" />}
              title="Aucun membre trouvé"
              description="Commencez par ajouter des membres à votre programme"
              action={{
                label: "Ajouter un membre",
                onClick: () => setIsCreateModalOpen(true)
              }}
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredMembers.map((member, index) => {
                const tierInfo = getTierInfo(member.tier);
                
                return (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                    className="group"
                  >
                    <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-lg hover:shadow-xl transition-all duration-300`}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${tierInfo.color} flex items-center justify-center text-white font-bold text-lg`}>
                              {member.avatar}
                            </div>
                            <div>
                              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {member.name}
                              </h3>
                              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {member.email}
                              </p>
                            </div>
                          </div>
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${tierInfo.bgColor} ${tierInfo.iconColor} border-current`}>
                            {getTierIcon(member.tier)}
                            <span className="ml-1">{member.tier}</span>
                          </div>
                        </div>

                        {/* Member Stats */}
                        <div className="grid grid-cols-2 gap-4 text-center mb-4">
                          <div>
                            <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {formatNumber(member.points)}
                            </p>
                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Points</p>
                          </div>
                          <div>
                            <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {member.scans}
                            </p>
                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Scans</p>
                          </div>
                        </div>

                        {/* Member Info */}
                        <div className={`space-y-2 text-sm pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                          <div className="flex items-center justify-between">
                            <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              <Calendar className="h-4 w-4 inline mr-1" />
                              Membre depuis
                            </span>
                            <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {formatDate(member.joinedAt, 'DD/MM/YYYY')}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              <Clock className="h-4 w-4 inline mr-1" />
                              Dernière activité
                            </span>
                            <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {formatDate(member.lastActivity, 'DD/MM/YYYY')}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              <DollarSign className="h-4 w-4 inline mr-1" />
                              Total dépensé
                            </span>
                            <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {formatCurrency(member.totalSpent)}
                            </span>
                          </div>
                        </div>

                        {/* Rewards */}
                        <div className={`mt-4 p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-purple-50'} border ${isDarkMode ? 'border-gray-600' : 'border-purple-200'}`}>
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-purple-800'}`}>
                              <Gift className="h-4 w-4 inline mr-1" />
                              Récompenses échangées
                            </span>
                            <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-purple-900'}`}>
                              {member.rewardsRedeemed}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Create Modal */}
          <Modal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            title="Ajouter un nouveau membre"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du membre *
                </label>
                <Input
                  value={newMemberData.name}
                  onChange={(e) => setNewMemberData({ ...newMemberData, name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <Input
                  type="email"
                  value={newMemberData.email}
                  onChange={(e) => setNewMemberData({ ...newMemberData, email: e.target.value })}
                  placeholder="john@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Niveau initial
                </label>
                <Select
                  value={newMemberData.tier}
                  onChange={(e) => setNewMemberData({ ...newMemberData, tier: e.target.value })}
                >
                  <option value="bronze">Bronze (0 points)</option>
                  <option value="silver">Silver (100 points)</option>
                  <option value="gold">Gold (500 points)</option>
                  <option value="platinum">Platinum (1000 points)</option>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Points bonus (optionnel)
                </label>
                <Input
                  type="number"
                  value={newMemberData.points}
                  onChange={(e) => setNewMemberData({ ...newMemberData, points: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setNewMemberData({ name: '', email: '', tier: 'bronze', points: 0 });
                  }}
                >
                  Annuler
                </Button>
                <Button 
                  onClick={handleAddMember}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0"
                  disabled={isLoading}
                >
                  {isLoading ? "Ajout..." : "Ajouter"}
                </Button>
              </div>
            </div>
          </Modal>
        </div>
    </Page>
  );
}