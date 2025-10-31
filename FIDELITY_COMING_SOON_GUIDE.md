# Mode "Coming Soon" pour la fonctionnalité Fidélité

Ce document explique comment utiliser le système de feature flags pour contrôler l'accès à la fonctionnalité Fidélité dans le projet QR Flow.

## 🎯 Objectif

Permettre de mettre la fonctionnalité "Fidélité" en mode "Coming Soon" dans deux endroits clés :

- Le sidebar (menu latéral)
- Le sélecteur de type de contenu lors de la création d'un QR code

## ⚙️ Configuration

### Fichier de configuration

Le flag de contrôle se trouve dans `app/config/features.ts` :

```typescript
export const FEATURES = {
  FIDELITY_ENABLED: false, // true = accessible, false = Coming Soon
} as const;
```

### Scripts de gestion

Deux commandes npm sont disponibles pour gérer facilement l'état de la fonctionnalité :

```bash
# Activer la fonctionnalité Fidélité
npm run fidelity:on

# Désactiver la fonctionnalité Fidélité (mode Coming Soon)
npm run fidelity:off
```

## 🎨 Comportement

### Quand `FIDELITY_ENABLED = false` (mode Coming Soon)

#### Dans le Sidebar

- Le bouton "Fidélité" reste visible mais non cliquable
- Curseur "not-allowed" au survol
- Tooltip avec le message :
  ```
  Programme de fidélité
  Bientôt disponible 🎉
  Cette fonctionnalité permettra de créer des programmes de fidélité personnalisés pour récompenser vos clients via des QR codes.
  ```

#### Dans le sélecteur de type QR

- Le type "Fidélité" est visible mais désactivé
- Style atténué (opacity-60, cursor-not-allowed)
- Tooltip avec le message :
  ```
  Fonctionnalité en cours de développement
  Le module de fidélité sera bientôt disponible pour créer des récompenses et points clients. 🧠
  ```

### Quand `FIDELITY_ENABLED = true` (mode normal)

- Fonctionnalité entièrement accessible
- Comportement normal sans restrictions

## 🔧 Utilisation pratique

### En développement local

```bash
# Activer pour travailler sur la fonctionnalité
npm run fidelity:on

# Désactiver pour tester le mode Coming Soon
npm run fidelity:off
```

### Avant déploiement

```bash
# Toujours désactiver avant un déploiement en production
npm run fidelity:off
```

## 📁 Fichiers modifiés

- `app/config/features.ts` - Configuration des feature flags
- `scripts/toggleFidelityAccess.js` - Script de gestion des flags
- `app/components/ui/Tooltip.tsx` - Composant tooltip réutilisable
- `app/routes/app.tsx` - Sidebar avec mode Coming Soon
- `app/routes/app.create.tsx` - Sélecteur de type QR avec mode Coming Soon
- `app/routes/app.qr-manager.tsx` - QR Manager avec mode Coming Soon
- `package.json` - Ajout des scripts npm

## 🎉 Résultat

✅ **En production** : La fonctionnalité Fidélité est visible mais bloquée avec un message "Coming Soon"

✅ **En local** : Possibilité d'activer la fonctionnalité via le script pour travailler dessus

✅ **Gestion simple** : Tout est contrôlé via un flag de configuration modifiable par script, sans variables d'environnement
