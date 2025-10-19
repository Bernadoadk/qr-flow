# 🗄️ Gestion Automatique de la Base de Données en Production

## 📋 Vue d'ensemble

Ce document explique comment la base de données est gérée automatiquement lors des déploiements sur Vercel.

## 🔄 Processus de Déploiement

### 1. **Build Process** (`scripts/vercel-build.js`)

```bash
# Séquence automatique lors du build :
1. 📦 Génération du client Prisma
2. 🔍 Vérification de la connexion DB
3. 🗄️ Exécution des migrations (prisma migrate deploy)
4. 🏗️ Build de l'application Remix
```

### 2. **Variables d'Environnement Requises**

```bash
# Dans Vercel Dashboard > Settings > Environment Variables
DATABASE_URL="postgresql://user:password@host:port/database"
CRON_SECRET="your-secret-for-cron-jobs"
```

### 3. **Migrations Automatiques**

Les migrations sont exécutées automatiquement avec `prisma migrate deploy` qui :

- ✅ Applique uniquement les nouvelles migrations
- ✅ Ne modifie pas les données existantes
- ✅ Gère les conflits de migration
- ✅ Rollback automatique en cas d'erreur

## 🛠️ Scripts Disponibles

### **Build Script** (`scripts/vercel-build.js`)

```bash
# Exécuté automatiquement par Vercel
node scripts/vercel-build.js
```

### **Post-Deploy Script** (`scripts/post-deploy.js`)

```bash
# Vérifications post-déploiement
node scripts/post-deploy.js
```

### **Migration Manuelle** (si nécessaire)

```bash
# En cas de problème, migration manuelle
npx prisma migrate deploy
```

## 🔧 Configuration Vercel

### **vercel.json**

```json
{
  "buildCommand": "node scripts/vercel-build.js",
  "outputDirectory": "build/client",
  "framework": "remix"
}
```

### **package.json**

```json
{
  "scripts": {
    "build": "npm run db:generate && npm run db:migrate:deploy && remix vite:build",
    "db:migrate:deploy": "prisma migrate deploy"
  }
}
```

## 🚨 Gestion des Erreurs

### **Migration Failed**

- Le build continue même si les migrations échouent
- Les erreurs sont loggées pour debugging
- L'application peut toujours démarrer avec l'ancien schéma

### **Database Connection Failed**

- Vérifier les variables d'environnement
- Vérifier la connectivité réseau
- Vérifier les permissions de la base de données

## 📊 Monitoring

### **Logs Vercel**

```bash
# Voir les logs de build
vercel logs --follow

# Voir les logs spécifiques aux migrations
vercel logs --filter="migrate"
```

### **Health Check**

```bash
# Vérifier que l'application fonctionne
curl https://your-app.vercel.app/api/test?type=health
```

## 🔄 Workflow Complet

1. **Push sur GitHub** → Déclenche le déploiement
2. **Vercel Build** → Exécute `scripts/vercel-build.js`
3. **Prisma Generate** → Génère le client Prisma
4. **Prisma Migrate Deploy** → Applique les nouvelles migrations
5. **Remix Build** → Construit l'application
6. **Deploy** → Déploie sur Vercel
7. **Post-Deploy** → Vérifications automatiques

## 🎯 Avantages

- ✅ **Automatique** : Aucune intervention manuelle
- ✅ **Sûr** : Gestion des erreurs et rollback
- ✅ **Efficace** : Seules les nouvelles migrations sont appliquées
- ✅ **Transparent** : Logs détaillés pour debugging
- ✅ **Robuste** : L'application continue de fonctionner même en cas d'erreur de migration

## 🚀 Prochaines Étapes

1. **Déployer** avec cette nouvelle configuration
2. **Vérifier** que les migrations s'appliquent correctement
3. **Monitorer** les logs pour s'assurer que tout fonctionne
4. **Tester** les nouvelles fonctionnalités en production
