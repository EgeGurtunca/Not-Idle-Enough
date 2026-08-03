import { Component } from 'react';
import { t } from '../game/i18n.js';

// Çökme ekranı store'a bağlı değil: dili doğrudan kayıttan okur, böylece store patlasa
// bile doğru dilde görünür. İlerleme tarayıcıda durduğu için yenilemek genelde yeter.
function savedLang() {
  try {
    return JSON.parse(localStorage.getItem('incrementaloth-save'))?.data?.lang ?? 'en';
  } catch {
    return 'en';
  }
}

export function CrashScreen() {
  const lang = savedLang();
  return (
    <div className="crash">
      <div className="crash-mark">⚔️</div>
      <h1>{t(lang, 'crash_title')}</h1>
      <p>{t(lang, 'crash_body')}</p>
      <button type="button" className="prestige-btn" onClick={() => window.location.reload()}>
        {t(lang, 'crash_reload')}
      </button>
    </div>
  );
}

// React'te hatayı yalnızca sınıf bileşeni yakalayabilir (hook karşılığı yok).
// İki yerde kullanılır:
//  - 3B tuvalin etrafında: WebGL yoksa/patlarsa oyun emoji ile oynanmaya devam eder
//  - App'in etrafında: başka bir çökme beyaz ekran yerine okunur bir mesaj gösterir
export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', this.props.label ?? '', error, info?.componentStack);
  }

  render() {
    if (this.state.failed) return this.props.fallback ?? null;
    return this.props.children;
  }
}
