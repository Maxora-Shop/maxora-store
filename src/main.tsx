import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import { TaxonomyProvider } from './context/TaxonomyContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <TaxonomyProvider>
        <App />
      </TaxonomyProvider>
    </ErrorBoundary>
  </StrictMode>,
);
