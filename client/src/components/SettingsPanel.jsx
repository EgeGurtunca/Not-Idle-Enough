import { useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { saveGame } from '../game/save.js';
import { useT } from '../game/i18n.js';

// Minimal check that an imported JSON is actually a save
function isValidSave(data) {
  return (
    data &&
    typeof data === 'object' &&
    !Array.isArray(data) &&
    typeof data.gold === 'number' &&
    typeof data.stage === 'number'
  );
}

export default function SettingsPanel() {
  const muted = useGameStore((s) => s.muted);
  const toggleMuted = useGameStore((s) => s.toggleMuted);
  const lang = useGameStore((s) => s.lang);
  const setLang = useGameStore((s) => s.setLang);
  const { t } = useT();
  const [confirmReset, setConfirmReset] = useState(false);
  const [message, setMessage] = useState('');
  const fileRef = useRef(null);

  function exportSave() {
    const data = useGameStore.getState().getSaveData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `solo-fan-idle-save-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage(t('msg_downloaded'));
  }

  async function importSave(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!isValidSave(data)) throw new Error('invalid');
      useGameStore.getState().loadSaveData(data, null);
      saveGame();
      setMessage(t('msg_imported'));
    } catch {
      setMessage(t('msg_import_fail'));
    }
  }

  function resetSave() {
    const fresh = {
      gold: 0, crystals: 0, stage: 1, highestStage: 1, runHighestStage: 1, kills: 0,
      heroLevel: 0, heroUpgrades: {}, npcLevels: {}, prestigeLevels: {}, artifacts: {},
      totalPulls: 0, totalPrestiges: 0, stats: {}, achievements: {}, skillState: {},
      muted: useGameStore.getState().muted, lang: useGameStore.getState().lang, buyAmount: 1,
    };
    useGameStore.getState().loadSaveData(fresh, null);
    saveGame();
    setConfirmReset(false);
    setMessage(t('msg_reset'));
  }

  return (
    <div className="panel-content">
      <div className="row">
        <span className="row-emoji">🌐</span>
        <div className="row-info">
          <div className="row-name">{t('set_lang')}</div>
          <div className="row-sub">{t('set_lang_sub')}</div>
        </div>
        <div className="amount-toggle">
          <button
            type="button"
            className={`amount-btn ${lang === 'en' ? 'active' : ''}`}
            onClick={() => setLang('en')}
          >
            EN
          </button>
          <button
            type="button"
            className={`amount-btn ${lang === 'tr' ? 'active' : ''}`}
            onClick={() => setLang('tr')}
          >
            TR
          </button>
        </div>
      </div>

      <div className="row">
        <span className="row-emoji">{muted ? '🔇' : '🔊'}</span>
        <div className="row-info">
          <div className="row-name">{t('set_sound')}</div>
          <div className="row-sub">{t('set_sound_sub')}</div>
        </div>
        <button type="button" className="ghost" onClick={toggleMuted}>
          {muted ? t('on') : t('off')}
        </button>
      </div>

      <div className="row">
        <span className="row-emoji">📤</span>
        <div className="row-info">
          <div className="row-name">{t('set_io')}</div>
          <div className="row-sub">{t('set_io_sub')}</div>
        </div>
        <div className="confirm-buttons">
          <button type="button" className="ghost" onClick={exportSave}>
            {t('download')}
          </button>
          <button type="button" className="ghost" onClick={() => fileRef.current?.click()}>
            {t('upload')}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={importSave}
          />
        </div>
      </div>

      <div className="row danger-row">
        <span className="row-emoji">🧨</span>
        <div className="row-info">
          <div className="row-name">{t('set_reset')}</div>
          <div className="row-sub">{t('set_reset_sub')}</div>
        </div>
        {confirmReset ? (
          <div className="confirm-buttons">
            <button type="button" className="prestige-btn danger" onClick={resetSave}>
              {t('reset_yes')}
            </button>
            <button type="button" className="ghost" onClick={() => setConfirmReset(false)}>
              {t('cancel')}
            </button>
          </div>
        ) : (
          <button type="button" className="ghost" onClick={() => setConfirmReset(true)}>
            {t('reset')}
          </button>
        )}
      </div>

      {message && <div className="panel-note subtle">{message}</div>}
      <div className="panel-note subtle">{t('save_local_note')}</div>
    </div>
  );
}
