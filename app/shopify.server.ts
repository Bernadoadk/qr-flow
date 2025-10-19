import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
  DeliveryMethod,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { prisma } from "./db.server";
import { getOrCreateMerchant } from "./utils/merchant.server";

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.January25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    removeRest: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
  hooks: {
    afterAuth: async ({ session }) => {
      // Create or update merchant when app is installed
      await getOrCreateMerchant(session.shop, session.accessToken);
      
      // Register webhooks
      await shopify.webhooks.addHandlers({
        ORDERS_PAID: {
          deliveryMethod: DeliveryMethod.Http,
          callbackUrl: "/webhooks/orders/paid",
        },
        APP_UNINSTALLED: {
          deliveryMethod: DeliveryMethod.Http,
          callbackUrl: "/webhooks/app/uninstalled",
        },
        ORDERS_CANCELLED: {
          deliveryMethod: DeliveryMethod.Http,
          callbackUrl: "/webhooks/orders/cancelled",
        },
        ORDERS_FULFILLED: {
          deliveryMethod: DeliveryMethod.Http,
          callbackUrl: "/webhooks/orders/fulfilled",
        },
      });
    },
  },
});

export default shopify;
export const apiVersion = ApiVersion.January25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
