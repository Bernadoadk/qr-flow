# Configuration Vercel pour QR-Flow

## Problème de Pool de Connexions

L'erreur `Timed out fetching a new connection from the connection pool` indique que le pool de connexions Prisma est saturé sur Vercel.

## Solutions Recommandées

### 1. Configuration de la Base de Données

Assurez-vous que votre `DATABASE_URL` inclut les paramètres de pool :

```bash
DATABASE_URL="postgresql://user:password@host:port/database?connection_limit=1&pool_timeout=20&connect_timeout=60"
```

### 2. Variables d'Environnement Vercel

Ajoutez ces variables dans Vercel Dashboard :

```bash
# Optimisation du pool de connexions
DATABASE_URL="postgresql://user:password@host:port/database?connection_limit=1&pool_timeout=20&connect_timeout=60"

# Configuration Prisma
PRISMA_QUERY_ENGINE_LIBRARY=true
PRISMA_QUERY_ENGINE_BINARY=false
```

### 3. Configuration Alternative

Si le problème persiste, utilisez une approche avec connexion unique :

```typescript
// Dans db.server.ts
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + "?connection_limit=1&pool_timeout=20"
    }
  }
});
```

## Vérifications

1. **Base de données accessible** : Vérifiez que votre base de données PostgreSQL est accessible depuis Vercel
2. **Limites de connexion** : Assurez-vous que votre fournisseur de base de données permet suffisamment de connexions
3. **Timeout** : Augmentez les timeouts si nécessaire

## Monitoring

Surveillez les logs Vercel pour :
- Erreurs de connexion
- Timeouts de requêtes
- Saturation du pool
