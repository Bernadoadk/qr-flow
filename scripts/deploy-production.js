#!/usr/bin/env node

/**
 * Script de déploiement en production
 * Commit, push et déploiement automatique
 * Usage: npm run deploy:prod "message de commit"
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Récupérer le message de commit depuis les arguments
const commitMessage = process.argv[2];

if (!commitMessage) {
  console.error('❌ Message de commit requis');
  console.log('Usage: npm run deploy:prod "message de commit"');
  console.log('Exemple: npm run deploy:prod "feat: ajout de nouvelles fonctionnalités QR"');
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
  } catch (error) {
    console.log('⚠️ Impossible de vérifier le statut Git, continuation...');
  }

  if (hasChanges) {
    // Créer le commit seulement s'il y a des changements
    console.log('📝 Changements détectés, création du commit...');
    execSync(`git commit -m "${commitMessage}"`, { 
      stdio: 'inherit',
      env: { ...process.env }
    });
  } else {
    // Vérifier si le repo local est en avance sur origin/main
    console.log('ℹ️ Aucun changement local à commiter');
    try {
      // Récupérer le commit local
      const localCommit = execSync('git rev-parse HEAD', { encoding: 'utf8', stdio: 'pipe' }).trim();
      
      // Vérifier si origin/main existe
      let remoteCommit = null;
      try {
        execSync('git fetch origin main --quiet', { stdio: 'pipe' });
        remoteCommit = execSync('git rev-parse origin/main', { encoding: 'utf8', stdio: 'pipe' }).trim();
      } catch (fetchError) {
        // Origin/main n'existe peut-être pas encore
        console.log('⚠️ Impossible de récupérer origin/main');
      }
      
      if (remoteCommit && localCommit === remoteCommit) {
        console.log('ℹ️ Le dépôt est déjà à jour avec origin/main');
        console.log('💡 Aucun push nécessaire. Le dernier commit sera redéployé par Vercel.');
        console.log('🎉 Déploiement en production terminé avec succès !');
        console.log('📡 Si un redéploiement est nécessaire, déclenchez-le manuellement depuis Vercel');
        process.exit(0);
      } else {
        console.log('📤 Des commits locaux non poussés détectés');
      }
    } catch (error) {
      console.log('⚠️ Impossible de comparer avec origin/main, tentative de push...');
    }
  }

  // Push vers le dépôt distant
  console.log('🚀 Push vers le dépôt distant...');
  try {
    execSync('git push origin main', { 
      stdio: 'inherit',
      env: { ...process.env }
    });
    console.log('✅ Code poussé avec succès');
  } catch (error) {
    // Si le push échoue, ça peut être normal si déjà à jour
    if (error.message.includes('up to date') || error.message.includes('Everything up-to-date')) {
      console.log('✅ Le dépôt distant est déjà à jour');
    } else {
      throw error;
    }
  }

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

