import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary, { CrashScreen } from './components/ErrorBoundary.jsx';
import { useGameStore } from './store/gameStore.js';
// Fontlar pakete gömülü: çevrimdışı çalışır ve ziyaretçi Google'a istek atmaz.
// latin + latin-ext birlikte; latin-ext olmadan Türkçe ş/ğ/ı bozulur.
import '@fontsource/grenze-gotisch/latin-400.css';
import '@fontsource/grenze-gotisch/latin-ext-400.css';
import '@fontsource/grenze-gotisch/latin-700.css';
import '@fontsource/grenze-gotisch/latin-ext-700.css';
import '@fontsource/alegreya-sans/latin-400.css';
import '@fontsource/alegreya-sans/latin-ext-400.css';
import '@fontsource/alegreya-sans/latin-700.css';
import '@fontsource/alegreya-sans/latin-ext-700.css';
import '@fontsource/alegreya-sans/latin-800.css';
import '@fontsource/alegreya-sans/latin-ext-800.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import '@fontsource/ibm-plex-mono/latin-ext-500.css';
import '@fontsource/ibm-plex-mono/latin-600.css';
import '@fontsource/ibm-plex-mono/latin-ext-600.css';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <ErrorBoundary label="App" fallback={<CrashScreen />}>
    <App />
  </ErrorBoundary>
);

// Çevrimdışı oynanabilirlik (yalnızca yayın derlemesinde; dev'de önbellek karışıklığı olmasın)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

// Geliştirme yardımcıları: konsoldan __dev.gold(1e9), __dev.stage(100) vb.
if (import.meta.env.DEV) {
  window.__dev = {
    store: useGameStore,
    gold(n = 1e6) {
      useGameStore.setState((s) => ({ gold: s.gold + n }));
    },
    crystals(n = 100) {
      useGameStore.setState((s) => ({ crystals: s.crystals + n }));
    },
    stage(n) {
      const st = useGameStore.getState();
      st.loadSaveData(
        {
          ...st.getSaveData(),
          stage: n,
          runHighestStage: Math.max(st.runHighestStage, n),
          highestStage: Math.max(st.highestStage, n),
          kills: 0,
        },
        null
      );
    },
  };
}
