#!/usr/bin/env node

/**
 * Script de déploiement en production
 * Commit, push et déploiement automatique
 * Usage: npm run deploy:prod "message de commit"
 */

import { execSync } from 'child_process';
import fs from 'fs';

// Récupérer le message de commit depuis les arguments
const commitMessage = process.argv[2];

if (!commitMessage) {
  console.error('❌ Message de commit requis');
  console.log('Usage: npm run deploy:prod "message de commit"');
  console.log('Exemple: npm run deploy:prod "feat: ajout nouvelle fonctionnalité QR code"');
  process.exit(1);
}

console.log('🚀 Déploiement en production...');
console.log(`📝 Message de commit: "${commitMessage}"`);

try {
  // Vérifier que nous sommes dans le bon répertoire
  if (!fs.existsSync('package.json')) {
    throw new Error('❌ Ce script doit être exécuté depuis la racine du projet');
  }

  console.log('✅ Prêt pour le déploiement');

  // Vérifier le statut Git
  console.log('🔍 Vérification du statut Git...');
  try {
    execSync('git status --porcelain', { stdio: 'pipe' });
  } catch (error) {
    throw new Error('❌ Erreur Git: assurez-vous d\'être dans un dépôt Git valide');
  }

  // Ajouter tous les fichiers modifiés
  console.log('📁 Ajout des fichiers modifiés...');
  execSync('git add .', { stdio: 'inherit' });

  // Vérifier s'il y a des changements à commiter
  let hasChanges = false;
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    hasChanges = status.trim().length > 0;
    if (!hasChanges) {
      console.log('ℹ️ Aucun changement à commiter');
    } else {
      console.log('📝 Changements détectés, création du commit...');
    }
  } catch (error) {
    console.log('⚠️ Impossible de vérifier le statut Git, continuation...');
  }

  // Créer le commit seulement s'il y a des changements
  if (hasChanges) {
    console.log('💾 Création du commit...');
    try {
      execSync(`git commit -m "${commitMessage}"`, { 
        stdio: 'inherit',
        env: { ...process.env }
      });
      console.log('✅ Commit créé avec succès');
    } catch (commitError) {
      // Si le commit échoue pour une raison autre que "nothing to commit"
      const errorOutput = commitError.stderr?.toString() || commitError.message || '';
      if (errorOutput.includes('nothing to commit') || errorOutput.includes('no changes')) {
        console.log('ℹ️ Aucun changement à commiter après vérification');
      } else {
        throw commitError;
      }
    }
  } else {
    console.log('ℹ️ Aucun changement à commiter, push des commits existants...');
  }

  // Push vers le dépôt distant
  console.log('🚀 Push vers le dépôt distant...');
  execSync('git push origin main', { 
    stdio: 'inherit',
    env: { ...process.env }
  });

  console.log('✅ Code poussé avec succès');

  console.log('🎉 Déploiement en production terminé avec succès !');
  console.log('📡 Le déploiement sur Vercel se déclenche automatiquement via Git');
  console.log('🔗 Vérifiez le statut sur: https://vercel.com/dashboard');
  console.log('💡 Vercel va automatiquement :');
  console.log('   - Générer le client Prisma');
  console.log('   - Exécuter les migrations');
  console.log('   - Builder et déployer l\'application');

} catch (error) {
  console.error('❌ Erreur lors du déploiement:', error.message);
  process.exit(1);
}

