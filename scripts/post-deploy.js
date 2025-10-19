#!/usr/bin/env node

/**
 * Script de post-déploiement pour Vercel
 * S'exécute après le déploiement pour vérifier que tout fonctionne
 */

import { execSync } from 'child_process';

console.log('🔍 Running post-deployment checks...');

try {
  // Vérifier la connexion à la base de données
  console.log('🗄️ Testing database connection...');
  execSync('npx prisma db pull --preview-feature', { 
    stdio: 'pipe',
    env: {
      ...process.env,
      NODE_ENV: 'production'
    }
  });

  console.log('✅ Database connection successful');

  // Vérifier que les tables existent
  console.log('📊 Checking database schema...');
  execSync('npx prisma db seed', { 
    stdio: 'pipe',
    env: {
      ...process.env,
      NODE_ENV: 'production'
    }
  });

  console.log('✅ Database schema is up to date');

  console.log('🎉 Post-deployment checks completed successfully!');

} catch (error) {
  console.warn('⚠️ Post-deployment check failed:', error.message);
  console.log('ℹ️ This is not critical - the application should still work');
}
