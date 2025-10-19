# QRFlow Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-15

### Added

- **Génération de QR Codes** : Création de QR codes personnalisables avec couleurs, logos et styles
- **Analytics en temps réel** : Suivi des scans, géolocalisation, détection d'appareils
- **Gestion de campagnes** : Création et suivi de campagnes marketing
- **Programme de fidélité** : Système de points et récompenses
- **Intégration Shopify native** : OAuth, Admin API, webhooks
- **Export multi-format** : PNG, SVG, PDF
- **Rate limiting** : Protection contre les abus (100 req/min/merchant)
- **Upload d'assets** : Support Cloudinary et AWS S3
- **Tests complets** : Tests unitaires et E2E
- **Déploiement** : Support Vercel, Railway, Docker

### Technical

- **Base de données** : PostgreSQL avec Prisma ORM
- **Framework** : Remix avec TypeScript
- **UI** : Polaris + Tailwind CSS
- **Sécurité** : Validation HMAC, sanitisation, CORS
- **Monitoring** : Health checks, logs, métriques

### Database Schema

- `merchants` : Informations des marchands
- `qrcodes` : QR codes créés
- `campaigns` : Campagnes marketing
- `loyalty_programs` : Programmes de fidélité
- `analytics_events` : Événements analytics
- `customer_points` : Points de fidélité clients
- `webhook_logs` : Logs des webhooks
- `rate_limits` : Limitation de débit

### API Endpoints

- `GET /scan/:slug` : Redirection QR code avec analytics
- `GET /app/qr-manager` : Gestion des QR codes
- `GET /app/analytics` : Analytics et rapports
- `GET /app/campaigns` : Gestion des campagnes
- `GET /app/loyalty` : Programme de fidélité
- `POST /api/uploads` : Upload d'images
- `GET /api/export/:id` : Export QR code
- `POST /webhooks/orders/paid` : Webhook commande payée
- `POST /webhooks/app/uninstalled` : Webhook app désinstallée

## [0.9.0] - 2024-01-10

### Added

- Structure de base du projet
- Configuration Shopify App
- Schema Prisma initial
- Composants UI de base

### Changed

- Migration de mock data vers base de données réelle
- Refactoring des routes pour utiliser Prisma

## [0.8.0] - 2024-01-05

### Added

- Mock data et localStorage
- Interface utilisateur de base
- Composants QR code
- Analytics mock

### Changed

- Architecture initiale
- Design system Polaris

## [Unreleased]

### Planned

- Intégration Shopify Discounts API
- Templates de QR codes
- API publique pour développeurs
- Webhooks personnalisés
- A/B Testing avancé
- Intégration email marketing
- Analytics prédictives
- Mobile app
- Multi-tenant
- White-label
- Intégrations tierces
- IA pour optimisation
