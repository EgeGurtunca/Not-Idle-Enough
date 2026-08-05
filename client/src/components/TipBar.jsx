import { useGameStore, selectors } from '../store/gameStore.js';
import { NPCS, PRESTIGE_STAGE, TRANSCEND_STAGE, REALM_STAGE } from '../game/constants.js';
import { killsRequired, npcLevelCost } from '../game/formulas.js';
import { useT } from '../game/i18n.js';

// Yeni oyuncu yönlendirmesi. Betikli bir tur değil: her ipucunun kendi koşulu var,
// oyun durumu koşulu sağladığında beliriyor. Kapatılan bir daha çıkmıyor (kayda yazılır).
// Sıra önemli — ilk uyan tek ipucu gösterilir.
const TIPS = [
  {
    id: 'click',
    when: (s) => s.stats.totalClicks < 8,
  },
  {
    id: 'hire',
    when: (s) =>
      Object.keys(s.npcLevels).length === 0 && s.gold >= npcLevelCost(NPCS[0], 0),
  },
  {
    id: 'boss',
    when: (s) => s.mode === 'farm' && s.kills >= killsRequired(s.prestigeLevels),
  },
  {
    id: 'prestige',
    when: (s) => s.totalPrestiges === 0 && s.runHighestStage >= PRESTIGE_STAGE,
  },
  {
    id: 'transcend',
    when: (s) => s.totalTranscends === 0 && s.highestStage >= TRANSCEND_STAGE,
  },
  {
    id: 'realm',
    when: (s) => s.realm === 1 && s.highestStage >= REALM_STAGE,
  },
];

export default function TipBar() {
  // Seçici PRİMİTİF (ipucu id'si) döndürür: oyun döngüsü her 100ms state yazsa bile
  // bileşen yalnızca gösterilecek ipucu değiştiğinde yeniden çizilir.
  // Tüm store'a abone olunca saniyede ~10 kez boşuna render oluyordu.
  const tipId = useGameStore((s) => TIPS.find((x) => !s.tips[x.id] && x.when(s))?.id ?? null);
  const dismissTip = useGameStore((s) => s.dismissTip);
  const { t } = useT();

  if (!tipId) return null;
  const tip = { id: tipId };

  return (
    <div className="tipbar" role="status">
      <span className="tipbar-mark">💡</span>
      <span className="tipbar-text">{t(`tip_${tip.id}`)}</span>
      <button
        type="button"
        className="tipbar-close"
        onClick={() => dismissTip(tip.id)}
        aria-label={t('tip_dismiss')}
        title={t('tip_dismiss')}
      >
        ✕
      </button>
    </div>
  );
}
