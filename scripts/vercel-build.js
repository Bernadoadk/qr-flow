#!/usr/bin/env node

/**
 * Script de build pour Vercel avec migrations automatiques
 * Ce script s'exécute pendant le processus de build sur Vercel
 */

const { execSync } = require('child_process');

console.log('🚀 Starting Vercel build process...');

try {
  // 1. Générer le client Prisma
  console.log('📦 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // 2. Exécuter les migrations en production (seulement si DATABASE_URL est disponible)
  if (process.env.DATABASE_URL) {
    console.log('🗄️ Running database migrations...');
    try {
      execSync('npx prisma migrate deploy', { 
        stdio: 'inherit',
        env: {
          ...process.env,
          NODE_ENV: 'production'
        }
      });
      console.log('✅ Database migrations completed successfully');
    } catch (migrationError) {
      console.warn('⚠️ Migration failed, but continuing with build...', migrationError.message);
    }
  } else {
    console.log('⚠️ No DATABASE_URL found, skipping migrations');
  }

  // 3. Construire l'application Remix
  console.log('🏗️ Building Remix application...');
  execSync('npx remix vite:build', { stdio: 'inherit' });

  console.log('🎉 Build completed successfully!');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
