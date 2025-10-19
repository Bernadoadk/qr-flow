# QRFlow - Shopify QR Code Management App

QRFlow est une application Shopify complète qui permet aux marchands de créer et gérer des QR codes dynamiques avec analytics avancées, campagnes marketing et programmes de fidélité.

## 🚀 Fonctionnalités

### Génération de QR Codes

- **QR codes personnalisables** : Couleurs, logos, formes, styles
- **Types multiples** : Liens, produits, vidéos, fidélité, campagnes
- **Redirections dynamiques** : Basées sur la géolocalisation, langue, type d'appareil
- **Export multi-format** : PNG, SVG, PDF

### Analytics & Suivi

- **Analytics en temps réel** : Scans, clics, conversions
- **Géolocalisation** : Pays, villes, régions
- **Détection d'appareils** : Mobile, desktop, tablette
- **Rapports détaillés** : Graphiques, tendances, top performers

### Marketing & Campagnes

- **Gestion de campagnes** : Création, suivi, optimisation
- **A/B Testing** : Test de différentes destinations
- **UTM Tracking** : Suivi des sources de trafic
- **Landing pages** : Pages d'arrivée personnalisées

### Fidélité & Engagement

- **Programme de fidélité** : Points, niveaux, récompenses
- **Gamification** : Défis, badges, classements
- **Coupons automatiques** : Génération de codes de réduction
- **Notifications** : Email, push, in-app

### Intégration Shopify

- **OAuth natif** : Authentification sécurisée
- **Admin API** : Accès aux produits, commandes, clients
- **Webhooks** : Événements en temps réel
- **Packing slips** : QR codes sur les factures

## 🛠️ Installation

### Prérequis

- Node.js 18+
- PostgreSQL 12+
- Compte Shopify Partner
- Compte Cloudinary ou AWS S3 (optionnel)

### 1. Cloner le repository

```bash
git clone <repository-url>
cd qr-flow
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configuration de la base de données

```bash
# Créer la base de données PostgreSQL
createdb qrflow_db

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos valeurs
```

### 4. Configuration des variables d'environnement

```bash
# Base de données
DATABASE_URL="postgresql://user:password@localhost:5432/qrflow_db"

# Shopify App
SHOPIFY_API_KEY="your_shopify_api_key"
SHOPIFY_API_SECRET="your_shopify_api_secret"
SCOPES="read_products,write_products,read_orders,write_orders,read_customers,write_customers,read_discounts,write_discounts"
SHOPIFY_APP_URL="https://your-app-domain.com"

# Stockage d'assets
# Les images sont stockées en Base64 dans la base de données (gratuit)

# Sécurité
SESSION_SECRET="your-super-secret-session-key"
HMAC_SECRET="your-hmac-secret-for-webhooks"
```

### 5. Initialiser la base de données

```bash
# Générer le client Prisma
npm run db:generate

# Créer les migrations
npm run db:migrate

# Peupler avec des données de démonstration
npm run db:seed
```

### 6. Lancer l'application

```bash
# Mode développement
npm run dev

# Mode production
npm run build
npm start
```

## 🔧 Développement

### Scripts disponibles

```bash
npm run dev              # Serveur de développement
npm run build            # Build de production
npm run start            # Serveur de production
npm run lint             # Lint du code
npm run db:generate      # Générer le client Prisma
npm run db:migrate       # Migrations de base de données
npm run db:seed          # Données de démonstration
npm run db:studio        # Interface Prisma Studio
npm run db:reset         # Reset de la base de données
```

### Structure du projet

```
app/
├── components/          # Composants React réutilisables
│   ├── ui/             # Composants UI de base
│   ├── qr/             # Composants QR spécifiques
│   └── layout/         # Composants de layout
├── routes/             # Routes Remix
│   ├── app.*           # Routes d'administration
│   ├── scan.*          # Route publique de scan
│   ├── api.*           # API endpoints
│   └── webhooks.*      # Webhooks Shopify
├── utils/              # Utilitaires serveur
│   ├── analytics.server.ts
│   ├── loyalty.server.ts
│   ├── upload.server.ts
│   └── security.server.ts
└── db.server.ts        # Configuration Prisma
```

### API Endpoints

#### Public

- `GET /scan/:slug` - Redirection QR code avec analytics

#### Authentifié

- `GET /app/qr-manager` - Gestion des QR codes
- `GET /app/analytics` - Analytics et rapports
- `GET /app/campaigns` - Gestion des campagnes
- `GET /app/loyalty` - Programme de fidélité
- `GET /app/settings` - Paramètres de l'app

#### API

- `POST /api/uploads` - Upload d'images
- `GET /api/export/:id` - Export QR code (PNG/SVG/PDF)

#### Webhooks

- `POST /webhooks/orders/paid` - Commande payée
- `POST /webhooks/app/uninstalled` - App désinstallée

## 🚀 Déploiement

### Variables d'environnement de production

```bash
NODE_ENV=production
DATABASE_URL="postgresql://..."
SHOPIFY_API_KEY="..."
SHOPIFY_API_SECRET="..."
SHOPIFY_APP_URL="https://your-domain.com"
CLOUDINARY_URL="..." # ou AWS S3
```

### Déploiement sur Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel --prod
```

### Déploiement sur Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel --prod

# Ou connecter avec GitHub pour déploiement automatique
vercel --prod --github
```

## 📊 Base de données

### Tables principales

- `merchants` - Informations des marchands
- `qrcodes` - QR codes créés
- `campaigns` - Campagnes marketing
- `loyalty_programs` - Programmes de fidélité
- `analytics_events` - Événements analytics
- `customer_points` - Points de fidélité clients
- `webhook_logs` - Logs des webhooks

### Données de démonstration

Le script de seed crée :

- 1 marchand de démonstration
- 4 QR codes d'exemple
- 1 programme de fidélité
- 100 événements analytics
- 20 clients avec points

## 🔒 Sécurité

- **Rate limiting** : 100 requêtes/minute par marchand
- **Validation HMAC** : Vérification des webhooks Shopify
- **Sanitisation** : Protection contre XSS et injection
- **CORS** : Configuration sécurisée
- **HTTPS** : Obligatoire en production

## 🧪 Tests

```bash
# Tests unitaires
npm run test

# Tests E2E
npm run test:e2e

# Coverage
npm run test:coverage
```

## 📈 Monitoring

- **Logs** : Winston avec rotation
- **Métriques** : Analytics en temps réel
- **Alertes** : Notifications d'erreurs
- **Performance** : Monitoring des requêtes

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

- **Documentation** : [Wiki du projet]
- **Issues** : [GitHub Issues]
- **Discord** : [Serveur Discord]
- **Email** : support@qrflow.app

## 🗺️ Roadmap

### Version 1.1

- [ ] Intégration Shopify Discounts API
- [ ] Templates de QR codes
- [ ] API publique pour développeurs
- [ ] Webhooks personnalisés

### Version 1.2

- [ ] A/B Testing avancé
- [ ] Intégration email marketing
- [ ] Analytics prédictives
- [ ] Mobile app

### Version 2.0

- [ ] Multi-tenant
- [ ] White-label
- [ ] Intégrations tierces
- [ ] IA pour optimisation

## 📚 Documentation Technique

### Architecture

QRFlow utilise une architecture moderne basée sur :

- **Remix** : Framework React full-stack
- **Prisma** : ORM pour PostgreSQL
- **Shopify App Bridge** : Intégration native Shopify
- **Polaris** : Design system Shopify

### Performance

- **Rate limiting** : Protection contre les abus
- **Caching** : Redis pour les données fréquentes
- **Stockage** : Base64 dans la base de données
- **Optimisation** : Lazy loading et code splitting

### Scalabilité

- **Database** : PostgreSQL avec index optimisés
- **Storage** : Base64 dans la base de données
- **Monitoring** : Analytics en temps réel
- **Deployment** : Vercel pour la scalabilité
