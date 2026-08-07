import { useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { saveGame, stashCurrentSave, hasPrevSave, restorePrevSave } from '../game/save.js';
import { isValidSave, migrateSave } from '../game/saveFormat.js';
import { useT } from '../game/i18n.js';

export default function SettingsPanel() {
  const muted = useGameStore((s) => s.muted);
  const toggleMuted = useGameStore((s) => s.toggleMuted);
  const fx3d = useGameStore((s) => s.fx3d);
  const toggleFx3d = useGameStore((s) => s.toggleFx3d);
  const volume = useGameStore((s) => s.volume);
  const setVolume = useGameStore((s) => s.setVolume);
  const lang = useGameStore((s) => s.lang);
  const setLang = useGameStore((s) => s.setLang);
  const { t } = useT();
  const [confirmReset, setConfirmReset] = useState(false);
  const [message, setMessage] = useState('');
  const [canUndo, setCanUndo] = useState(hasPrevSave());
  const fileRef = useRef(null);

  function exportSave() {
    const data = useGameStore.getState().getSaveData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incrementaloth-save-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage(t('msg_downloaded'));
  }

  async function importSave(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const data = migrateSave(JSON.parse(await file.text()));
      if (!isValidSave(data)) throw new Error('invalid');
      stashCurrentSave(); // yanlış dosya olursa geri alınabilsin
      useGameStore.getState().loadSaveData(data, null);
      saveGame();
      setCanUndo(hasPrevSave());
      setMessage(t('msg_imported'));
    } catch {
      setMessage(t('msg_import_fail'));
    }
  }

  function undoOverwrite() {
    const ok = restorePrevSave();
    setCanUndo(hasPrevSave());
    setMessage(t(ok ? 'msg_undone' : 'msg_undo_fail'));
  }

  function resetSave() {
    const fresh = {
      gold: 0, crystals: 0, stage: 1, highestStage: 1, runHighestStage: 1, kills: 0,
      heroLevel: 0, heroUpgrades: {}, npcLevels: {}, prestigeLevels: {}, artifacts: {},
      totalPulls: 0, totalPrestiges: 0, stats: {}, achievements: {}, skillState: {},
      muted: useGameStore.getState().muted, lang: useGameStore.getState().lang, buyAmount: 1,
    };
    stashCurrentSave(); // sıfırlama da geri alınabilir olsun
    useGameStore.getState().loadSaveData(fresh, null);
    saveGame();
    setConfirmReset(false);
    setCanUndo(hasPrevSave());
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

      {!muted && (
        <div className="row">
          <span className="row-emoji">🎚️</span>
          <div className="row-info">
            <div className="row-name">{t('set_volume')}</div>
            <div className="row-sub">{Math.round(volume * 100)}%</div>
          </div>
          <input
            type="range"
            className="volume"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            aria-label={t('set_volume')}
            onChange={(e) => setVolume(Number(e.target.value))}
          />
        </div>
      )}

      <div className="row">
        <span className="row-emoji">{fx3d ? '🎬' : '🔤'}</span>
        <div className="row-info">
          <div className="row-name">{t('set_fx3d')}</div>
          <div className="row-sub">{t('set_fx3d_sub')}</div>
        </div>
        <button type="button" className="ghost" onClick={toggleFx3d}>
          {fx3d ? t('on') : t('off')}
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

      {canUndo && (
        <div className="row">
          <span className="row-emoji">↩️</span>
          <div className="row-info">
            <div className="row-name">{t('set_undo')}</div>
            <div className="row-sub">{t('set_undo_sub')}</div>
          </div>
          <button type="button" className="ghost" onClick={undoOverwrite}>
            {t('undo')}
          </button>
        </div>
      )}

      {message && <div className="panel-note subtle">{message}</div>}
      <div className="panel-note subtle">{t('save_local_note')}</div>
      <div className="panel-note subtle version">Incrementaloth v{__APP_VERSION__}</div>
    </div>
  );
}
