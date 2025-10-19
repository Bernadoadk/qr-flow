#!/usr/bin/env node

/**
 * Script de build et migration pour Vercel
 * Exécute les migrations Prisma avant le build
 */

import { execSync } from 'child_process';

console.log('🚀 Début du processus de build et migration...');

try {
  // Vérifier que la DATABASE_URL est définie
  if (!process.env.DATABASE_URL) {
    throw new Error('❌ DATABASE_URL non définie dans les variables d\'environnement');
  }

  console.log('✅ DATABASE_URL trouvée');

  // Générer le client Prisma
  console.log('📦 Génération du client Prisma...');
  execSync('npx prisma generate', { 
    stdio: 'inherit',
    env: { ...process.env }
  });

  // Exécuter les migrations
  console.log('🔄 Exécution des migrations Prisma...');
  execSync('npx prisma migrate deploy', { 
    stdio: 'inherit',
    env: { ...process.env }
  });

  console.log('✅ Migrations terminées avec succès');

  // Vérifier la connexion à la base de données
  console.log('🔍 Vérification de la connexion à la base de données...');
  execSync('npx prisma db pull --print', { 
    stdio: 'pipe',
    env: { ...process.env }
  });

  console.log('✅ Connexion à la base de données vérifiée');

} catch (error) {
  console.error('❌ Erreur lors du processus de migration:', error.message);
  process.exit(1);
}

console.log('🎉 Build et migration terminés avec succès !');
