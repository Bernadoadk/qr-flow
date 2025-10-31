# 🎁 Système de Récompenses Shopify - Guide Complet

## Vue d'ensemble

Le système de récompenses Shopify permet aux marchands de créer et gérer automatiquement des récompenses pour leur programme de fidélité. Les récompenses sont appliquées automatiquement quand un client atteint un nouveau palier.

## 🏗️ Architecture

### Services Backend

#### `ShopifyRewardsService` (`app/utils/shopify-rewards.server.ts`)

Service principal pour gérer les récompenses Shopify :

- **`createDiscountCode()`** - Crée un code de réduction Shopify
- **`applyFreeShipping()`** - Applique la livraison gratuite
- **`grantExclusiveProductAccess()`** - Accorde l'accès aux produits exclusifs
- **`grantEarlyAccess()`** - Accorde l'accès anticipé aux ventes
- **`applyTierRewards()`** - Applique toutes les récompenses d'un palier
- **`getCustomerActiveRewards()`** - Récupère les récompenses actives d'un client
- **`markDiscountCodeAsUsed()`** - Marque un code comme utilisé

### Base de Données

#### Tables Prisma

- **`CustomerRewards`** - Récompenses actives par client
- **`RewardTemplates`** - Templates de récompenses par palier
- **`ShopifyDiscountCodes`** - Codes de réduction Shopify générés

### API Endpoints

#### `api.loyalty.rewards.tsx`

- **POST** - Récupère les récompenses actives d'un client
- Retourne : points, palier actuel, récompenses actives, récompenses du palier suivant

#### `api.loyalty.rewards.templates.tsx`

- **GET** - Récupère les templates de récompenses
- **POST** - Crée/modifie un template de récompense
- **DELETE** - Supprime un template de récompense

## 🎯 Types de Récompenses

### 1. Réduction en Pourcentage (`discount`)

- Génère un code promo Shopify automatiquement
- Configuration : pourcentage, préfixe, expiration, usage unique
- Exemple : `SILVER10_ABC123` pour 10% de réduction

### 2. Livraison Gratuite (`free_shipping`)

- Crée un code de livraison gratuite Shopify
- Configuration : commande minimum, zones de livraison, expiration
- Exemple : `SHIPSILVER_XYZ789`

### 3. Produits Exclusifs (`exclusive_product`)

- Ajoute un tag Shopify au client (`exclusive_gold_access`)
- Configuration : IDs produits, IDs collections, expiration
- Le marchand peut filtrer les produits par tag

### 4. Accès Anticipé (`early_access`)

- Ajoute un tag Shopify au client (`early_access_gold`)
- Configuration : dates de vente, expiration
- Le marchand peut afficher des ventes limitées par tag

## 🚀 Workflow Automatique

### 1. Attribution des Points

Quand un client scanne un QR code ou passe une commande :

```typescript
// Dans api.scan.$id.tsx ou webhooks.orders.paid.tsx
await LoyaltyService.awardPoints(merchantId, customerId, points);
await processLoyaltyRewards(merchantId, customerId, request);
```

### 2. Vérification du Palier

Le système vérifie si le client a atteint un nouveau palier :

```typescript
const customerPoints = await LoyaltyService.getCustomerPoints(
  merchantId,
  customerId,
);
const existingRewards = await ShopifyRewardsService.getCustomerActiveRewards(
  merchantId,
  customerId,
);
```

### 3. Application des Récompenses

Si nouveau palier détecté, applique automatiquement les récompenses :

```typescript
await ShopifyRewardsService.applyTierRewards(
  merchantId,
  customerId,
  currentTier,
  request,
);
```

## 🎨 Interface Admin

### LoyaltyRewardsManager

Composant React pour gérer les récompenses :

- **Navigation par palier** - Bronze, Silver, Gold, Platinum
- **Création/Modification** - Interface modale pour configurer les récompenses
- **Activation/Désactivation** - Toggle pour activer/désactiver les récompenses
- **Suppression** - Bouton pour supprimer les récompenses

### Intégration dans LoyaltyPersonalization

L'onglet "Récompenses" dans la personnalisation du programme de fidélité :

```tsx
{
  activeTab === "rewards" && (
    <LoyaltyRewardsManager merchantId={loyaltyProgram?.merchantId} />
  );
}
```

## 👥 Interface Client

### ActiveRewardsSection

Composant pour afficher les récompenses côté client :

- **Codes de réduction** - Affichage proéminent avec bouton copier
- **Livraison gratuite** - Badge d'activation
- **Produits exclusifs** - Information sur l'accès
- **Accès anticipé** - Notification des avantages
- **Récompenses suivantes** - Aperçu du palier suivant

### Intégration dans loyalty.$slug.tsx

```tsx
<ActiveRewardsSection
  rewards={activeRewards}
  nextTierRewards={nextTierRewards}
  pointsToNextTier={100 - currentPoints}
/>
```

## 🔧 Configuration et Initialisation

### Templates par Défaut

Script d'initialisation des templates :

```bash
# Initialiser pour tous les marchands
node scripts/init-reward-templates.js

# Initialiser pour un marchand spécifique
node scripts/init-reward-templates.js merchantId
```

### Configuration des Récompenses

Chaque template contient :

```typescript
{
  merchantId: string,
  tier: "Bronze" | "Silver" | "Gold" | "Platinum",
  rewardType: "discount" | "free_shipping" | "exclusive_product" | "early_access",
  value: {
    // Configuration spécifique au type de récompense
    percentage?: number,
    codePrefix?: string,
    expiresInDays?: number,
    minimumOrder?: number,
    productIds?: string[],
    // ...
  },
  isActive: boolean
}
```

## 🔌 Intégration Shopify

### Authentification

```typescript
const { admin } = await authenticate.admin(request);
```

### Création de Codes de Réduction

```typescript
const mutation = `
  mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
    discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
      codeDiscountNode {
        id
        codeDiscount {
          ... on DiscountCodeBasic {
            codes(first: 1) { edges { node { code } } }
          }
        }
      }
      userErrors { field message }
    }
  }
`;
```

### Gestion des Tags Clients

```typescript
const updateMutation = `
  mutation customerUpdate($input: CustomerInput!) {
    customerUpdate(input: $input) {
      customer { id tags }
      userErrors { field message }
    }
  }
`;
```

## 📊 Monitoring et Analytics

### Statistiques des Récompenses

```typescript
const stats = await ShopifyRewardsService.getRewardsStats(merchantId);
// Retourne : totalActiveRewards, totalDiscountCodesCreated, totalDiscountCodesUsed, rewardsByTier
```

### Logs et Debugging

Le système logge toutes les opérations :

- ✅ Création de codes de réduction
- ✅ Application de récompenses
- ❌ Erreurs Shopify
- ⚠️ Clients non trouvés

## 🚨 Gestion d'Erreurs

### Erreurs Shopify

- Les erreurs `userErrors` sont loggées mais n'interrompent pas le processus
- Le système continue même si Shopify échoue (codes générés localement)

### Clients Non Trouvés

- Si un client Shopify n'est pas trouvé, les récompenses sont quand même sauvegardées
- Les tags sont appliqués lors de la prochaine interaction

### Codes de Réduction

- Génération de codes uniques avec suffixe aléatoire
- Vérification d'unicité dans la base de données
- Gestion des expirations automatiques

## 🔄 Synchronisation

### Auto-refresh

La page client se synchronise automatiquement toutes les 30 secondes :

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    revalidator.revalidate();
  }, 30000);
  return () => clearInterval(interval);
}, [revalidator]);
```

### Webhooks Shopify

Les commandes payées déclenchent automatiquement l'attribution de points et l'application de récompenses.

## 🎯 Exemples d'Usage

### Configuration d'une Réduction Silver

```typescript
{
  tier: "Silver",
  rewardType: "discount",
  value: {
    percentage: 10,
    codePrefix: "SILVER",
    expiresInDays: 30,
    appliesOncePerCustomer: true
  },
  isActive: true
}
```

### Configuration de Livraison Gratuite Gold

```typescript
{
  tier: "Gold",
  rewardType: "free_shipping",
  value: {
    minimumOrder: 30,
    shippingZones: ["FR", "EU"],
    expiresInDays: 30
  },
  isActive: true
}
```

### Configuration d'Accès Exclusif Platinum

```typescript
{
  tier: "Platinum",
  rewardType: "exclusive_product",
  value: {
    productIds: ["123456", "789012"],
    collectionIds: ["exclusive-collection"],
    expiresInDays: 30
  },
  isActive: true
}
```

## 🚀 Déploiement

### Prérequis

1. Base de données Prisma configurée
2. Authentification Shopify fonctionnelle
3. Templates de récompenses initialisés

### Étapes

1. Exécuter les migrations Prisma
2. Initialiser les templates par défaut
3. Configurer les récompenses dans l'interface admin
4. Tester le workflow complet

### Tests

- Scanner un QR code loyalty
- Vérifier l'attribution des points
- Confirmer l'application des récompenses
- Tester l'affichage côté client

---

🎉 **Le système de récompenses Shopify est maintenant complètement opérationnel !**
