import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { Page } from "@shopify/polaris";
import React, { useState, useEffect } from 'react';
import { prisma } from "../db.server";
import { getOrCreateMerchant } from "../utils/merchant.server";
import { AnalyticsService } from "../utils/analytics.server";
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Target,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Eye,
  MousePointer,
  Gift,
  Star,
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  
  const merchant = await getOrCreateMerchant(session.shop, session.accessToken);
  
  // Get conversion analytics for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const conversionAnalytics = await AnalyticsService.getMerchantConversionAnalytics(
    merchant.id,
    { from: thirtyDaysAgo, to: new Date() }
  );

  // Get daily conversion data for the chart
  const dailyData = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const dayAnalytics = await AnalyticsService.getMerchantConversionAnalytics(
      merchant.id,
      { from: dayStart, to: dayEnd }
    );

    dailyData.push({
      date: date.toISOString().split('T')[0],
      scans: dayAnalytics.totalScans,
      conversions: dayAnalytics.totalConversions,
      revenue: dayAnalytics.totalRevenue,
      conversionRate: dayAnalytics.conversionRate,
    });
  }

  return json({
    merchant,
    conversionAnalytics,
    dailyData,
  });
};

export default function ConversionAnalyticsRoute() {
  const { merchant, conversionAnalytics, dailyData } = useLoaderData<typeof loader>();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const stats = [
    {
      title: 'Taux de conversion',
      value: `${conversionAnalytics.conversionRate.toFixed(1)}%`,
      change: '+12.5%',
      changeType: 'positive',
      icon: Target,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Revenus générés',
      value: `€${conversionAnalytics.totalRevenue.toFixed(2)}`,
      change: '+8.2%',
      changeType: 'positive',
      icon: DollarSign,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Panier moyen',
      value: `€${conversionAnalytics.averageOrderValue.toFixed(2)}`,
      change: '+3.1%',
      changeType: 'positive',
      icon: ShoppingCart,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Conversions totales',
      value: conversionAnalytics.totalConversions.toString(),
      change: '+15.3%',
      changeType: 'positive',
      icon: TrendingUp,
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  const funnelData = [
    { name: 'Scans', value: conversionAnalytics.conversionFunnel.scans, color: '#3b82f6' },
    { name: 'Clics', value: conversionAnalytics.conversionFunnel.clicks, color: '#8b5cf6' },
    { name: 'Upsell', value: conversionAnalytics.conversionFunnel.upsellClicks, color: '#10b981' },
    { name: 'Cross-sell', value: conversionAnalytics.conversionFunnel.crossSellClicks, color: '#f59e0b' },
    { name: 'Achats', value: conversionAnalytics.conversionFunnel.purchases, color: '#ef4444' },
  ];

  return (
    <Page>
      <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
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
                  Analytics de Conversion
                </h1>
                <p className={`mt-2 text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Suivez les performances de vos QR codes et optimisez vos conversions
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className={`w-32 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                >
                  <option value="7">7 jours</option>
                  <option value="30">30 jours</option>
                  <option value="90">90 jours</option>
                </Select>
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.title}
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
                          {stat.title}
                        </p>
                        <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {stat.value}
                        </p>
                        <div className="flex items-center mt-2">
                          {stat.changeType === 'positive' ? (
                            <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                          )}
                          <span className={`text-sm font-medium ${
                            stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {stat.change}
                          </span>
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Conversion Trend Chart */}
            <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-lg`}>
              <CardHeader>
                <CardTitle className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <BarChart3 className="h-5 w-5 mr-2 inline" />
                  Tendance des conversions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="conversions" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        name="Conversions"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="scans" 
                        stroke="#8b5cf6" 
                        strokeWidth={2}
                        name="Scans"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Conversion Funnel */}
            <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-lg`}>
              <CardHeader>
                <CardTitle className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Target className="h-5 w-5 mr-2 inline" />
                  Entonnoir de conversion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnelData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={80} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Converting QR Codes */}
          <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} shadow-lg`}>
            <CardHeader>
              <CardTitle className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <Star className="h-5 w-5 mr-2 inline" />
                QR Codes les plus performants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conversionAnalytics.topConvertingQRCodes.map((qr, index) => (
                  <div
                    key={qr.qrId}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{qr.title}</h3>
                        <p className="text-sm text-gray-500">
                          {qr.scans} scans • {qr.conversions} conversions
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {qr.conversionRate.toFixed(1)}%
                        </p>
                        <p className="text-sm text-gray-500">
                          €{qr.revenue.toFixed(2)}
                        </p>
                      </div>
                      <Badge 
                        variant={qr.conversionRate > 10 ? "default" : "secondary"}
                        className={qr.conversionRate > 10 ? "bg-green-100 text-green-800" : ""}
                      >
                        {qr.conversionRate > 10 ? "Excellent" : "Bon"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Page>
  );
}

