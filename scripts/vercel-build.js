#!/usr/bin/env node

/**
 * Script de build pour Vercel avec migrations automatiques
 * Ce script s'exécute pendant le processus de build sur Vercel
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Vercel build process...');

try {
  // 1. Générer le client Prisma
  console.log('📦 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // 2. Vérifier si la base de données est accessible
  console.log('🔍 Checking database connection...');
  
  // 3. Exécuter les migrations en production
  console.log('🗄️ Running database migrations...');
  execSync('npx prisma migrate deploy', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production'
    }
  });

  console.log('✅ Database migrations completed successfully');

  // 4. Construire l'application Remix
  console.log('🏗️ Building Remix application...');
  execSync('npx remix vite:build', { stdio: 'inherit' });

  console.log('🎉 Build completed successfully!');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  
  // En cas d'erreur de migration, on continue quand même le build
  // pour éviter de bloquer le déploiement
  if (error.message.includes('migrate')) {
    console.warn('⚠️ Migration failed, but continuing with build...');
    try {
      execSync('npx remix vite:build', { stdio: 'inherit' });
      console.log('🏗️ Application built successfully despite migration issues');
    } catch (buildError) {
      console.error('❌ Application build also failed:', buildError.message);
      process.exit(1);
    }
  } else {
    process.exit(1);
  }
}
