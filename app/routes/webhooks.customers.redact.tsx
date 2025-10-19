import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { prisma } from "~/db.server";

export async function action({ request }: ActionFunctionArgs) {
  // Vérifier que c'est une requête POST avec JSON
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const contentType = request.headers.get("Content-Type");
  if (!contentType || !contentType.includes("application/json")) {
    return json({ error: "Invalid content type" }, { status: 400 });
  }

  try {
    const payload = await request.json();
    const { shop_id, shop_domain, customer, orders_to_redact } = payload;

    console.log("Received customers/redact webhook:", {
      shop_id,
      shop_domain,
      customer_id: customer?.id,
      customer_email: customer?.email,
      orders_to_redact
    });

    // Trouver la boutique dans notre base de données
    const merchant = await prisma.merchant.findUnique({
      where: { shopifyDomain: shop_domain }
    });

    if (!merchant) {
      console.log(`Merchant not found: ${shop_domain}`);
      return json({ message: "Merchant not found" }, { status: 404 });
    }

    let redactionResults = {
      qr_codes_redacted: 0,
      campaigns_redacted: 0,
      analytics_events_redacted: 0,
      loyalty_points_redacted: 0,
      errors: [] as string[]
    };

    // Anonymiser les QR codes liés à ce client
    if (customer?.id || customer?.email) {
      try {
        const qrCodes = await prisma.qRCode.findMany({
          where: {
            merchantId: merchant.id,
            ...(customer?.email && {
              OR: [
                { destination: { contains: customer.email } },
                { title: { contains: customer.email } }
              ]
            })
          }
        });

        for (const qrCode of qrCodes) {
          try {
            // Anonymiser les champs contenant l'email du client
            const anonymizedDestination = qrCode.destination ? 
              qrCode.destination.replace(
                new RegExp(customer.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
                '[REDACTED]'
              ) : null;

            const anonymizedTitle = qrCode.title ? 
              qrCode.title.replace(
                new RegExp(customer.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
                '[REDACTED]'
              ) : null;

            await prisma.qRCode.update({
              where: { id: qrCode.id },
              data: {
                ...(anonymizedDestination !== null && { destination: anonymizedDestination }),
                ...(anonymizedTitle !== null && { title: anonymizedTitle })
              }
            });

            redactionResults.qr_codes_redacted++;
          } catch (error) {
            redactionResults.errors.push(`Error redacting QR code ${qrCode.id}: ${error}`);
          }
        }
      } catch (error) {
        redactionResults.errors.push(`Error processing QR codes: ${error}`);
      }
    }

    // Anonymiser les campagnes liées à ce client
    if (customer?.id || customer?.email) {
      try {
        const campaigns = await prisma.campaign.findMany({
          where: {
            merchantId: merchant.id,
            ...(customer?.email && {
              OR: [
                { name: { contains: customer.email } },
                { description: { contains: customer.email } }
              ]
            })
          }
        });

        for (const campaign of campaigns) {
          try {
            // Anonymiser les champs contenant l'email du client
            const anonymizedName = campaign.name ? 
              campaign.name.replace(
                new RegExp(customer.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
                '[REDACTED]'
              ) : null;

            const anonymizedDescription = campaign.description ? 
              campaign.description.replace(
                new RegExp(customer.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
                '[REDACTED]'
              ) : null;

            await prisma.campaign.update({
              where: { id: campaign.id },
              data: {
                ...(anonymizedName !== null && { name: anonymizedName }),
                ...(anonymizedDescription !== null && { description: anonymizedDescription })
              }
            });

            redactionResults.campaigns_redacted++;
          } catch (error) {
            redactionResults.errors.push(`Error redacting campaign ${campaign.id}: ${error}`);
          }
        }
      } catch (error) {
        redactionResults.errors.push(`Error processing campaigns: ${error}`);
      }
    }

    // Anonymiser les événements analytics liés à ce client
    if (customer?.id || customer?.email) {
      try {
        // Les événements analytics n'ont pas de champ direct pour l'email client
        // On peut chercher dans les métadonnées JSON
        const analyticsEvents = await prisma.analyticsEvent.findMany({
          where: {
            // Rechercher dans les métadonnées JSON
            meta: {
              path: [],
              string_contains: customer.email
            }
          }
        });

        for (const event of analyticsEvents) {
          try {
            // Anonymiser les métadonnées JSON
            if (event.meta && typeof event.meta === 'object') {
              const anonymizedMeta = JSON.stringify(event.meta).replace(
                new RegExp(customer.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
                '[REDACTED]'
              );

              await prisma.analyticsEvent.update({
                where: { id: event.id },
                data: {
                  meta: JSON.parse(anonymizedMeta)
                }
              });

              redactionResults.analytics_events_redacted++;
            }
          } catch (error) {
            redactionResults.errors.push(`Error redacting analytics event ${event.id}: ${error}`);
          }
        }
      } catch (error) {
        redactionResults.errors.push(`Error processing analytics events: ${error}`);
      }
    }

    // Supprimer les points de fidélité du client
    if (customer?.email) {
      try {
        const deletedPoints = await prisma.customerPoints.deleteMany({
          where: {
            merchantId: merchant.id,
            customerId: customer.email
          }
        });

        redactionResults.loyalty_points_redacted = deletedPoints.count;
      } catch (error) {
        redactionResults.errors.push(`Error deleting loyalty points: ${error}`);
      }
    }

    // Log pour audit
    console.log(`Customer redaction processed for merchant ${shop_domain}, customer ${customer?.id}:`, redactionResults);

    // Retourner le résultat de la suppression
    return json({
      message: "Customer redaction processed successfully",
      customer_id: customer?.id,
      shop_domain,
      redaction_results: redactionResults
    });

  } catch (error) {
    console.error("Error processing customers/redact webhook:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}

