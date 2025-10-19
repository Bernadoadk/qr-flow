import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    // Utiliser la méthode authenticate.webhook qui valide automatiquement le HMAC
    const { shop, session, topic } = await authenticate.webhook(request);
    
    console.log(`Received ${topic} webhook for ${shop}`);
    
    // Ici vous pouvez traiter les webhooks génériques si nécessaire
    // Pour l'instant, on retourne juste une réponse 200 OK
    
    return new Response("OK", { status: 200 });
    
  } catch (error) {
    console.error("Webhook validation failed:", error);
    
    // Retourner 401 pour les requêtes non autorisées (HMAC invalide)
    // C'est exactement ce que Shopify attend pour valider la sécurité
    return new Response("Unauthorized", { status: 401 });
  }
};

// Gérer les autres méthodes HTTP
export const loader = async ({ request }: ActionFunctionArgs) => {
  return new Response("Method not allowed", { status: 405 });
};

