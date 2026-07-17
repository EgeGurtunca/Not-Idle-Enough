import { useEffect, useState } from 'react';
import { useGameStore, selectors } from './store/gameStore.js';
import { loadGame, setupAutosave } from './game/save.js';
import { startLoop } from './game/loop.js';
import TopBar from './components/TopBar.jsx';
import BattleArea from './components/BattleArea.jsx';
import HeroPanel from './components/HeroPanel.jsx';
import NpcPanel from './components/NpcPanel.jsx';
import ArtifactPanel from './components/ArtifactPanel.jsx';
import PrestigePanel from './components/PrestigePanel.jsx';
import OfflineModal from './components/OfflineModal.jsx';

let booted = false;
async function boot() {
  if (booted) return;
  booted = true;
  await loadGame();
  startLoop();
  setupAutosave();
}

const TABS = [
  { id: 'hero', label: 'Kahraman' },
  { id: 'npc', label: 'Yoldaşlar' },
  { id: 'artifact', label: 'Sandık' },
  { id: 'prestige', label: 'Prestij' },
];

export default function App() {
  const loaded = useGameStore((s) => s.loaded);
  const canPrestige = useGameStore(selectors.canPrestige);
  const [tab, setTab] = useState('hero');

  useEffect(() => {
    boot();
  }, []);

  if (!loaded) {
    return <div className="loading">Zindan kapıları açılıyor…</div>;
  }

  return (
    <div className="app">
      <TopBar />
      <main className="main">
        <BattleArea />
        <aside className="panel">
          <nav className="tabs">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`tab ${tab === t.id ? 'active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
                {t.id === 'prestige' && canPrestige && <span className="tab-dot" />}
              </button>
            ))}
          </nav>
          <div className="tab-body">
            {tab === 'hero' && <HeroPanel />}
            {tab === 'npc' && <NpcPanel />}
            {tab === 'artifact' && <ArtifactPanel />}
            {tab === 'prestige' && <PrestigePanel />}
          </div>
        </aside>
      </main>
      <OfflineModal />
    </div>
  );
}
