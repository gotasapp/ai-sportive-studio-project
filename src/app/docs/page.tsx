'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Importar Swagger UI dinamicamente para evitar problemas de SSR
const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#030303] to-[#0b0518]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF0052] mx-auto mb-4"></div>
        <p className="text-[#FDFDFD] text-lg">Loading API Documentation...</p>
      </div>
    </div>
  )
});

import 'swagger-ui-react/swagger-ui.css';

export default function ApiDocsPage() {
  const [swaggerSpec, setSwaggerSpec] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSwaggerSpec = async () => {
      try {
        const response = await fetch('/api/docs');
        if (!response.ok) {
          throw new Error('Failed to fetch API specification');
        }
        const spec = await response.json();
        setSwaggerSpec(spec);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchSwaggerSpec();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#030303] to-[#0b0518]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF0052] mx-auto mb-4"></div>
          <p className="text-[#FDFDFD] text-lg">Loading API Documentation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#030303] to-[#0b0518]">
        <div className="text-center">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 max-w-md">
            <h2 className="text-red-400 text-xl font-bold mb-2">Error Loading Documentation</h2>
            <p className="text-red-300">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#030303] to-[#0b0518]">
      {/* Header */}
      <div className="bg-black/20 border-b border-[#FDFDFD]/10 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#FDFDFD] mb-2">
                Jersey Generator AI - API Documentation
              </h1>
              <p className="text-[#FDFDFD]/70 text-lg">
                Complete REST API documentation for the NFT platform
              </p>
            </div>
            <div className="flex items-center gap-4">
              <a 
                href="/"
                className="px-4 py-2 bg-[#FF0052] text-white rounded-lg hover:bg-[#FF0052]/90 transition-colors"
              >
                ← Back to App
              </a>
              <a 
                href="https://github.com/VieiraJefferson/jersey-generator-ai"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Swagger UI Container */}
      <div className="swagger-container" style={{
        ['--swagger-ui-background-color' as any]: 'transparent',
        ['--swagger-ui-text-color' as any]: '#FDFDFD',
        ['--swagger-ui-border-color' as any]: 'rgba(253, 253, 253, 0.1)',
      } as React.CSSProperties}>
        {swaggerSpec && (
          <SwaggerUI
            spec={swaggerSpec}
            deepLinking={true}
            displayOperationId={false}
            defaultModelsExpandDepth={1}
            defaultModelExpandDepth={1}
            defaultModelRendering="example"
            displayRequestDuration={true}
            docExpansion="list"
            filter={true}
            showExtensions={true}
            showCommonExtensions={true}
            tryItOutEnabled={true}
            requestInterceptor={(request) => {
              // Add any global request modifications here
              request.headers['Content-Type'] = 'application/json';
              return request;
            }}
            responseInterceptor={(response) => {
              // Add any global response modifications here
              return response;
            }}
          />
        )}
      </div>

      {/* Custom Styles */}
      <style jsx global>{`
        .swagger-container {
          padding: 2rem;
          background: transparent;
        }
        
        .swagger-ui {
          background: transparent !important;
          color: #FDFDFD !important;
        }
        
        .swagger-ui .topbar {
          display: none;
        }
        
        .swagger-ui .info {
          margin: 0 0 2rem 0;
        }
        
        .swagger-ui .info .title {
          color: #FDFDFD !important;
        }
        
        .swagger-ui .info .description {
          color: rgba(253, 253, 253, 0.8) !important;
        }
        
        .swagger-ui .scheme-container {
          background: rgba(0, 0, 0, 0.2) !important;
          border: 1px solid rgba(253, 253, 253, 0.1) !important;
          border-radius: 8px;
          padding: 1rem;
        }
        
        .swagger-ui .opblock.opblock-get {
          background: rgba(97, 175, 254, 0.1) !important;
          border: 1px solid rgba(97, 175, 254, 0.3) !important;
        }
        
        .swagger-ui .opblock.opblock-post {
          background: rgba(73, 204, 144, 0.1) !important;
          border: 1px solid rgba(73, 204, 144, 0.3) !important;
        }
        
        .swagger-ui .opblock.opblock-put {
          background: rgba(252, 161, 48, 0.1) !important;
          border: 1px solid rgba(252, 161, 48, 0.3) !important;
        }
        
        .swagger-ui .opblock.opblock-delete {
          background: rgba(249, 62, 62, 0.1) !important;
          border: 1px solid rgba(249, 62, 62, 0.3) !important;
        }
        
        .swagger-ui .opblock-summary {
          color: #FDFDFD !important;
        }
        
        .swagger-ui .opblock-description-wrapper p {
          color: rgba(253, 253, 253, 0.8) !important;
        }
        
        .swagger-ui .btn {
          background: #FF0052 !important;
          color: white !important;
          border: none !important;
          border-radius: 6px !important;
        }
        
        .swagger-ui .btn:hover {
          background: rgba(255, 0, 82, 0.9) !important;
        }
        
        .swagger-ui .parameters-col_description p {
          color: rgba(253, 253, 253, 0.8) !important;
        }
        
        .swagger-ui .response-col_status {
          color: #FDFDFD !important;
        }
        
        .swagger-ui .response-col_description p {
          color: rgba(253, 253, 253, 0.8) !important;
        }
        
        .swagger-ui .model {
          background: rgba(0, 0, 0, 0.2) !important;
          border: 1px solid rgba(253, 253, 253, 0.1) !important;
          border-radius: 8px;
        }
        
        .swagger-ui .model-title {
          color: #FDFDFD !important;
        }
        
        .swagger-ui table {
          background: transparent !important;
        }
        
        .swagger-ui table thead tr td,
        .swagger-ui table thead tr th {
          color: #FDFDFD !important;
          border-bottom: 1px solid rgba(253, 253, 253, 0.1) !important;
        }
        
        .swagger-ui table tbody tr td {
          color: rgba(253, 253, 253, 0.8) !important;
          border-bottom: 1px solid rgba(253, 253, 253, 0.05) !important;
        }
        
        .swagger-ui .highlight-code {
          background: rgba(0, 0, 0, 0.3) !important;
          border-radius: 6px;
        }
        
        .swagger-ui .microlight {
          color: #FDFDFD !important;
        }
      `}</style>
    </div>
  );
}
