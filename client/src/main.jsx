import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { useGameStore } from './store/gameStore.js';
import './styles.css';

createRoot(document.getElementById('root')).render(<App />);

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
