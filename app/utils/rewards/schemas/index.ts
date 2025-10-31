export const discountRewardSchema = {
  type: "object",
  required: ["reward_type", "title", "description", "discount_scope", "percentage", "code_prefix"],
  properties: {
    reward_type: {
      type: "string",
      enum: ["discount"],
      description: "Type de récompense"
    },
    title: {
      type: "string",
      minLength: 1,
      maxLength: 100,
      description: "Nom affiché de la récompense"
    },
    description: {
      type: "string",
      minLength: 1,
      maxLength: 500,
      description: "Description explicative pour le client"
    },
    discount_scope: {
      type: "string",
      enum: ["order", "product"],
      description: "Portée de la réduction : commande entière ou produits spécifiques"
    },
    percentage: {
      type: "number",
      minimum: 1,
      maximum: 100,
      description: "Pourcentage de réduction"
    },
    code_prefix: {
      type: "string",
      minLength: 2,
      maxLength: 20,
      pattern: "^[A-Z0-9_]+$",
      description: "Préfixe du code de réduction"
    },
    minimum_order_amount: {
      type: "number",
      minimum: 0,
      description: "Montant minimum de commande pour appliquer la réduction"
    },
    maximum_discount_amount: {
      type: ["number", "null"],
      minimum: 0,
      description: "Montant maximum de réduction (optionnel)"
    },
    target_products: {
      type: "array",
      items: {
        type: "string"
      },
      description: "IDs des produits ciblés (obligatoire si discount_scope = 'product')"
    },
    target_collections: {
      type: "array",
      items: {
        type: "string"
      },
      description: "IDs des collections ciblées (obligatoire si discount_scope = 'product')"
    },
    applies_once_per_customer: {
      type: "boolean",
      description: "La réduction ne peut être utilisée qu'une fois par client"
    },
    duration_days: {
      type: ["number", "null"],
      minimum: 1,
      maximum: 365,
      description: "Durée de validité en jours (null = permanent)"
    },
    active: {
      type: "boolean",
      description: "Récompense active"
    },
    usage_count: {
      type: "number",
      minimum: 0,
      description: "Nombre d'utilisations actuelles"
    },
    max_uses: {
      type: ["number", "null"],
      minimum: 1,
      description: "Limite d'utilisations (null = illimité)"
    },
    activation_delay_days: {
      type: "number",
      minimum: 0,
      maximum: 30,
      description: "Délai en jours avant activation"
    }
  },
  additionalProperties: false
};

export const freeShippingRewardSchema = {
  type: "object",
  required: ["reward_type", "title", "description", "eligible_zones", "minimum_order_amount"],
  properties: {
    reward_type: {
      type: "string",
      enum: ["free_shipping"],
      description: "Type de récompense"
    },
    title: {
      type: "string",
      minLength: 1,
      maxLength: 100,
      description: "Nom affiché de la récompense"
    },
    description: {
      type: "string",
      minLength: 1,
      maxLength: 500,
      description: "Description explicative pour le client"
    },
    eligible_zones: {
      type: "string",
      enum: ["all", "local", "international"],
      description: "Zones éligibles pour la livraison gratuite"
    },
    minimum_order_amount: {
      type: "number",
      minimum: 0,
      description: "Montant minimum de commande pour la livraison gratuite"
    },
    requires_code: {
      type: "boolean",
      description: "Génère un code de livraison gratuite"
    },
    duration_days: {
      type: ["number", "null"],
      minimum: 1,
      maximum: 365,
      description: "Durée de validité en jours (null = permanent)"
    },
    active: {
      type: "boolean",
      description: "Récompense active"
    },
    usage_count: {
      type: "number",
      minimum: 0,
      description: "Nombre d'utilisations actuelles"
    },
    max_uses: {
      type: ["number", "null"],
      minimum: 1,
      description: "Limite d'utilisations (null = illimité)"
    },
    activation_delay_days: {
      type: "number",
      minimum: 0,
      maximum: 30,
      description: "Délai en jours avant activation"
    },
    shipping_methods: {
      type: "array",
      items: {
        type: "string"
      },
      description: "Méthodes de livraison spécifiques"
    },
    excluded_zones: {
      type: "array",
      items: {
        type: "string"
      },
      description: "Zones exclues de la livraison gratuite"
    }
  },
  additionalProperties: false
};

export const exclusiveProductRewardSchema = {
  type: "object",
  required: ["reward_type", "title", "description", "access_type", "access_logic"],
  properties: {
    reward_type: {
      type: "string",
      enum: ["exclusive_product"],
      description: "Type de récompense"
    },
    title: {
      type: "string",
      minLength: 1,
      maxLength: 100,
      description: "Nom affiché de la récompense"
    },
    description: {
      type: "string",
      minLength: 1,
      maxLength: 500,
      description: "Description explicative pour le client"
    },
    access_type: {
      type: "string",
      enum: ["offered", "exclusive"],
      description: "Type d'accès : offert ou exclusif"
    },
    access_logic: {
      type: "string",
      enum: ["hidden_from_non_members", "public_with_tag_filter"],
      description: "Logique d'accès aux produits"
    },
    product_ids: {
      type: "array",
      items: {
        type: "string"
      },
      description: "IDs des produits exclusifs"
    },
    collection_ids: {
      type: "array",
      items: {
        type: "string"
      },
      description: "IDs des collections exclusives"
    },
    max_quantity_per_customer: {
      type: ["number", "null"],
      minimum: 1,
      description: "Quantité maximum par client"
    },
    duration_days: {
      type: ["number", "null"],
      minimum: 1,
      maximum: 365,
      description: "Durée de validité en jours (null = permanent)"
    },
    active: {
      type: "boolean",
      description: "Récompense active"
    },
    usage_count: {
      type: "number",
      minimum: 0,
      description: "Nombre d'utilisations actuelles"
    },
    max_uses: {
      type: ["number", "null"],
      minimum: 1,
      description: "Limite d'utilisations (null = illimité)"
    },
    activation_delay_days: {
      type: "number",
      minimum: 0,
      maximum: 30,
      description: "Délai en jours avant activation"
    },
    discount_percentage: {
      type: "number",
      minimum: 0,
      maximum: 100,
      description: "Réduction supplémentaire sur les produits exclusifs"
    },
    priority_access: {
      type: "boolean",
      description: "Accès prioritaire aux nouveaux produits"
    },
    auto_add_to_cart: {
      type: "boolean",
      description: "Ajout automatique au panier (si access_type = 'offered')"
    },
    shopify_customer_tag: {
      type: "string",
      minLength: 1,
      maxLength: 50,
      description: "Tag Shopify appliqué au client"
    }
  },
  additionalProperties: false
};

export const earlyAccessRewardSchema = {
  type: "object",
  required: ["reward_type", "title", "description", "event_type", "access_start_date", "access_end_date"],
  properties: {
    reward_type: {
      type: "string",
      enum: ["early_access"],
      description: "Type de récompense"
    },
    title: {
      type: "string",
      minLength: 1,
      maxLength: 100,
      description: "Nom affiché de la récompense"
    },
    description: {
      type: "string",
      minLength: 1,
      maxLength: 500,
      description: "Description explicative pour le client"
    },
    event_type: {
      type: "string",
      enum: ["product_launch", "collection_sale", "private_sale"],
      description: "Type d'événement d'accès anticipé"
    },
    access_start_date: {
      type: "string",
      format: "date-time",
      description: "Date de début d'accès anticipé"
    },
    access_end_date: {
      type: "string",
      format: "date-time",
      description: "Date de fin d'accès anticipé"
    },
    grace_period_hours: {
      type: "number",
      minimum: 0,
      maximum: 168, // 7 jours max
      description: "Période de grâce en heures après la fin officielle"
    },
    collections_concerned: {
      type: "array",
      items: {
        type: "string"
      },
      description: "Collections concernées par l'accès anticipé"
    },
    product_ids: {
      type: "array",
      items: {
        type: "string"
      },
      description: "Produits spécifiques concernés"
    },
    discount_percentage: {
      type: "number",
      minimum: 0,
      maximum: 100,
      description: "Réduction supplémentaire pour l'accès anticipé"
    },
    active: {
      type: "boolean",
      description: "Récompense active"
    },
    usage_count: {
      type: "number",
      minimum: 0,
      description: "Nombre d'utilisations actuelles"
    },
    max_uses: {
      type: ["number", "null"],
      minimum: 1,
      description: "Limite d'utilisations (null = illimité)"
    },
    activation_delay_days: {
      type: "number",
      minimum: 0,
      maximum: 30,
      description: "Délai en jours avant activation"
    },
    notification_enabled: {
      type: "boolean",
      description: "Notifications automatiques activées"
    },
    shopify_customer_tag: {
      type: "string",
      minLength: 1,
      maxLength: 50,
      description: "Tag Shopify appliqué au client"
    }
  },
  additionalProperties: false
};

// Schéma global pour toutes les récompenses
export const rewardTemplateSchema = {
  type: "object",
  required: ["id", "merchant_id", "tier", "reward_type", "title", "description", "configuration", "active"],
  properties: {
    id: {
      type: "string",
      description: "Identifiant unique de la récompense"
    },
    merchant_id: {
      type: "string",
      description: "Identifiant du marchand"
    },
    tier: {
      type: "string",
      enum: ["Bronze", "Silver", "Gold", "Platinum"],
      description: "Palier de fidélité"
    },
    reward_type: {
      type: "string",
      enum: ["discount", "free_shipping", "exclusive_product", "early_access"],
      description: "Type de récompense"
    },
    title: {
      type: "string",
      minLength: 1,
      maxLength: 100,
      description: "Nom affiché de la récompense"
    },
    description: {
      type: "string",
      minLength: 1,
      maxLength: 500,
      description: "Description explicative pour le client"
    },
    configuration: {
      oneOf: [
        discountRewardSchema,
        freeShippingRewardSchema,
        exclusiveProductRewardSchema,
        earlyAccessRewardSchema
      ],
      description: "Configuration spécifique selon le type de récompense"
    },
    active: {
      type: "boolean",
      description: "Récompense active"
    },
    usage_count: {
      type: "number",
      minimum: 0,
      description: "Nombre d'utilisations actuelles"
    },
    max_uses: {
      type: ["number", "null"],
      minimum: 1,
      description: "Limite d'utilisations (null = illimité)"
    },
    duration_days: {
      type: ["number", "null"],
      minimum: 1,
      maximum: 365,
      description: "Durée de validité en jours (null = permanent)"
    },
    activation_delay_days: {
      type: "number",
      minimum: 0,
      maximum: 30,
      description: "Délai en jours avant activation"
    },
    created_at: {
      type: "string",
      format: "date-time",
      description: "Date de création"
    },
    updated_at: {
      type: "string",
      format: "date-time",
      description: "Date de dernière modification"
    },
    shopify_integration: {
      type: "object",
      properties: {
        price_rule_id: {
          type: ["string", "null"],
          description: "ID de la PriceRule Shopify"
        },
        shipping_discount_id: {
          type: ["string", "null"],
          description: "ID du code de livraison gratuite Shopify"
        },
        customer_tag: {
          type: ["string", "null"],
          description: "Tag client Shopify"
        },
        last_sync: {
          type: ["string", "null"],
          format: "date-time",
          description: "Dernière synchronisation avec Shopify"
        }
      },
      additionalProperties: false
    }
  },
  additionalProperties: false
};

// Fonction de validation
export function validateRewardTemplate(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validation basique
  if (!data.reward_type) {
    errors.push("Le type de récompense est requis");
  }
  
  if (!data.title || data.title.trim().length === 0) {
    errors.push("Le titre est requis");
  }
  
  if (!data.description || data.description.trim().length === 0) {
    errors.push("La description est requise");
  }
  
  // Validation spécifique selon le type
  switch (data.reward_type) {
    case "discount":
      if (!data.discount_scope) {
        errors.push("La portée de la réduction est requise");
      }
      if (!data.percentage || data.percentage < 1 || data.percentage > 100) {
        errors.push("Le pourcentage doit être entre 1 et 100");
      }
      if (data.discount_scope === "product" && (!data.target_products || data.target_products.length === 0)) {
        errors.push("Les produits ciblés sont requis pour une réduction sur produits");
      }
      break;
      
    case "free_shipping":
      if (!data.eligible_zones) {
        errors.push("Les zones éligibles sont requises");
      }
      if (data.minimum_order_amount < 0) {
        errors.push("Le montant minimum ne peut pas être négatif");
      }
      break;
      
    case "exclusive_product":
      if (!data.access_type) {
        errors.push("Le type d'accès est requis");
      }
      if (!data.access_logic) {
        errors.push("La logique d'accès est requise");
      }
      break;
      
    case "early_access":
      if (!data.event_type) {
        errors.push("Le type d'événement est requis");
      }
      if (!data.access_start_date) {
        errors.push("La date de début d'accès est requise");
      }
      if (!data.access_end_date) {
        errors.push("La date de fin d'accès est requise");
      }
      if (new Date(data.access_start_date) >= new Date(data.access_end_date)) {
        errors.push("La date de fin doit être postérieure à la date de début");
      }
      break;
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

