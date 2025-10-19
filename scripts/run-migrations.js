#!/usr/bin/env node

/**
 * Script pour exécuter les migrations en production
 * Peut être appelé manuellement ou via un webhook
 */

import { execSync } from 'child_process';

console.log('🔄 Exécution des migrations en production...');

try {
  if (!process.env.DATABASE_URL) {
    throw new Error('❌ DATABASE_URL non définie');
  }

  console.log('📦 Génération du client Prisma...');
  execSync('npx prisma generate', { 
    stdio: 'inherit',
    env: { ...process.env }
  });

  console.log('🗄️ Exécution des migrations...');
  execSync('npx prisma migrate deploy', { 
    stdio: 'inherit',
    env: { ...process.env }
  });

  console.log('✅ Migrations terminées avec succès');

} catch (error) {
  console.error('❌ Erreur lors des migrations:', error.message);
  process.exit(1);
}
