/// <reference types="vite-plugin-pwa/client" />
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import './styles/index.css';
import App from './App';
import { ThemeProvider, ToastProvider, LanguageProvider } from './hooks';
import { ToastNotification } from './components/ToastNotification';
import { ensureSeeded } from './lib/seed';
import { syncOnBoot } from './lib/sync';

// Auto-updating service worker (vite-plugin-pwa, registerType: 'autoUpdate').
registerSW({ immediate: true });

async function bootstrap() {
  // Populate the DB on first run before the first paint (idempotent).
  try {
    await ensureSeeded();
    await syncOnBoot();
  } catch (err) {
    console.error('LifeQuest bootstrap failed:', err);
  }

  const rootEl = document.getElementById('root');
  if (!rootEl) throw new Error('Root element #root not found');

  createRoot(rootEl).render(
    <StrictMode>
      <LanguageProvider>
        <ThemeProvider>
          <ToastProvider>
            <App />
            <ToastNotification />
          </ToastProvider>
        </ThemeProvider>
      </LanguageProvider>
    </StrictMode>,
  );
}

void bootstrap();
