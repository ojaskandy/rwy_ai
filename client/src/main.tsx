import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './hooks/use-auth';
import "./index.css";

// 💥 Close the in-app browser when the native deep-link comes back
if (
  typeof window !== 'undefined' &&
  (window as any).Capacitor &&
  (window as any).Capacitor.Plugins?.Browser
) {
  window.addEventListener('magicLinkHandled', async () => {
    try {
      await (window as any).Capacitor.Plugins.Browser.close();
    } catch (err) {
      console.error('Failed to close in-app browser:', err);
    }
  });
}

// Add global CSS for Material Icons and custom styling specific to this app
const globalStyle = document.createElement('style');
globalStyle.textContent = `
  body {
    font-family: 'Roboto', sans-serif;
    background-color: hsl(var(--background));
    color: hsl(var(--foreground));
  }
  .camera-container {
    position: relative;
    overflow: hidden;
    border-radius: 8px;
  }
  canvas {
    position: absolute;
    top: 0;
    left: 0;
  }
  .loader {
    border: 4px solid rgba(3, 218, 198, 0.3);
    border-radius: 50%;
    border-top: 4px solid #03DAC6;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(globalStyle);

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
