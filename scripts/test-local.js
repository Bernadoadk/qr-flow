#!/usr/bin/env node

/**
 * Script de test local pour QRFlow
 * Vérifie que toutes les fonctionnalités fonctionnent correctement
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 QRFlow - Test Local');
console.log('=====================\n');

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`✅ ${description}`, 'green');
    return true;
  } else {
    log(`❌ ${description} - Fichier manquant: ${filePath}`, 'red');
    return false;
  }
}

function checkEnvVar(varName, description) {
  if (process.env[varName]) {
    log(`✅ ${description}`, 'green');
    return true;
  } else {
    log(`❌ ${description} - Variable manquante: ${varName}`, 'red');
    return false;
  }
}

// Test 1: Vérifier les fichiers essentiels
log('📁 Vérification des fichiers...', 'blue');
const essentialFiles = [
  ['package.json', 'Configuration npm'],
  ['.env.example', 'Variables d\'environnement exemple'],
  ['prisma/schema.prisma', 'Schema Prisma'],
  ['app/db.server.ts', 'Configuration base de données'],
  ['app/shopify.server.ts', 'Configuration Shopify'],
  ['app/routes/scan.$slug.tsx', 'Route de scan publique'],
  ['app/utils/analytics.server.ts', 'Service analytics'],
  ['app/utils/loyalty.server.ts', 'Service fidélité'],
  ['app/utils/upload.server.ts', 'Service upload'],
  ['app/utils/rateLimit.server.ts', 'Service rate limiting'],
  ['app/utils/security.server.ts', 'Service sécurité'],
  ['app/routes/webhooks.orders.paid.tsx', 'Webhook commandes'],
  ['app/routes/webhooks.app.uninstalled.tsx', 'Webhook désinstallation'],
  ['app/routes/api.uploads.tsx', 'API upload'],
  ['app/routes/api.export.$id.tsx', 'API export'],
  ['app/routes/api.test.tsx', 'API test'],
  ['prisma/seed.ts', 'Script de seed'],
  ['README.md', 'Documentation'],
  ['DEPLOYMENT.md', 'Guide de déploiement'],
  ['vercel.json', 'Configuration Vercel'],
  ['Dockerfile', 'Configuration Docker'],
  ['.github/workflows/ci.yml', 'CI/CD GitHub Actions']
];

let filesOk = 0;
for (const [file, desc] of essentialFiles) {
  if (checkFile(file, desc)) filesOk++;
}

log(`\n📊 Fichiers: ${filesOk}/${essentialFiles.length} OK\n`, filesOk === essentialFiles.length ? 'green' : 'yellow');

// Test 2: Vérifier les dépendances
log('📦 Vérification des dépendances...', 'blue');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = [
    '@prisma/client',
    '@shopify/shopify-app-remix',
    'geoip-lite',
    'ua-parser-js',
    'sharp',
    'cloudinary',
    'qrcode.react',
    'recharts'
  ];
  
  let depsOk = 0;
  for (const dep of requiredDeps) {
    if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
      log(`✅ ${dep}`, 'green');
      depsOk++;
    } else {
      log(`❌ ${dep} - Dépendance manquante`, 'red');
    }
  }
  
  log(`\n📊 Dépendances: ${depsOk}/${requiredDeps.length} OK\n`, depsOk === requiredDeps.length ? 'green' : 'yellow');
} catch (error) {
  log(`❌ Erreur lecture package.json: ${error.message}`, 'red');
}

// Test 3: Vérifier la configuration
log('⚙️  Vérification de la configuration...', 'blue');

// Charger .env si disponible
if (fs.existsSync('.env')) {
  require('dotenv').config();
  log('✅ Fichier .env trouvé', 'green');
} else {
  log('⚠️  Fichier .env manquant - copiez .env.example vers .env', 'yellow');
}

const requiredEnvVars = [
  ['DATABASE_URL', 'URL de la base de données'],
  ['SHOPIFY_API_KEY', 'Clé API Shopify'],
  ['SHOPIFY_API_SECRET', 'Secret API Shopify'],
  ['SCOPES', 'Scopes Shopify'],
  ['SHOPIFY_APP_URL', 'URL de l\'application']
];

let envOk = 0;
for (const [varName, desc] of requiredEnvVars) {
  if (checkEnvVar(varName, desc)) envOk++;
}

log(`\n📊 Variables d'environnement: ${envOk}/${requiredEnvVars.length} OK\n`, envOk === requiredEnvVars.length ? 'green' : 'yellow');

// Test 4: Vérifier Prisma
log('🗄️  Vérification Prisma...', 'blue');
try {
  execSync('npx prisma generate', { stdio: 'pipe' });
  log('✅ Client Prisma généré', 'green');
} catch (error) {
  log(`❌ Erreur génération Prisma: ${error.message}`, 'red');
}

// Test 5: Vérifier la compilation TypeScript
log('🔧 Vérification TypeScript...', 'blue');
try {
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  log('✅ Compilation TypeScript OK', 'green');
} catch (error) {
  log(`❌ Erreur TypeScript: ${error.message}`, 'red');
}

// Test 6: Vérifier les tests
log('🧪 Vérification des tests...', 'blue');
const testFiles = [
  'app/utils/__tests__/analytics.server.test.ts',
  'tests/e2e/scan.spec.ts',
  'jest.config.js',
  'playwright.config.ts'
];

let testsOk = 0;
for (const testFile of testFiles) {
  if (checkFile(testFile, `Test: ${path.basename(testFile)}`)) testsOk++;
}

log(`\n📊 Tests: ${testsOk}/${testFiles.length} OK\n`, testsOk === testFiles.length ? 'green' : 'yellow');

// Résumé final
log('📋 RÉSUMÉ DES TESTS', 'blue');
log('==================', 'blue');

const totalChecks = essentialFiles.length + requiredDeps.length + requiredEnvVars.length + testFiles.length + 3; // +3 pour Prisma, TS, et .env
const passedChecks = filesOk + (depsOk || 0) + envOk + testsOk + 2; // +2 pour Prisma et TS si OK

log(`\n🎯 Score: ${passedChecks}/${totalChecks}`, passedChecks === totalChecks ? 'green' : 'yellow');

if (passedChecks === totalChecks) {
  log('\n🎉 Tous les tests sont passés ! QRFlow est prêt pour le développement local.', 'green');
  log('\n📋 Prochaines étapes:', 'blue');
  log('1. npm run db:migrate  # Créer les tables');
  log('2. npm run db:seed     # Peupler avec des données de test');
  log('3. npm run dev         # Lancer le serveur de développement');
  log('4. Visiter http://localhost:3000 pour tester l\'application');
} else {
  log('\n⚠️  Certains tests ont échoué. Vérifiez les erreurs ci-dessus.', 'yellow');
  log('\n🔧 Actions recommandées:', 'blue');
  log('1. Installer les dépendances manquantes: npm install');
  log('2. Configurer les variables d\'environnement dans .env');
  log('3. Générer le client Prisma: npm run db:generate');
  log('4. Relancer ce script: node scripts/test-local.js');
}

log('\n📚 Documentation:', 'blue');
log('- README.md : Guide d\'installation');
log('- DEVELOPMENT.md : Guide de développement');
log('- DEPLOYMENT.md : Guide de déploiement');
log('- CHANGELOG.md : Historique des versions');








