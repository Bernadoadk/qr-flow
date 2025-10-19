# QRFlow - Frontend Application

## 🚀 Vue d'ensemble

QRFlow est une application frontend complète pour la gestion de QR codes Shopify. Cette application React moderne offre une interface utilisateur intuitive pour créer, personnaliser, suivre et gérer des QR codes interactifs.

## ✨ Fonctionnalités

### 📊 Dashboard

- Vue d'ensemble des performances
- Statistiques en temps réel
- Graphiques interactifs avec Recharts
- Top QR codes les plus performants

### 🎯 QR Manager

- Création et édition de QR codes
- Personnalisation avancée (couleurs, styles, logos)
- Prévisualisation en temps réel
- Gestion des types (produit, URL, réduction, etc.)

### 📈 Analytics

- Analyses détaillées des scans
- Répartition géographique
- Types d'appareils
- Distribution horaire
- Filtres par période

### 🎪 Campaigns

- Gestion des campagnes marketing
- Suivi des budgets et ROI
- Métriques de performance
- Statuts et progression

### 🎁 Loyalty

- Programme de fidélité intégré
- Système de points et récompenses
- Niveaux de fidélité (Bronze, Argent, Or, Platine)
- Gestion des clients

### ⚙️ Settings

- Configuration du thème (clair/sombre)
- Personnalisation de la marque
- Paramètres de notifications
- Gestion des abonnements

## 🛠️ Technologies utilisées

- **React 18** - Framework UI
- **TypeScript** - Typage statique
- **Vite** - Build tool moderne
- **TailwindCSS** - Framework CSS
- **Zustand** - Gestion d'état
- **React Router DOM** - Routage
- **Recharts** - Graphiques
- **Framer Motion** - Animations
- **Lucide React** - Icônes
- **QR Code Styling** - Génération de QR codes

## 🚀 Installation et lancement

### Prérequis

- Node.js 18+
- npm ou yarn

### Installation

```bash
# Installer les dépendances
npm install

# Lancer l'application en mode développement
npm run frontend:dev
```

L'application sera accessible sur `http://localhost:5173`

### Scripts disponibles

```bash
# Développement
npm run frontend:dev

# Build de production
npm run frontend:build

# Prévisualisation du build
npm run frontend:preview
```

## 📁 Structure du projet

```
app/
├── components/          # Composants réutilisables
│   ├── ui/             # Composants UI de base
│   ├── layout/         # Composants de layout
│   ├── qr/             # Composants QR code
│   └── charts/         # Composants graphiques
├── pages/              # Pages principales
├── store/              # Store Zustand
├── utils/              # Utilitaires
├── mocks/              # Données mockées
├── App.tsx             # Composant principal
├── main.tsx            # Point d'entrée
└── index.css           # Styles globaux
```

## 🎨 Design System

### Palette de couleurs

- **Primaire**: Indigo (#6366f1)
- **Secondaire**: Violet (#8b5cf6)
- **Succès**: Vert (#22c55e)
- **Erreur**: Rouge (#ef4444)
- **Avertissement**: Orange (#f59e0b)

### Typographie

- **Police**: Inter (Google Fonts)
- **Tailles**: Responsive avec TailwindCSS

### Composants

- Design inspiré de Shopify Polaris
- Composants accessibles avec Radix UI
- Animations fluides avec Framer Motion

## 📊 Données mockées

L'application utilise des données mockées stockées dans le dossier `app/mocks/` :

- `qrData.json` - QR codes et métriques
- `analytics.json` - Données d'analyse
- `campaigns.json` - Campagnes marketing
- `loyalty.json` - Programme de fidélité

Les données sont persistées dans le localStorage du navigateur.

## 🔧 Configuration

### Variables d'environnement

Créez un fichier `.env.local` :

```env
VITE_APP_NAME=QRFlow
VITE_APP_VERSION=1.0.0
```

### Personnalisation

- **Thème**: Modifiable dans Settings
- **Couleurs**: Personnalisables dans le branding
- **Logo**: Upload possible dans les paramètres

## 📱 Responsive Design

L'application est entièrement responsive :

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

## 🎯 Fonctionnalités avancées

### QR Code Editor

- Génération en temps réel
- Personnalisation complète
- Téléchargement en PNG/SVG
- Validation des données

### Analytics

- Graphiques interactifs
- Filtres par période
- Export des données
- Métriques en temps réel

### Gestion d'état

- Store Zustand global
- Persistance localStorage
- Actions asynchrones
- Gestion des erreurs

## 🚀 Déploiement

### Build de production

```bash
npm run frontend:build
```

### Serveur statique

```bash
# Avec serve
npx serve dist

# Avec http-server
npx http-server dist
```

## 🔮 Roadmap

- [ ] Intégration Shopify OAuth
- [ ] Backend API réel
- [ ] Tests unitaires
- [ ] PWA support
- [ ] Internationalisation
- [ ] Mode hors ligne

## 📄 Licence

Ce projet est sous licence MIT.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :

1. Fork le projet
2. Créer une branche feature
3. Commit vos changements
4. Push vers la branche
5. Ouvrir une Pull Request

## 📞 Support

Pour toute question ou support :

- 📧 Email: support@qrflow.app
- 📱 Discord: QRFlow Community
- 📖 Documentation: docs.qrflow.app

---

**QRFlow** - Gestionnaire de QR Codes Shopify moderne et intuitif 🚀
