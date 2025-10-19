#!/usr/bin/env node

/**
 * Script de configuration automatique des variables d'environnement
 */

const fs = require('fs');
const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function generateSecret() {
  return crypto.randomBytes(32).toString('hex');
}

async function main() {
  console.log('🔧 QRFlow - Configuration des Variables d\'Environnement');
  console.log('=======================================================\n');

  const env = {};

  // Variables obligatoires
  console.log('📋 Variables OBLIGATOIRES:');
  console.log('==========================\n');

  env.DATABASE_URL = await question('🗄️  DATABASE_URL (PostgreSQL): ');
  env.SHOPIFY_API_KEY = await question('🛍️  SHOPIFY_API_KEY: ');
  env.SHOPIFY_API_SECRET = await question('🔐 SHOPIFY_API_SECRET: ');
  env.SCOPES = await question('📝 SCOPES (défaut: read_products,write_products,read_orders,write_orders): ') || 'read_products,write_products,read_orders,write_orders';
  env.SHOPIFY_APP_URL = await question('🌐 SHOPIFY_APP_URL (pour dev: https://your-ngrok.ngrok.io): ');

  // Générer les secrets automatiquement
  env.SESSION_SECRET = generateSecret();
  env.HMAC_SECRET = generateSecret();
  env.CRON_SECRET = generateSecret();

  console.log('\n✅ Secrets générés automatiquement');

  // Variables optionnelles
  console.log('\n📋 Variables OPTIONNELLES:');
  console.log('==========================\n');

  console.log('📸 Images stockées en Base64 dans la base de données (gratuit)');

  const useEmail = await question('📧 Configurer l\'envoi d\'emails ? (y/n): ');
  if (useEmail.toLowerCase() === 'y') {
    env.SENDGRID_API_KEY = await question('📮 SENDGRID_API_KEY: ');
    env.SENDGRID_FROM_EMAIL = await question('📧 SENDGRID_FROM_EMAIL: ');
  }

  const useAdvancedGeo = await question('🌍 Géolocalisation avancée (ipinfo.io) ? (y/n): ');
  if (useAdvancedGeo.toLowerCase() === 'y') {
    env.IPINFO_API_KEY = await question('🗺️  IPINFO_API_KEY: ');
  }

  // Variables par défaut
  env.NODE_ENV = 'development';
  env.PORT = '3000';
  env.RATE_LIMIT_WINDOW_MS = '60000';
  env.RATE_LIMIT_MAX_REQUESTS = '100';

  // Créer le fichier .env
  const envContent = Object.entries(env)
    .map(([key, value]) => `${key}="${value}"`)
    .join('\n');

  fs.writeFileSync('.env', envContent);

  console.log('\n🎉 Configuration terminée !');
  console.log('==========================\n');

  console.log('📁 Fichier .env créé avec les variables suivantes:');
  Object.keys(env).forEach(key => {
    console.log(`✅ ${key}`);
  });

  console.log('\n📋 Prochaines étapes:');
  console.log('1. Vérifiez le fichier .env');
  console.log('2. Lancez: npm run quick-start');
  console.log('3. Testez: npm run test:local');
  console.log('4. Démarrez: npm run dev');

  console.log('\n🔗 Liens utiles:');
  console.log('- Base de données: https://neon.tech (gratuit)');
  console.log('- Shopify Partner: https://partners.shopify.com');
  console.log('- Ngrok: https://ngrok.com (pour tunnel local)');
  console.log('- Vercel: https://vercel.com (déploiement gratuit)');

  rl.close();
}

main().catch(console.error);
