import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
    try {
        const { payload, session, topic, shop } = await authenticate.webhook(request);
        console.log(`Received ${topic} webhook for ${shop}`);

        const current = payload.current as string[];
        if (session) {
            await prisma.session.update({   
                where: {
                    id: session.id
                },
                data: {
                    scope: current.toString(),
                },
            });
        }
        return new Response("OK", { status: 200 });
    } catch (error) {
        console.error(`Error processing ${request.url} webhook:`, error);
        return new Response("Error processing webhook", { status: 500 });
    }
};
