import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useEffect } from "react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const number = url.searchParams.get("number");
  
  return json({ number });
};

export default function PhoneRoute() {
  const { number } = useLoaderData<typeof loader>();
  
  useEffect(() => {
    // Try to open phone app
    if (number) {
      window.location.href = number;
    }
  }, [number]);
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Appel téléphonique</h1>
            <p className="text-gray-600">Ouverture de votre application téléphone...</p>
          </div>
          
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <p className="text-gray-800 text-lg font-mono">{number}</p>
          </div>
          
          <div className="text-sm text-gray-500">
            <p>Si votre application téléphone ne s'ouvre pas automatiquement,</p>
            <p>cliquez sur le bouton ci-dessous pour appeler ce numéro.</p>
          </div>
          
          <div className="mt-4">
            <a 
              href={number || '#'} 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Appeler
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
