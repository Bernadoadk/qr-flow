import dayjs from 'dayjs';
import 'dayjs/locale/fr';

dayjs.locale('fr');

export const formatDate = (date: string | Date, format: string = 'DD/MM/YYYY'): string => {
  return dayjs(date).format(format);
};

export const formatDateTime = (date: string | Date): string => {
  return dayjs(date).format('DD/MM/YYYY HH:mm');
};

export const formatRelativeTime = (date: string | Date): string => {
  return dayjs(date).fromNow();
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('fr-FR').format(num);
};

export const formatCurrency = (amount: number, currency: string = 'EUR'): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const capitalizeFirst = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const formatStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    active: 'Actif',
    inactive: 'Inactif',
    expired: 'Expiré',
    draft: 'Brouillon',
    completed: 'Terminé',
    pending: 'En attente',
    cancelled: 'Annulé',
  };
  
  return statusMap[status] || capitalizeFirst(status);
};

export const formatQRType = (type: string): string => {
  const typeMap: Record<string, string> = {
    product: 'Produit',
    discount: 'Réduction',
    url: 'URL',
    collection: 'Collection',
    campaign: 'Campagne',
    loyalty: 'Fidélité',
  };
  
  return typeMap[type] || capitalizeFirst(type);
};

export const formatTier = (tier: string): string => {
  const tierMap: Record<string, string> = {
    bronze: 'Bronze',
    silver: 'Argent',
    gold: 'Or',
    platinum: 'Platine',
  };
  
  return tierMap[tier] || capitalizeFirst(tier);
};

export const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    active: 'text-green-600 bg-green-100',
    inactive: 'text-gray-600 bg-gray-100',
    expired: 'text-red-600 bg-red-100',
    draft: 'text-yellow-600 bg-yellow-100',
    completed: 'text-blue-600 bg-blue-100',
    pending: 'text-orange-600 bg-orange-100',
    cancelled: 'text-red-600 bg-red-100',
  };
  
  return colorMap[status] || 'text-gray-600 bg-gray-100';
};

export const getTierColor = (tier: string): string => {
  const colorMap: Record<string, string> = {
    bronze: 'text-amber-600 bg-amber-100',
    silver: 'text-gray-600 bg-gray-100',
    gold: 'text-yellow-600 bg-yellow-100',
    platinum: 'text-purple-600 bg-purple-100',
  };
  
  return colorMap[tier] || 'text-gray-600 bg-gray-100';
};
