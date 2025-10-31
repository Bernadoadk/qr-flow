import { json, type ActionFunctionArgs } from "@remix-run/node";
import { prisma } from "~/db.server";
import { ShopifyRewardsService } from "~/utils/shopify-rewards.server";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST" && request.method !== "DELETE") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await request.json();
    
    const { merchantId, template, templateId } = body;

    if (!merchantId) {
      return json({ error: "Missing merchantId" }, { status: 400 });
    }

    if (request.method === "POST") {
      // Create or update reward template
      if (!template) {
        return json({ error: "Missing template data" }, { status: 400 });
      }

      const { tier, rewardType, value, isActive } = template;

      if (!tier || !rewardType || !value) {
        return json({ error: "Missing required template fields" }, { status: 400 });
      }

      // Check if template already exists
      const existingTemplate = await prisma.rewardTemplates.findUnique({
        where: {
          merchantId_tier_rewardType: {
            merchantId,
            tier,
            rewardType
          }
        }
      });

      let savedTemplate;
      if (existingTemplate) {
        // Update existing template
        savedTemplate = await prisma.rewardTemplates.update({
          where: {
            merchantId_tier_rewardType: {
              merchantId,
              tier,
              rewardType
            }
          },
          data: {
            value,
            isActive: isActive ?? true
          }
        });
      } else {
        // Create new template
        savedTemplate = await prisma.rewardTemplates.create({
          data: {
            merchantId,
            tier,
            rewardType,
            value,
            isActive: isActive ?? true
          }
        });
      }

      return json({ 
        success: true, 
        template: savedTemplate,
        message: existingTemplate ? "Récompense modifiée avec succès" : "Récompense créée avec succès"
      });
    }

    if (request.method === "DELETE") {
      // Delete reward template
      if (!templateId) {
        return json({ error: "Missing templateId" }, { status: 400 });
      }

      await prisma.rewardTemplates.delete({
        where: {
          id: templateId
        }
      });

      return json({ 
        success: true, 
        message: "Récompense supprimée avec succès"
      });
    }

  } catch (error) {
    console.error("Error managing reward templates:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET endpoint for fetching templates
export async function loader({ request }: ActionFunctionArgs) {
  const url = new URL(request.url);
  const merchantId = url.searchParams.get("merchantId");

  if (!merchantId) {
    return json({ error: "Missing merchantId" }, { status: 400 });
  }

  try {
    const templates = await prisma.rewardTemplates.findMany({
      where: { merchantId },
      orderBy: [
        { tier: 'asc' },
        { rewardType: 'asc' }
      ]
    });

    return json({ 
      success: true, 
      templates 
    });

  } catch (error) {
    console.error("Error fetching reward templates:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
}
