import { PrismaClient, QRType, Plan } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a sample merchant
  const merchant = await prisma.merchant.upsert({
    where: { shopifyDomain: 'demo-shop.myshopify.com' },
    update: {},
    create: {
      shopifyDomain: 'demo-shop.myshopify.com',
      accessToken: 'demo-access-token',
      plan: Plan.PRO,
      settings: {
        theme: 'light',
        primaryColor: '#007b5c',
        notifications: {
          email: true,
          push: false,
        },
      },
    },
  });

  console.log('✅ Created merchant:', merchant.shopifyDomain);

  // Create sample campaigns
  const campaign1 = await prisma.campaign.create({
    data: {
      merchantId: merchant.id,
      name: 'Black Friday 2024',
      description: 'Campagne spéciale Black Friday avec QR codes sur tous les produits',
      startDate: new Date('2024-11-20'),
      endDate: new Date('2024-11-30'),
      status: 'active',
    },
  });

  const campaign2 = await prisma.campaign.create({
    data: {
      merchantId: merchant.id,
      name: 'Lancement Produit Premium',
      description: 'Promotion du nouveau produit premium avec QR codes interactifs',
      startDate: new Date('2024-12-01'),
      endDate: new Date('2024-12-31'),
      status: 'active',
    },
  });

  console.log('✅ Created campaigns');

  // Create sample QR codes
  const qrCodes = await Promise.all([
    prisma.qRCode.create({
      data: {
        merchantId: merchant.id,
        title: 'Produit Premium - Black Friday',
        slug: 'premium-bf2024',
        destination: 'https://demo-shop.myshopify.com/products/premium-product',
        type: QRType.PRODUCT,
        color: '#007b5c',
        scanCount: 2450,
        campaignId: campaign1.id,
        style: {
          shape: 'rounded',
          dots: 'square',
          margin: 20,
        },
      },
    }),
    prisma.qRCode.create({
      data: {
        merchantId: merchant.id,
        title: 'Guide d\'utilisation',
        slug: 'guide-usage',
        destination: 'https://demo-shop.myshopify.com/pages/guide',
        type: QRType.LINK,
        color: '#6366f1',
        scanCount: 1800,
        style: {
          shape: 'circle',
          dots: 'circle',
          margin: 15,
        },
      },
    }),
    prisma.qRCode.create({
      data: {
        merchantId: merchant.id,
        title: 'Support client',
        slug: 'support',
        destination: 'https://demo-shop.myshopify.com/pages/contact',
        type: QRType.LINK,
        color: '#10b981',
        scanCount: 1200,
      },
    }),
    prisma.qRCode.create({
      data: {
        merchantId: merchant.id,
        title: 'Newsletter',
        slug: 'newsletter',
        destination: 'https://demo-shop.myshopify.com/pages/newsletter',
        type: QRType.LINK,
        color: '#f59e0b',
        scanCount: 950,
        campaignId: campaign2.id,
      },
    }),
  ]);

  console.log('✅ Created QR codes');

  // Create loyalty program
  const loyaltyProgram = await prisma.loyaltyProgram.create({
    data: {
      merchantId: merchant.id,
      name: 'Programme de fidélité QR Connect',
      description: 'Gagnez des points à chaque scan de QR code',
      pointsPerScan: 10,
      active: true,
      rewards: {
        tiers: [
          { name: 'Bronze', minPoints: 0, maxPoints: 999, discount: 5 },
          { name: 'Silver', minPoints: 1000, maxPoints: 2499, discount: 10 },
          { name: 'Gold', minPoints: 2500, maxPoints: 9999, discount: 15 },
          { name: 'Platinum', minPoints: 10000, maxPoints: 99999, discount: 20 },
        ],
        rewards: [
          { points: 100, reward: 'Réduction 5%' },
          { points: 500, reward: 'Livraison gratuite' },
          { points: 1000, reward: 'Réduction 10%' },
          { points: 2500, reward: 'Produit gratuit' },
        ],
      },
    },
  });

  console.log('✅ Created loyalty program');

  // Create sample analytics events
  const analyticsEvents = [];
  const eventTypes = ['SCAN', 'REDIRECT', 'PURCHASE', 'CLICK'] as const;
  
  for (let i = 0; i < 100; i++) {
    const qrCode = qrCodes[Math.floor(Math.random() * qrCodes.length)];
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Last 30 days

    analyticsEvents.push({
      qrId: qrCode.id,
      type: eventType,
      meta: {
        ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        country: ['France', 'Belgique', 'Suisse', 'Canada'][Math.floor(Math.random() * 4)],
        device: ['mobile', 'desktop', 'tablet'][Math.floor(Math.random() * 3)],
      },
      createdAt,
    });
  }

  await prisma.analyticsEvent.createMany({
    data: analyticsEvents,
  });

  console.log('✅ Created analytics events');

  // Create sample customer points
  const customerPoints = [];
  for (let i = 0; i < 20; i++) {
    customerPoints.push({
      merchantId: merchant.id,
      customerId: `customer_${i + 1}`,
      points: Math.floor(Math.random() * 5000),
      meta: {
        lastScanAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        source: 'qr_scan',
      },
    });
  }

  await prisma.customerPoints.createMany({
    data: customerPoints,
  });

  console.log('✅ Created customer points');

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
