// Jest setup file
require('dotenv').config({ path: '.env.test' });

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/qrflow_test';
process.env.SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY || 'test-api-key';
process.env.SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || 'test-api-secret';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret';

// Global test utilities
global.testUtils = {
  createTestMerchant: async () => {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    return await prisma.merchant.create({
      data: {
        shopifyDomain: 'test-shop.myshopify.com',
        accessToken: 'test-access-token',
        plan: 'FREE',
      },
    });
  },
  
  createTestQRCode: async (merchantId) => {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    return await prisma.qRCode.create({
      data: {
        merchantId,
        title: 'Test QR Code',
        slug: 'test-qr-code',
        destination: 'https://example.com',
        type: 'LINK',
        color: '#000000',
      },
    });
  },
  
  cleanup: async () => {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    await prisma.analyticsEvent.deleteMany();
    await prisma.qRCode.deleteMany();
    await prisma.campaign.deleteMany();
    await prisma.loyaltyProgram.deleteMany();
    await prisma.customerPoints.deleteMany();
    await prisma.webhookLog.deleteMany();
    await prisma.rateLimit.deleteMany();
    await prisma.merchant.deleteMany();
    
    await prisma.$disconnect();
  },
};




