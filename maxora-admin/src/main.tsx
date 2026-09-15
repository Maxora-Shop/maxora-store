import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { TaxonomyProvider } from './context/TaxonomyContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <TaxonomyProvider>
        <App />
      </TaxonomyProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

