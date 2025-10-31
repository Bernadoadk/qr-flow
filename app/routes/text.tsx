import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const content = url.searchParams.get("content");
  
  return json({ content });
};

export default function TextRoute() {
  const { content } = useLoaderData<typeof loader>();
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Contenu du QR Code</h1>
            <p className="text-gray-600">Voici le texte encodé dans ce QR code :</p>
          </div>
          
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <p className="text-gray-800 whitespace-pre-wrap break-words">{content}</p>
          </div>
          
          <div className="text-sm text-gray-500">
            <p>Ce QR code contient du texte brut.</p>
            <p>Vous pouvez le copier et l'utiliser comme bon vous semble.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
