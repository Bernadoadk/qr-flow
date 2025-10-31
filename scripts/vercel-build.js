#!/usr/bin/env node

/**
 * Script de build et migration pour Vercel
 * Exécute les migrations Prisma avant le build
 */

import { execSync } from 'child_process';

console.log('🚀 Début du processus de build et migration...');

try {
  // Générer le client Prisma
  console.log('📦 Génération du client Prisma...');
  execSync('npx prisma generate', { 
    stdio: 'inherit',
    env: { ...process.env }
  });

  // Exécuter les migrations seulement si DATABASE_URL est disponible
  if (process.env.DATABASE_URL) {
    console.log('🔄 Exécution des migrations Prisma...');
    try {
      execSync('npx prisma migrate deploy', { 
        stdio: 'inherit',
        env: { ...process.env }
      });
      console.log('✅ Migrations terminées avec succès');
    } catch (migrationError) {
      console.warn('⚠️ Erreur lors des migrations, continuation du build...', migrationError.message);
    }
  } else {
    console.log('⚠️ DATABASE_URL non trouvée, saut des migrations');
  }

  // Builder l'application Remix
  console.log('🏗️ Construction de l\'application Remix...');
  execSync('npx remix vite:build', { 
    stdio: 'inherit',
    env: { ...process.env }
  });
  console.log('✅ Build Remix terminé avec succès');

} catch (error) {
  console.error('❌ Erreur lors du processus de build:', error.message);
  process.exit(1);
}

console.log('🎉 Build et migration terminés avec succès !');
