import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useEffect } from "react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const to = url.searchParams.get("to");
  
  return json({ to });
};

export default function EmailRoute() {
  const { to } = useLoaderData<typeof loader>();
  
  useEffect(() => {
    // Try to open email client
    if (to) {
      window.location.href = to;
    }
  }, [to]);
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Ouverture de l'email</h1>
            <p className="text-gray-600">Ouverture de votre client email...</p>
          </div>
          
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <p className="text-gray-800 break-all">{to}</p>
          </div>
          
          <div className="text-sm text-gray-500">
            <p>Si votre client email ne s'ouvre pas automatiquement,</p>
            <p>cliquez sur le lien ci-dessus pour envoyer un email.</p>
          </div>
          
          <div className="mt-4">
            <a 
              href={to || '#'} 
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Ouvrir l'email
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
