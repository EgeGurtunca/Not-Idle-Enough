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
import TranscendPanel from './components/TranscendPanel.jsx';
import AchievementsPanel from './components/AchievementsPanel.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';
import OfflineModal from './components/OfflineModal.jsx';

let booted = false;
async function boot() {
  if (booted) return;
  booted = true;
  await loadGame();
  startLoop();
  setupAutosave();
}

export default function App() {
  const loaded = useGameStore((s) => s.loaded);
  const canPrestige = useGameStore(selectors.canPrestige);
  const transcendUnlocked = useGameStore(selectors.transcendUnlocked);
  const canTranscend = useGameStore((s) => selectors.transcendGain(s) > 0);
  const toast = useGameStore((s) => s.toast);
  const [tab, setTab] = useState('hero');

  // Aşkınlık sekmesi yalnızca Bölge 500'e ulaşınca belirir
  const TABS = [
    { id: 'hero', label: 'Kahraman' },
    { id: 'npc', label: 'Yoldaşlar' },
    { id: 'artifact', label: 'Sandık' },
    { id: 'prestige', label: 'Prestij' },
    ...(transcendUnlocked ? [{ id: 'transcend', label: 'Aşkınlık' }] : []),
    { id: 'achievements', label: 'Başarım' },
    { id: 'settings', label: 'Ayarlar' },
  ];

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
                {t.id === 'transcend' && canTranscend && <span className="tab-dot stardust-dot" />}
              </button>
            ))}
          </nav>
          <div className="tab-body">
            {tab === 'hero' && <HeroPanel />}
            {tab === 'npc' && <NpcPanel />}
            {tab === 'artifact' && <ArtifactPanel />}
            {tab === 'prestige' && <PrestigePanel />}
            {tab === 'transcend' && <TranscendPanel />}
            {tab === 'achievements' && <AchievementsPanel />}
            {tab === 'settings' && <SettingsPanel />}
          </div>
        </aside>
      </main>
      {toast && (
        <div className="toast" key={toast.id}>
          {toast.text}
        </div>
      )}
      <OfflineModal />
    </div>
  );
}
