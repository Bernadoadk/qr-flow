import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { Page } from "@shopify/polaris";
import React from 'react';
import QRDesigner from '../components/qr/QRDesigner';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  return json({ shop: session.shop });
};

export default function QRDesignerPage() {
  const { shop } = useLoaderData<typeof loader>();

  const handleConfigChange = (config: any) => {
    console.log('Configuration QR mise à jour:', config);
  };

  return (
    <Page>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <h1 className="text-3xl font-bold text-gray-900">
                Configurateur de QR Code
              </h1>
              <p className="mt-2 text-gray-600">
                Personnalisez votre QR code avec différents styles, patterns et logos
              </p>
            </div>
          </div>
        </div>
        
        <QRDesigner
          initialData={`https://${shop}/products/`}
          onConfigChange={handleConfigChange}
        />
      </div>
    </Page>
  );
}
