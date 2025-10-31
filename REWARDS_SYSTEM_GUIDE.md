# 🎁 Système de Récompenses QRFlow - Guide Complet

## 📋 Vue d'ensemble

Le système de récompenses QRFlow est une solution complète pour gérer automatiquement les récompenses de fidélité dans Shopify. Il permet de créer, configurer, activer et synchroniser automatiquement différents types de récompenses avec l'API Shopify.

## 🏗️ Architecture

### Backend (`/utils/rewards/`)

#### 1. **RewardStateManager.ts**

Gestion dynamique des états des récompenses :

- Calcul automatique des dates d'activation et d'expiration
- Gestion des statuts (pending, active, expired, disabled)
- Traitement des récompenses programmées (cron job)
- Notifications automatiques d'expiration

#### 2. **ShopifyRewardSync.ts**

Synchronisation bidirectionnelle avec Shopify :

- Création automatique des PriceRules et DiscountCodes
- Gestion des codes de livraison gratuite
- Application des tags clients
- Vérification du statut des ressources Shopify

#### 3. **RewardNotificationService.ts**

Système de notifications :

- Notifications d'activation, d'expiration proche et d'expiration
- Support multi-canal (email, in-app, SMS)
- Templates personnalisables
- Planification automatique

#### 4. **schemas/index.ts**

Validation JSON Schema pour chaque type de récompense :

- Schémas complets avec validation
- Fonctions de validation intégrées
- Support des configurations complexes

### API Routes

#### 1. **api.rewards.templates.tsx**

CRUD complet des modèles de récompenses :

- `GET` : Récupération avec filtres et champs calculés
- `POST` : Création de nouvelles récompenses
- `PUT` : Mise à jour des récompenses existantes
- `DELETE` : Suppression des récompenses

#### 2. **api.rewards.activate.tsx**

Gestion des actions sur les récompenses :

- Activation/désactivation
- Synchronisation avec Shopify
- Utilisation des récompenses

#### 3. **api.rewards.sync.tsx**

Synchronisation avec Shopify :

- Synchronisation individuelle ou globale
- Vérification du statut des ressources
- Rapports de synchronisation

#### 4. **api.rewards.notifications.tsx**

Gestion des notifications :

- Envoi de notifications programmées
- Notifications de test
- Traitement des notifications automatiques

### Frontend (`/components/rewards/`)

#### 1. **RewardsManager.tsx**

Interface principale de gestion :

- Dashboard avec statistiques
- Filtres avancés
- Actions en lot
- Gestion des états

#### 2. **RewardCard.tsx**

Affichage des récompenses :

- Informations complètes
- Statuts visuels
- Actions contextuelles
- Contenu spécifique par type

#### 3. **RewardConfigurator.tsx**

Configuration des récompenses :

- Formulaire dynamique selon le type
- Validation en temps réel
- Prévisualisation
- Sauvegarde intelligente

#### 4. **RewardActions.tsx**

Actions sur les récompenses :

- Boutons d'action contextuels
- États de chargement
- Messages d'état
- Informations Shopify

#### 5. **types/` (Composants spécifiques)**

Affichage du contenu selon le type :

- `DiscountRewardContent.tsx`
- `FreeShippingRewardContent.tsx`
- `ExclusiveProductRewardContent.tsx`
- `EarlyAccessRewardContent.tsx`

## 🎯 Types de Récompenses

### 1. **Réduction en % (discount)**

```json
{
  "reward_type": "discount",
  "configuration": {
    "discount_scope": "order|product",
    "percentage": 10,
    "code_prefix": "LOYALTY",
    "minimum_order_amount": 50,
    "maximum_discount_amount": 100,
    "target_products": ["product_id_1", "product_id_2"],
    "target_collections": ["collection_id_1"],
    "applies_once_per_customer": true
  }
}
```

**Fonctionnalités :**

- Réduction sur commande entière ou produits spécifiques
- Codes de réduction automatiques
- Limites de montant
- Ciblage par produits/collections

### 2. **Livraison gratuite (free_shipping)**

```json
{
  "reward_type": "free_shipping",
  "configuration": {
    "eligible_zones": "all|local|international",
    "minimum_order_amount": 50,
    "requires_code": true,
    "shipping_methods": ["standard", "express"],
    "excluded_zones": ["remote_area"]
  }
}
```

**Fonctionnalités :**

- Livraison gratuite avec ou sans code
- Zones géographiques configurables
- Méthodes de livraison spécifiques
- Zones d'exclusion

### 3. **Produit exclusif (exclusive_product)**

```json
{
  "reward_type": "exclusive_product",
  "configuration": {
    "access_type": "exclusive|offered",
    "access_logic": "hidden_from_non_members|public_with_tag_filter",
    "product_ids": ["product_id_1"],
    "collection_ids": ["collection_id_1"],
    "max_quantity_per_customer": 2,
    "discount_percentage": 15,
    "priority_access": true,
    "auto_add_to_cart": false,
    "shopify_customer_tag": "exclusive_gold_access"
  }
}
```

**Fonctionnalités :**

- Accès exclusif ou produits offerts
- Masquage intelligent des produits
- Réductions supplémentaires
- Ajout automatique au panier
- Tags clients Shopify

### 4. **Accès anticipé (early_access)**

```json
{
  "reward_type": "early_access",
  "configuration": {
    "event_type": "product_launch|collection_sale|private_sale",
    "access_start_date": "2024-01-01T00:00:00Z",
    "access_end_date": "2024-01-07T23:59:59Z",
    "grace_period_hours": 24,
    "collections_concerned": ["collection_id_1"],
    "product_ids": ["product_id_1"],
    "discount_percentage": 20,
    "notification_enabled": true,
    "shopify_customer_tag": "early_access_platinum"
  }
}
```

**Fonctionnalités :**

- Accès anticipé aux ventes
- Périodes de grâce
- Notifications automatiques
- Réductions temporaires
- Événements configurables

## 🔄 Workflow Automatique

### 1. **Création d'une récompense**

1. L'administrateur configure la récompense via l'interface
2. Validation des données avec les schémas JSON
3. Sauvegarde en base de données
4. Calcul des champs dynamiques (dates, statuts)

### 2. **Activation automatique**

1. Vérification des récompenses en attente (cron job)
2. Activation automatique à la date prévue
3. Synchronisation avec Shopify
4. Envoi de notifications d'activation

### 3. **Synchronisation Shopify**

1. Création des ressources Shopify selon le type :
   - **Discount** : PriceRule + DiscountCode
   - **Free Shipping** : Shipping Discount Code
   - **Exclusive Product** : Customer Tag
   - **Early Access** : Customer Tag + Product Rules
2. Mise à jour du statut de synchronisation
3. Gestion des erreurs et retry automatique

### 4. **Expiration automatique**

1. Vérification des récompenses actives (cron job)
2. Expiration automatique à la date limite
3. Désactivation de la récompense
4. Envoi de notifications d'expiration

### 5. **Notifications programmées**

1. Notification d'activation (immédiate)
2. Notification d'expiration proche (J-3)
3. Notification d'expiration (J-0)

## 🛠️ Installation et Configuration

### 1. **Prérequis**

- Node.js 18+
- Prisma
- Shopify Admin API access
- Base de données PostgreSQL

### 2. **Installation**

```bash
# Cloner le projet
git clone [repository-url]

# Installer les dépendances
npm install

# Configurer la base de données
npx prisma migrate dev

# Initialiser les templates par défaut
node scripts/init-reward-templates-v2.js
```

### 3. **Configuration des cron jobs**

```bash
# Traitement des récompenses programmées (toutes les heures)
0 * * * * node scripts/process-rewards.js

# Synchronisation Shopify (toutes les 6 heures)
0 */6 * * * node scripts/sync-shopify-rewards.js
```

### 4. **Variables d'environnement**

```env
# Shopify
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_SCOPES=read_products,write_products,read_orders,write_orders

# Base de données
DATABASE_URL=postgresql://...

# Notifications (optionnel)
SENDGRID_API_KEY=your_sendgrid_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
```

## 📊 Utilisation

### 1. **Interface Administrateur**

- Accès via l'onglet "Récompenses" dans LoyaltyPersonalization
- Dashboard avec statistiques en temps réel
- Filtres avancés par palier, type, statut
- Actions en lot (sync, activation, etc.)

### 2. **Création de récompenses**

1. Cliquer sur "Nouvelle récompense"
2. Sélectionner le palier et le type
3. Configurer les paramètres spécifiques
4. Définir la durée et les limites
5. Sauvegarder et activer

### 3. **Gestion des états**

- **Pending** : En attente d'activation
- **Active** : Récompense active et utilisable
- **Expired** : Récompense expirée
- **Disabled** : Récompense désactivée manuellement

### 4. **Synchronisation Shopify**

- Synchronisation automatique lors de l'activation
- Synchronisation manuelle via le bouton "Sync"
- Synchronisation globale pour tous les marchands
- Vérification du statut des ressources

## 🔧 API Reference

### Endpoints

#### `GET /api/rewards/templates`

Récupère les récompenses avec filtres et champs calculés.

**Paramètres :**

- `merchantId` (requis) : ID du marchand
- `tier` : Filtre par palier
- `rewardType` : Filtre par type
- `includeCalculated` : Inclure les champs calculés

#### `POST /api/rewards/templates`

Crée une nouvelle récompense.

**Body :**

```json
{
  "merchantId": "merchant_id",
  "reward": {
    "tier": "Gold",
    "reward_type": "discount",
    "title": "Réduction Gold 15%",
    "description": "Profitez de 15% de réduction",
    "configuration": { ... },
    "active": true,
    "duration_days": 30,
    "activation_delay_days": 0
  }
}
```

#### `POST /api/rewards/activate`

Active, désactive ou synchronise une récompense.

**Body :**

```json
{
  "merchantId": "merchant_id",
  "rewardId": "reward_id",
  "action": "activate|deactivate|sync|use"
}
```

#### `POST /api/rewards/sync`

Synchronise les récompenses avec Shopify.

**Body :**

```json
{
  "merchantId": "merchant_id",
  "syncType": "single|all|check_status",
  "rewardId": "reward_id" // pour syncType: "single"
}
```

## 🧪 Tests

### Tests unitaires

```bash
# Tests des services
npm test -- --testPathPattern=rewards

# Tests des composants
npm test -- --testPathPattern=components/rewards
```

### Tests d'intégration

```bash
# Test complet du workflow
npm run test:integration:rewards
```

## 🚀 Déploiement

### 1. **Production**

```bash
# Build
npm run build

# Migration base de données
npx prisma migrate deploy

# Démarrage
npm start
```

### 2. **Monitoring**

- Logs des synchronisations Shopify
- Métriques des récompenses actives
- Alertes sur les erreurs de sync
- Dashboard des performances

### 3. **Maintenance**

- Nettoyage des récompenses expirées
- Archivage des données anciennes
- Optimisation des requêtes
- Mise à jour des schémas

## 📈 Métriques et Analytics

### KPIs principaux

- Nombre de récompenses créées/activées
- Taux d'utilisation des récompenses
- Temps de synchronisation Shopify
- Erreurs de synchronisation
- Satisfaction client (via notifications)

### Rapports

- Récompenses par palier et type
- Performance des synchronisations
- Utilisation des codes de réduction
- Impact sur les ventes

## 🔒 Sécurité

### Authentification

- Vérification des permissions marchand
- Validation des données d'entrée
- Sanitisation des requêtes

### Données sensibles

- Chiffrement des codes de réduction
- Masquage des informations Shopify
- Audit trail des actions

## 🆘 Dépannage

### Problèmes courants

#### Synchronisation Shopify échoue

1. Vérifier les permissions API
2. Contrôler les limites de taux
3. Vérifier la validité des données
4. Consulter les logs d'erreur

#### Récompenses non activées

1. Vérifier les dates d'activation
2. Contrôler le statut actif
3. Vérifier les limites d'utilisation
4. Consulter les logs de traitement

#### Notifications non envoyées

1. Vérifier la configuration des services
2. Contrôler les templates de notification
3. Vérifier les adresses email
4. Consulter les logs de notification

### Support

- Documentation complète dans `/docs/rewards/`
- Logs détaillés dans `/logs/rewards/`
- Support technique : [email]
- Issues GitHub : [repository]/issues

---

## 🎉 Conclusion

Le système de récompenses QRFlow offre une solution complète et automatisée pour gérer les récompenses de fidélité dans Shopify. Avec ses composants modulaires, sa synchronisation automatique et son interface intuitive, il permet aux marchands de créer des programmes de fidélité sophistiqués et efficaces.

Pour toute question ou contribution, n'hésitez pas à consulter la documentation ou à contacter l'équipe de développement.

