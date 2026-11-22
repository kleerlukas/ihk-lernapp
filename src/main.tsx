import { StrictMode, Component, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './index.css';

// Service Worker: App-Dateien werden gecacht → offline nutzbar, Updates kommen automatisch
registerSW({ immediate: true });

/** Letzte Absicherung: statt weißer Seite eine Meldung mit Neustart-Knopf. */
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="mx-auto max-w-md space-y-4 p-6 pt-16">
        <h1 className="text-xl font-bold">Hoppla, da ist etwas schiefgelaufen.</h1>
        <p className="text-sm text-stone-600 dark:text-stone-300">Dein Lernstand ist gespeichert. Starte die App neu.</p>
        <pre className="overflow-x-auto rounded-xl bg-stone-200 p-3 text-xs dark:bg-stone-800">{this.state.error.message}</pre>
        <button className="w-full rounded-2xl bg-teal-700 px-5 py-4 font-semibold text-white" onClick={() => location.reload()}>
          Neu laden
        </button>
      </div>
    );
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
