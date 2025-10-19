#!/usr/bin/env node

/**
 * Script de démarrage rapide pour QRFlow
 * Configure et lance l'application en mode développement
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 QRFlow - Démarrage Rapide');
console.log('============================\n');

// Colors
const green = '\x1b[32m';
const red = '\x1b[31m';
const yellow = '\x1b[33m';
const blue = '\x1b[34m';
const reset = '\x1b[0m';

function log(message, color = reset) {
  console.log(`${color}${message}${reset}`);
}

// Étape 1: Vérifier .env
log('📋 Étape 1: Configuration de l\'environnement...', blue);
if (!fs.existsSync('.env')) {
  if (fs.existsSync('.env.example')) {
    log('📝 Création du fichier .env à partir de .env.example...', yellow);
    fs.copyFileSync('.env.example', '.env');
    log('✅ Fichier .env créé', green);
    log('⚠️  IMPORTANT: Éditez le fichier .env avec vos vraies valeurs !', yellow);
  } else {
    log('❌ Fichier .env.example manquant', red);
    process.exit(1);
  }
} else {
  log('✅ Fichier .env existe déjà', green);
}

// Étape 2: Installer les dépendances
log('\n📦 Étape 2: Installation des dépendances...', blue);
try {
  execSync('npm install', { stdio: 'inherit' });
  log('✅ Dépendances installées', green);
} catch (error) {
  log('❌ Erreur installation des dépendances', red);
  process.exit(1);
}

// Étape 3: Générer Prisma
log('\n🗄️  Étape 3: Génération du client Prisma...', blue);
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  log('✅ Client Prisma généré', green);
} catch (error) {
  log('❌ Erreur génération Prisma', red);
  process.exit(1);
}

// Étape 4: Migrations (optionnel)
log('\n🔄 Étape 4: Migrations de base de données...', blue);
const hasDatabase = process.env.DATABASE_URL || fs.readFileSync('.env', 'utf8').includes('DATABASE_URL=');

if (hasDatabase) {
  try {
    execSync('npx prisma migrate dev --name init', { stdio: 'inherit' });
    log('✅ Migrations appliquées', green);
    
    // Étape 5: Seed (optionnel)
    log('\n🌱 Étape 5: Données de démonstration...', blue);
    try {
      execSync('npm run db:seed', { stdio: 'inherit' });
      log('✅ Données de démonstration ajoutées', green);
    } catch (error) {
      log('⚠️  Erreur seed (optionnel)', yellow);
    }
  } catch (error) {
    log('⚠️  Erreur migrations - vérifiez votre DATABASE_URL', yellow);
  }
} else {
  log('⚠️  DATABASE_URL non configuré - migrations ignorées', yellow);
}

// Étape 6: Test de compilation
log('\n🔧 Étape 6: Test de compilation...', blue);
try {
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  log('✅ Compilation TypeScript OK', green);
} catch (error) {
  log('⚠️  Erreurs TypeScript détectées', yellow);
}

// Étape 7: Test système
log('\n🧪 Étape 7: Test du système...', blue);
try {
  execSync('node scripts/test-local.js', { stdio: 'inherit' });
} catch (error) {
  log('⚠️  Certains tests ont échoué', yellow);
}

// Résumé final
log('\n🎉 DÉMARRAGE TERMINÉ !', green);
log('====================', green);

log('\n📋 Prochaines étapes:', blue);
log('1. Éditez le fichier .env avec vos vraies valeurs');
log('2. Lancez le serveur: npm run dev');
log('3. Visitez http://localhost:3000');
log('4. Testez la route de scan: http://localhost:3000/scan/premium-bf2024');

log('\n🔗 URLs utiles:', blue);
log('- Application: http://localhost:3000');
log('- Prisma Studio: npm run db:studio');
log('- Tests: npm test');
log('- Tests E2E: npm run test:e2e');

log('\n📚 Documentation:', blue);
log('- README.md : Guide complet');
log('- DEVELOPMENT.md : Guide de développement');
log('- DEPLOYMENT.md : Guide de déploiement');

log('\n🚀 Pour lancer l\'application:', green);
log('npm run dev');





