import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { saveGame } from '../game/save.js';
import { fmt } from '../utils/format.js';

// İçe aktarılan JSON'un gerçekten bir kayıt olduğuna dair asgari kontrol
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
  const [backups, setBackups] = useState(null);
  const [confirmRestore, setConfirmRestore] = useState(null); // backup id
  const [confirmReset, setConfirmReset] = useState(false);
  const [message, setMessage] = useState('');
  const fileRef = useRef(null);

  async function loadBackups() {
    try {
      const res = await fetch('/api/backups');
      setBackups(await res.json());
    } catch {
      setBackups([]);
    }
  }

  useEffect(() => {
    loadBackups();
  }, []);

  function exportSave() {
    const data = useGameStore.getState().getSaveData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `solo-fan-idle-kayit-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage('Kayıt indirildi.');
  }

  async function importSave(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!isValidSave(data)) throw new Error('geçersiz');
      useGameStore.getState().loadSaveData(data, null);
      await saveGame();
      setMessage('Kayıt içe aktarıldı ve sunucuya yazıldı.');
    } catch {
      setMessage('Dosya okunamadı: geçerli bir kayıt JSON\'u değil.');
    }
  }

  async function restoreBackup(id) {
    try {
      const res = await fetch(`/api/backups/${id}/restore`, { method: 'POST' });
      const body = await res.json();
      if (!body.ok) throw new Error();
      useGameStore.getState().loadSaveData(body.data, null);
      setConfirmRestore(null);
      setMessage('Yedek geri yüklendi.');
    } catch {
      setMessage('Yedek geri yüklenemedi.');
    }
  }

  async function resetSave() {
    const fresh = {
      gold: 0, crystals: 0, stage: 1, highestStage: 1, runHighestStage: 1, kills: 0,
      heroLevel: 0, heroUpgrades: {}, npcLevels: {}, prestigeLevels: {}, artifacts: {},
      totalPulls: 0, totalPrestiges: 0, stats: {}, achievements: {}, skillState: {},
      muted: useGameStore.getState().muted, buyAmount: 1,
    };
    useGameStore.getState().loadSaveData(fresh, null);
    await saveGame();
    setConfirmReset(false);
    setMessage('Oyun sıfırlandı. (Gerekirse yukarıdaki yedeklerden geri dönebilirsin.)');
  }

  return (
    <div className="panel-content">
      <div className="row">
        <span className="row-emoji">{muted ? '🔇' : '🔊'}</span>
        <div className="row-info">
          <div className="row-name">Ses Efektleri</div>
          <div className="row-sub">Vuruş, kritik, boss ve sandık sesleri</div>
        </div>
        <button type="button" className="ghost" onClick={toggleMuted}>
          {muted ? 'Aç' : 'Kapat'}
        </button>
      </div>

      <div className="row">
        <span className="row-emoji">📤</span>
        <div className="row-info">
          <div className="row-name">Kaydı Dışa / İçe Aktar</div>
          <div className="row-sub">JSON dosyası olarak indir veya geri yükle</div>
        </div>
        <div className="confirm-buttons">
          <button type="button" className="ghost" onClick={exportSave}>
            İndir
          </button>
          <button type="button" className="ghost" onClick={() => fileRef.current?.click()}>
            Yükle
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
          <div className="row-name">Oyunu Sıfırla</div>
          <div className="row-sub">Her şey silinir — yedekler durur, geri dönülebilir</div>
        </div>
        {confirmReset ? (
          <div className="confirm-buttons">
            <button type="button" className="prestige-btn danger" onClick={resetSave}>
              Evet, sıfırla
            </button>
            <button type="button" className="ghost" onClick={() => setConfirmReset(false)}>
              Vazgeç
            </button>
          </div>
        ) : (
          <button type="button" className="ghost" onClick={() => setConfirmReset(true)}>
            Sıfırla
          </button>
        )}
      </div>

      {message && <div className="panel-note subtle">{message}</div>}

      <div className="collection-head">
        Otomatik yedekler (saatlik, son 48) ·{' '}
        <button type="button" className="link-btn" onClick={loadBackups}>
          yenile
        </button>
      </div>

      {backups === null && <div className="panel-note subtle">Yükleniyor…</div>}
      {backups?.length === 0 && (
        <div className="panel-note subtle">
          Henüz yedek yok — oyun kaydettikçe saatte bir otomatik alınır.
        </div>
      )}
      {backups?.map((b) => (
        <div className="row" key={b.id}>
          <span className="row-emoji">🗄️</span>
          <div className="row-info">
            <div className="row-name">
              {new Date(b.created_at).toLocaleString('tr-TR', {
                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
              })}
            </div>
            <div className="row-sub">
              Bölge {b.stage} · rekor {b.highest} · 🪙 {fmt(Number(b.gold))} · 💎{' '}
              {fmt(Number(b.crystals))}
            </div>
          </div>
          {confirmRestore === b.id ? (
            <div className="confirm-buttons">
              <button
                type="button"
                className="prestige-btn danger"
                onClick={() => restoreBackup(b.id)}
              >
                Evet
              </button>
              <button type="button" className="ghost" onClick={() => setConfirmRestore(null)}>
                Vazgeç
              </button>
            </div>
          ) : (
            <button type="button" className="ghost" onClick={() => setConfirmRestore(b.id)}>
              Geri Yükle
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
