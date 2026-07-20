import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { fmt } from '../utils/format.js';

// ponytail: oturum-içi, panel açıkken örnekler (tab değişince sıfırlanır); persist yok
export default function StatsGraph() {
  const [samples, setSamples] = useState([]);
  const lastGold = useRef(null);

  useEffect(() => {
    const iv = setInterval(() => {
      const g = useGameStore.getState().stats.totalGoldEarned;
      if (lastGold.current != null) {
        setSamples((s) => [...s.slice(-59), Math.max(0, g - lastGold.current)]);
      }
      lastGold.current = g;
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  if (samples.length < 2) {
    return <div className="panel-note subtle">📈 Altın/sn grafiği toplanıyor…</div>;
  }
  const max = Math.max(...samples, 1);
  const W = 100;
  const H = 34;
  const pts = samples.map((v, i) => `${(i / (samples.length - 1)) * W},${H - (v / max) * H}`).join(' ');
  return (
    <div className="stats-graph">
      <div className="stats-graph-head">📈 Altın/sn · şu an {fmt(samples[samples.length - 1])}</div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="spark">
        <polyline points={pts} />
      </svg>
    </div>
  );
}
