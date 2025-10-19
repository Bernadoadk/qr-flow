import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { Page } from "@shopify/polaris";
import React, { useState, useEffect } from 'react';
import { prisma } from '../db.server';
import { getOrCreateMerchant } from '../utils/merchant.server';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { formatNumber, formatPercentage, formatDate } from '../utils/formatters';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  Eye,
  Target,
  Users,
  MapPin,
  Clock,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Layers,
  TrendingUp as TrendingUpIcon,
  MousePointer,
  ShoppingCart,
  ExternalLink,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  
  const merchant = await getOrCreateMerchant(session.shop, session.accessToken);
  
  // Get analytics data for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get daily analytics
  const dailyAnalytics = await prisma.analyticsEvent.groupBy({
    by: ['createdAt'],
    where: {
      qr: { merchantId: merchant.id },
      createdAt: { gte: thirtyDaysAgo },
    },
    _count: { type: true },
    orderBy: { createdAt: 'asc' },
  });

  // Get analytics by type
  const analyticsByType = await prisma.analyticsEvent.groupBy({
    by: ['type'],
    where: {
      qr: { merchantId: merchant.id },
      createdAt: { gte: thirtyDaysAgo },
    },
    _count: { type: true },
  });

  // Get top QR codes
  const topQRCodes = await prisma.qRCode.findMany({
    where: { merchantId: merchant.id },
    include: {
      analytics: {
        where: {
          createdAt: { gte: thirtyDaysAgo },
        },
        select: {
          type: true,
          createdAt: true,
        },
      },
    },
    orderBy: { scanCount: 'desc' },
    take: 10,
  });

  // Get device analytics
  const deviceAnalytics = await prisma.analyticsEvent.findMany({
    where: {
      qr: { merchantId: merchant.id },
      createdAt: { gte: thirtyDaysAgo },
    },
    select: {
      meta: true,
    },
  });

  // Get country analytics
  const countryAnalytics = await prisma.analyticsEvent.findMany({
    where: {
      qr: { merchantId: merchant.id },
      createdAt: { gte: thirtyDaysAgo },
    },
    select: {
      meta: true,
    },
  });

  // Process daily analytics data
  const dailyData = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const dayAnalytics = dailyAnalytics.filter(analytics => {
      const analyticsDate = new Date(analytics.createdAt);
      return analyticsDate >= dayStart && analyticsDate <= dayEnd;
    });

    dailyData.push({
      date: date.toISOString().split('T')[0],
      scans: dayAnalytics.reduce((sum, analytics) => sum + analytics._count.type, 0),
      clicks: Math.floor(Math.random() * 50), // Mock data for now
      conversions: Math.floor(Math.random() * 10), // Mock data for now
    });
  }

  // Process device analytics
  const deviceData = deviceAnalytics.reduce((acc, event) => {
    const device = (event.meta as any)?.device || 'unknown';
    acc[device] = (acc[device] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Process country analytics
  const countryData = countryAnalytics.reduce((acc, event) => {
    const country = (event.meta as any)?.country || 'unknown';
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate summary stats
  const totalScans = analyticsByType.reduce((sum, analytics) => sum + analytics._count.type, 0);
  const totalQRCodes = await prisma.qRCode.count({ where: { merchantId: merchant.id } });
  const activeQRCodes = await prisma.qRCode.count({ where: { merchantId: merchant.id, active: true } });
  const totalCampaigns = await prisma.campaign.count({ where: { merchantId: merchant.id } });

  return json({
    shop: session.shop,
    merchant,
    dailyData,
    analyticsByType,
    topQRCodes,
    deviceData,
    countryData,
    summary: {
      totalScans,
      totalQRCodes,
      activeQRCodes,
      totalCampaigns,
    },
  });
};

export default function AnalyticsRoute() {
  const { shop, merchant, dailyData, analyticsByType, topQRCodes, deviceData, countryData, summary } = useLoaderData<typeof loader>();
  const [period, setPeriod] = useState('30d');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Detect dark mode preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const stats = [
    {
      name: 'Scans totaux',
      value: formatNumber(summary.totalScans),
      change: '+12%',
      changeType: 'positive' as const,
      icon: Eye,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      name: 'QR Codes actifs',
      value: summary.activeQRCodes,
      change: '+2',
      changeType: 'positive' as const,
      icon: Target,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      name: 'Taux de conversion',
      value: '8.5%',
      change: '+1.2%',
      changeType: 'positive' as const,
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      name: 'Campagnes actives',
      value: summary.totalCampaigns,
      change: '+1',
      changeType: 'positive' as const,
      icon: BarChart3,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
  ];

  const deviceChartData = Object.entries(deviceData).map(([device, count]) => ({
    name: device === 'mobile' ? 'Mobile' : device === 'desktop' ? 'Desktop' : device === 'tablet' ? 'Tablet' : 'Autre',
    value: count,
    color: device === 'mobile' ? '#3b82f6' : device === 'desktop' ? '#10b981' : device === 'tablet' ? '#f59e0b' : '#6b7280',
  }));

  const countryChartData = Object.entries(countryData)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([country, count]) => ({
      name: country,
      value: count,
    }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

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
                Analytics
              </h1>
              <p className={`mt-2 text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Analysez les performances de vos QR codes
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className={`w-32 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
              >
                <option value="7d">7 derniers jours</option>
                <option value="30d">30 derniers jours</option>
                <option value="90d">90 derniers jours</option>
              </Select>
              <Button
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Exporter</span>
              </Button>
            </div>
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

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Daily Scans Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-lg`}>
              <CardHeader>
                <CardTitle className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Évolution des scans
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="scans"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Device Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-lg`}>
              <CardHeader>
                <CardTitle className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Répartition par appareil
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={deviceChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {deviceChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Top QR Codes and Country Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top QR Codes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-lg`}>
              <CardHeader>
                <CardTitle className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Top QR Codes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topQRCodes.slice(0, 5).map((qr, index) => (
                    <div key={qr.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {qr.title}
                          </p>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {qr.type}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {formatNumber(qr.scanCount)}
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          scans
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Country Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-lg`}>
              <CardHeader>
                <CardTitle className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Répartition géographique
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={countryChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Analytics by Type */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-lg`}>
            <CardHeader>
              <CardTitle className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Analytics par type d'événement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {analyticsByType.map((analytics, index) => (
                  <div key={analytics.type} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {analytics.type}
                        </p>
                        <p className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {formatNumber(analytics._count.type)}
                        </p>
                      </div>
                      <div className={`p-2 rounded-lg ${COLORS[index % COLORS.length]} bg-opacity-20`}>
                        {analytics.type === 'SCAN' && <Eye className="h-5 w-5 text-blue-600" />}
                        {analytics.type === 'CLICK' && <MousePointer className="h-5 w-5 text-green-600" />}
                        {analytics.type === 'PURCHASE' && <ShoppingCart className="h-5 w-5 text-purple-600" />}
                        {analytics.type === 'REDIRECT' && <ExternalLink className="h-5 w-5 text-orange-600" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Page>
  );
}