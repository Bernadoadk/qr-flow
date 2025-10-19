# Guide de Déploiement QRFlow

Ce guide explique comment déployer QRFlow sur Vercel.

## 🚀 Déploiement sur Vercel

### Prérequis
- Compte Vercel
- Base de données PostgreSQL (Neon, Supabase, ou Railway)
- Compte Cloudinary ou AWS S3
- Compte Shopify Partner

### 1. Préparation de la Base de Données

#### Option A: Neon (Recommandé)
```bash
# Créer un compte sur https://neon.tech
# Créer une nouvelle base de données
# Copier l'URL de connexion
```

#### Option B: Supabase
```bash
# Créer un compte sur https://supabase.com
# Créer un nouveau projet
# Aller dans Settings > Database
# Copier l'URL de connexion
```

#### Option C: Railway
```bash
# Créer un compte sur https://railway.app
# Créer un nouveau service PostgreSQL
# Copier l'URL de connexion
```

### 2. Configuration des Variables d'Environnement

Dans votre dashboard Vercel, ajoutez ces variables :

```bash
# Base de données
DATABASE_URL="postgresql://user:password@host:5432/database"

# Shopify App
SHOPIFY_API_KEY="your_shopify_api_key"
SHOPIFY_API_SECRET="your_shopify_api_secret"
SCOPES="read_products,write_products,read_orders,write_orders,read_customers,write_customers,read_discounts,write_discounts"
SHOPIFY_APP_URL="https://your-app.vercel.app"

# Sécurité
SESSION_SECRET="your-super-secret-session-key"
HMAC_SECRET="your-hmac-secret-for-webhooks"
CRON_SECRET="your-cron-secret-for-cleanup"

# Assets (choisir un)
CLOUDINARY_URL="cloudinary://api_key:api_secret@cloud_name"
# OU
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_REGION="us-east-1"
AWS_S3_BUCKET=""

# Analytics (optionnel)
IPINFO_API_KEY=""
```

### 3. Déploiement

#### Option A: Via Vercel CLI
```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter à Vercel
vercel login

# Déployer
vercel --prod
```

#### Option B: Via GitHub (Recommandé)
1. Connecter votre repository GitHub à Vercel
2. Configurer les variables d'environnement
3. Déployer automatiquement sur push

### 4. Configuration Post-Déploiement

#### Initialiser la Base de Données
```bash
# Se connecter à votre base de données
# Exécuter les migrations
npx prisma migrate deploy

# Peupler avec des données de démonstration
npx prisma db seed
```

#### Configurer les Webhooks Shopify
1. Aller dans votre dashboard Shopify Partner
2. Configurer les webhooks :
   - `orders/paid` → `https://your-app.vercel.app/webhooks/orders/paid`
   - `app/uninstalled` → `https://your-app.vercel.app/webhooks/app/uninstalled`

### 5. Configuration des Domaines

#### Domaine Personnalisé (Optionnel)
```bash
# Dans Vercel Dashboard
# Aller dans Settings > Domains
# Ajouter votre domaine personnalisé
# Configurer les DNS
```

### 6. Monitoring et Maintenance

#### Health Checks
```bash
# Vérifier la santé de l'application
curl https://your-app.vercel.app/api/test?type=health
```

#### Logs
```bash
# Voir les logs en temps réel
vercel logs --follow
```

#### Cron Jobs
Les tâches de nettoyage s'exécutent automatiquement :
- Nettoyage des rate limits (quotidien)
- Nettoyage des analytics (annuel)
- Nettoyage des webhooks (6 mois)

### 7. Optimisations Vercel

#### Edge Functions
```javascript
// Pour les routes de scan, utiliser Edge Runtime
export const config = {
  runtime: 'edge',
};
```

#### Caching
```javascript
// Headers de cache pour les assets statiques
export const headers = {
  'Cache-Control': 'public, max-age=31536000, immutable',
};
```

#### ISR (Incremental Static Regeneration)
```javascript
// Pour les pages analytics
export const revalidate = 3600; // 1 heure
```

### 8. Sécurité

#### Variables Sensibles
- Ne jamais commiter les clés API
- Utiliser les variables d'environnement Vercel
- Activer la protection des variables

#### CORS
```javascript
// Configuration CORS pour les API
export const cors = {
  origin: ['https://your-shop.myshopify.com'],
  credentials: true,
};
```

#### Rate Limiting
```javascript
// Rate limiting par IP
export const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par IP
};
```

### 9. Performance

#### Optimisations
- Utiliser les Edge Functions pour les routes de scan
- Implémenter le caching Redis
- Optimiser les images avec Cloudinary
- Utiliser les CDN Vercel

#### Monitoring
```bash
# Installer Vercel Analytics
npm install @vercel/analytics

# Configurer dans votre app
import { Analytics } from '@vercel/analytics/react';
```

### 10. Dépannage

#### Problèmes Courants

**Erreur de Base de Données**
```bash
# Vérifier la connexion
vercel env pull .env.local
npx prisma db push
```

**Erreur de Build**
```bash
# Vérifier les logs
vercel logs --follow

# Rebuild
vercel --prod --force
```

**Erreur de Webhook**
```bash
# Vérifier les logs
vercel logs --follow

# Tester manuellement
curl -X POST https://your-app.vercel.app/webhooks/orders/paid
```

### 11. Mise à Jour

#### Déploiement des Migrations
```bash
# Après mise à jour du code
vercel --prod

# Migrations automatiques via Vercel
# Configurer dans vercel.json
```

#### Rollback
```bash
# Revenir à une version précédente
vercel rollback [deployment-url]
```

### 12. Coûts

#### Vercel
- **Hobby** : Gratuit (limitations)
- **Pro** : $20/mois (recommandé)
- **Enterprise** : Contact Vercel

#### Base de Données
- **Neon** : Gratuit jusqu'à 0.5GB
- **Supabase** : Gratuit jusqu'à 500MB
- **Railway** : $5/mois

#### Assets
- **Cloudinary** : Gratuit jusqu'à 25GB
- **AWS S3** : Pay-as-you-go

### 13. Support

#### Documentation
- [Vercel Documentation](https://vercel.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Shopify App Development](https://shopify.dev/docs/apps)

#### Communauté
- [Vercel Discord](https://vercel.com/discord)
- [Shopify Partners Slack](https://shopifypartners.slack.com)
- [GitHub Issues](https://github.com/your-repo/issues)

## 🎉 Félicitations !

Votre application QRFlow est maintenant déployée sur Vercel ! 

### Prochaines Étapes
1. Tester l'application avec des données réelles
2. Configurer le monitoring
3. Optimiser les performances
4. Planifier les mises à jour

### Ressources Utiles
- [Dashboard Vercel](https://vercel.com/dashboard)
- [Shopify Partner Dashboard](https://partners.shopify.com)
- [Documentation QRFlow](https://github.com/your-repo/docs)





