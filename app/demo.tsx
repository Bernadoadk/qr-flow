import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Demo component to showcase the application
const Demo: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Header */}
      <div className="bg-indigo-600 text-white py-4 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold">QRFlow - Demo Application</h1>
          <p className="text-indigo-200 mt-1">
            Application de démonstration - Frontend complet avec données mockées
          </p>
        </div>
      </div>
      
      {/* Main App */}
      <App />
      
      {/* Demo Footer */}
      <div className="bg-white border-t border-gray-200 py-6 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-600">
            🚀 <strong>QRFlow</strong> - Gestionnaire de QR Codes Shopify
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Frontend complet avec React, TypeScript, TailwindCSS, Zustand, Recharts et Framer Motion
          </p>
        </div>
      </div>
    </div>
  );
};

// Initialize the demo
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<Demo />);
}
