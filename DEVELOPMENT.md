# Guide de Développement QRFlow

Ce guide explique comment contribuer au développement de QRFlow.

## 🚀 Démarrage Rapide

### Prérequis

- Node.js 18+
- PostgreSQL 12+
- Git
- Compte Shopify Partner

### Installation

```bash
# Cloner le repository
git clone <repository-url>
cd qr-flow

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos valeurs

# Initialiser la base de données
npm run db:generate
npm run db:migrate
npm run db:seed

# Lancer l'application
npm run dev
```

## 🏗️ Architecture

### Structure du Projet

```
app/
├── components/          # Composants React
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

### Technologies Utilisées

- **Remix** : Framework React full-stack
- **Prisma** : ORM pour PostgreSQL
- **Shopify App Bridge** : Intégration native Shopify
- **Polaris** : Design system Shopify
- **Tailwind CSS** : Framework CSS
- **Recharts** : Graphiques et visualisations

## 🔧 Développement

### Scripts Disponibles

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
npm test                 # Tests unitaires
npm run test:e2e         # Tests E2E
```

### Conventions de Code

#### TypeScript

- Utiliser des types stricts
- Préférer les interfaces aux types
- Documenter les fonctions complexes

#### React

- Utiliser des composants fonctionnels
- Préférer les hooks aux classes
- Utiliser TypeScript pour les props

#### CSS

- Utiliser Tailwind CSS
- Préférer les classes utilitaires
- Créer des composants réutilisables

### Base de Données

#### Modèles Principaux

- `Merchant` : Informations des marchands
- `QRCode` : QR codes créés
- `Campaign` : Campagnes marketing
- `LoyaltyProgram` : Programmes de fidélité
- `AnalyticsEvent` : Événements analytics
- `CustomerPoints` : Points de fidélité clients

#### Migrations

```bash
# Créer une nouvelle migration
npx prisma migrate dev --name description

# Appliquer les migrations
npx prisma migrate deploy

# Reset de la base de données
npx prisma migrate reset
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

## 🧪 Tests

### Tests Unitaires

```bash
# Lancer tous les tests
npm test

# Tests avec coverage
npm run test:coverage

# Tests en mode watch
npm run test:watch
```

### Tests E2E

```bash
# Lancer les tests E2E
npm run test:e2e

# Tests E2E en mode UI
npm run test:e2e:ui
```

### Tests d'Intégration

```bash
# Tester l'API
curl http://localhost:3000/api/test?type=health

# Tester le scan
curl http://localhost:3000/scan/premium-bf2024
```

## 🔒 Sécurité

### Bonnes Pratiques

- Valider toutes les entrées utilisateur
- Utiliser des requêtes préparées
- Implémenter le rate limiting
- Vérifier les signatures HMAC
- Sanitiser les données

### Variables d'Environnement

```bash
# Obligatoires
DATABASE_URL="postgresql://..."
SHOPIFY_API_KEY="..."
SHOPIFY_API_SECRET="..."

# Optionnelles
CLOUDINARY_URL="..."
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
```

## 📦 Déploiement

### Variables d'Environnement de Production

```bash
NODE_ENV=production
DATABASE_URL="postgresql://..."
SHOPIFY_API_KEY="..."
SHOPIFY_API_SECRET="..."
SHOPIFY_APP_URL="https://your-domain.com"
CLOUDINARY_URL="..."
```

### Déploiement sur Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel --prod
```

### Déploiement sur Railway

```bash
# Installer Railway CLI
npm i -g @railway/cli

# Déployer
railway up
```

### Déploiement avec Docker

```bash
# Build l'image
docker build -t qrflow .

# Lancer le container
docker run -p 3000:3000 qrflow
```

## 🐛 Débogage

### Logs

```bash
# Logs de développement
npm run dev

# Logs de production
npm start
```

### Base de Données

```bash
# Interface Prisma Studio
npm run db:studio

# Requêtes SQL directes
npx prisma db execute --stdin
```

### Outils de Développement

- **Prisma Studio** : Interface graphique pour la base de données
- **Shopify CLI** : Outils de développement Shopify
- **Browser DevTools** : Débogage frontend
- **Postman** : Test des API

## 📚 Ressources

### Documentation

- [Remix Documentation](https://remix.run/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Shopify App Development](https://shopify.dev/docs/apps)
- [Polaris Design System](https://polaris.shopify.com/)

### Outils

- [Shopify CLI](https://shopify.dev/docs/apps/tools/cli)
- [Prisma Studio](https://www.prisma.io/studio)
- [Vercel](https://vercel.com/)
- [Railway](https://railway.app/)

## 🤝 Contribution

### Workflow

1. Fork le repository
2. Créer une branche feature
3. Faire les modifications
4. Ajouter des tests
5. Créer une Pull Request

### Standards

- Code review obligatoire
- Tests requis pour les nouvelles fonctionnalités
- Documentation mise à jour
- Respect des conventions de code

### Issues

- Utiliser les templates d'issues
- Fournir des informations détaillées
- Ajouter des labels appropriés
- Assigner les responsables

## 📞 Support

### Communication

- **GitHub Issues** : Bugs et demandes de fonctionnalités
- **Discord** : Discussion en temps réel
- **Email** : support@qrflow.app

### Documentation

- **README.md** : Guide d'installation
- **DEVELOPMENT.md** : Guide de développement
- **API.md** : Documentation API
- **CHANGELOG.md** : Historique des versions




