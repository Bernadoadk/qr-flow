import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useEffect } from "react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const number = url.searchParams.get("number");
  
  return json({ number });
};

export default function SMSRoute() {
  const { number } = useLoaderData<typeof loader>();
  
  useEffect(() => {
    // Try to open SMS app
    if (number) {
      window.location.href = number;
    }
  }, [number]);
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Message SMS</h1>
            <p className="text-gray-600">Ouverture de votre application SMS...</p>
          </div>
          
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <p className="text-gray-800 text-lg font-mono">{number}</p>
          </div>
          
          <div className="text-sm text-gray-500">
            <p>Si votre application SMS ne s'ouvre pas automatiquement,</p>
            <p>cliquez sur le bouton ci-dessous pour envoyer un SMS.</p>
          </div>
          
          <div className="mt-4">
            <a 
              href={number || '#'} 
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Envoyer SMS
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
