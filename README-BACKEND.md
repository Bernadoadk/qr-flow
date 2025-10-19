# QRFlow Backend - Documentation

## 🚀 Installation et Configuration

### 1. Prérequis

- Node.js 18+
- PostgreSQL 14+
- Compte Shopify Partner

### 2. Installation des dépendances

```bash
npm install
```

### 3. Configuration de la base de données

#### Variables d'environnement

Créez un fichier `.env` avec les variables suivantes :

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/qrflow-db"

# Shopify App Configuration
SHOPIFY_API_KEY="your_shopify_api_key"
SHOPIFY_API_SECRET="your_shopify_api_secret"
SCOPES="read_products,write_products,read_orders,write_orders"

# App URL (for development)
APP_URL="https://your-app-domain.com"

# Session Storage
SESSION_SECRET="your_session_secret_key"
```

#### Initialisation de la base de données

```bash
# Générer le client Prisma
npm run db:generate

# Créer et appliquer les migrations
npm run db:migrate

# Peupler la base avec des données de test
npm run db:seed
```

### 4. Démarrage de l'application

```bash
# Mode développement
npm run dev

# Mode production
npm run build
npm start
```

## 📊 Structure de la Base de Données

### Modèles Principaux

#### Merchant

- Stocke les informations des marchands Shopify
- Gère les plans d'abonnement
- Contient les paramètres de l'application

#### QRCode

- QR codes créés par les marchands
- Types : LINK, PRODUCT, VIDEO, LOYALTY, CAMPAIGN
- Statistiques de scans et métadonnées

#### Campaign

- Campagnes marketing
- Liées aux QR codes
- Dates de début/fin et statuts

#### AnalyticsEvent

- Événements de tracking (scans, clics, conversions)
- Métadonnées détaillées (IP, user-agent, pays, etc.)

#### LoyaltyProgram

- Programmes de fidélité
- Règles de points et récompenses
- Configuration JSON flexible

## 🔌 API Endpoints

### Routes Publiques

#### `GET /api/scan/:id`

- Endpoint public pour les scans de QR codes
- Enregistre les analytics
- Redirige vers la destination
- Support des paramètres UTM

### Routes Authentifiées (Shopify)

#### `GET /app/qr-manager`

- Liste tous les QR codes du marchand
- Filtres et recherche
- Statistiques de performance

#### `POST /app/qr-manager`

- Créer un nouveau QR code
- Vérification des limites de plan
- Validation des données

#### `GET /app/analytics`

- Analytics détaillées
- Graphiques et métriques
- Filtres par période

#### `GET /app/campaigns`

- Gestion des campagnes
- QR codes associés
- Statistiques de performance

#### `GET /app/loyalty`

- Programme de fidélité
- Points et récompenses
- Membres et statistiques

## 🛡️ Sécurité

### Authentification Shopify

- OAuth 2.0 avec Shopify
- Sessions sécurisées
- Vérification des tokens

### Limites de Plan

- Vérification automatique des limites
- QR codes, campagnes, analytics
- Messages d'erreur explicites

### Validation des Données

- Validation côté serveur
- Sanitisation des entrées
- Protection contre les injections

## 📈 Analytics et Tracking

### Types d'Événements

- `SCAN` : Scan initial du QR code
- `CLICK` : Clic sur un lien
- `REDIRECT` : Redirection effectuée
- `PURCHASE` : Achat réalisé

### Métadonnées Collectées

- Adresse IP
- User-Agent
- Pays (via headers Cloudflare)
- Type d'appareil
- Timestamp
- Paramètres UTM

### Agrégations

- Statistiques quotidiennes
- Top QR codes
- Répartition par appareil
- Répartition géographique

## 🔧 Scripts Disponibles

```bash
# Base de données
npm run db:generate    # Générer le client Prisma
npm run db:migrate     # Créer/appliquer les migrations
npm run db:seed        # Peupler avec des données de test
npm run db:reset       # Réinitialiser la base
npm run db:studio      # Interface Prisma Studio

# Développement
npm run dev            # Mode développement
npm run build          # Build de production
npm run start          # Démarrage production
npm run lint           # Linting du code
```

## 🚀 Déploiement

### Préparation

1. Configurer les variables d'environnement
2. Créer la base de données PostgreSQL
3. Exécuter les migrations
4. Optionnel : exécuter le seed

### Plateformes Supportées

- **Fly.io** (recommandé pour Shopify)
- **Railway**
- **Heroku**
- **DigitalOcean App Platform**

### Variables d'Environnement de Production

```env
DATABASE_URL="postgresql://..."
SHOPIFY_API_KEY="..."
SHOPIFY_API_SECRET="..."
APP_URL="https://your-app.com"
SESSION_SECRET="..."
NODE_ENV="production"
```

## 🐛 Dépannage

### Problèmes Courants

#### Erreur de connexion à la base

- Vérifier la DATABASE_URL
- S'assurer que PostgreSQL est accessible
- Vérifier les permissions

#### Erreurs Shopify OAuth

- Vérifier les clés API
- S'assurer que l'URL de redirection est correcte
- Vérifier les scopes

#### Problèmes de performance

- Indexer les colonnes fréquemment utilisées
- Optimiser les requêtes Prisma
- Utiliser la pagination

### Logs

Les logs sont disponibles dans la console en mode développement et dans les services de monitoring en production.

## 📝 Contribution

1. Fork le projet
2. Créer une branche feature
3. Commiter les changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.
