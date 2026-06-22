export type LyricsFontSizeSetting = 'small' | 'medium' | 'large';

export class LyricStyleManager {
  /* ── Apple Music style: uniform font size, no zoom/scale on active line ── */
  private static readonly FONT_SIZES: Record<LyricsFontSizeSetting, string> = {
    small:  'clamp(1.15rem, 2.8vw, 1.8rem)',
    medium: 'clamp(1.5rem, 3.8vw, 2.4rem)',
    large:  'clamp(1.85rem, 4.8vw, 3rem)',
  };

  private static readonly SIDEBAR_FONT_SIZES: Record<LyricsFontSizeSetting, string> = {
    small:  '15px',
    medium: '18px',
    large:  '22px',
  };

  private static readonly ROMAN_FONT_SIZES: Record<LyricsFontSizeSetting, string> = {
    small:  'clamp(11px, 1.2vw, 14px)',
    medium: 'clamp(13px, 1.5vw, 17px)',
    large:  'clamp(15px, 1.8vw, 20px)',
  };

  private static readonly SIDEBAR_ROMAN_SIZES: Record<LyricsFontSizeSetting, string> = {
    small:  '10px',
    medium: '12px',
    large:  '15px',
  };

  private static _fontSize: LyricsFontSizeSetting = 'medium';

  static setFontSize(size: LyricsFontSizeSetting) {
    this._fontSize = size;
  }

  private static get UNIFORM_FONT() {
    return this.FONT_SIZES[this._fontSize];
  }

  private static readonly DIM = 0.28;

  static getLineStyle(index: number, activeIndex: number, isUserScrolling: boolean = false, isPlaceholder: boolean = false) {
    const isActive = index === activeIndex;
    const isPast = index < activeIndex;
    const dist = Math.abs(index - activeIndex);

    // When scrolling, ALL lines become uniformly visible and unblurred
    if (isUserScrolling) {
      return {
        fontSize: this.UNIFORM_FONT,
        color: '#fff',
        opacity: isActive ? 1 : 0.5,
        scale: isActive ? 1 : 0.955,
        y: 0,
        filter: 'blur(0px)',
      };
    }

    // --- NORMAL PLAYBACK (Not Scrolling) ---

    if (isActive) {
      return {
        fontSize: this.UNIFORM_FONT,
        color: '#fff',
        opacity: 1,
        scale: 1,
        y: 0,
        filter: 'blur(0px)',
      };
    }

    // Past lyrics immediately disappear during playback
    if (isPast) {
      return {
        fontSize: this.UNIFORM_FONT,
        color: '#fff',
        opacity: 0,
        scale: 0.955,
        y: 0,
        filter: 'blur(2px)',
      };
    }

    // Future lines get progressively dimmed and blurred based on distance
    let futureOpacity = this.DIM;
    let futureBlur = 'blur(1px)';
    
    if (dist === 1) {
      futureOpacity = 0.4;
      futureBlur = 'blur(1.5px)';
    } else if (dist === 2) {
      futureOpacity = 0.2;
      futureBlur = 'blur(3px)';
    } else if (dist >= 3) {
      futureOpacity = 0.08;
      futureBlur = 'blur(5px)';
    }

    return {
      fontSize: this.UNIFORM_FONT,
      color: '#fff',
      opacity: futureOpacity,
      scale: 0.955,
      y: 0,
      filter: futureBlur,
    };
  }

  static getRomanizationStyle(index: number, activeIndex: number, lineStyleOpacity: number, lineStyleFilter: string, isUserScrolling: boolean = false) {
    const isActive = index === activeIndex;

    if (index < activeIndex && !isUserScrolling) {
      return {
        fontSize: this.ROMAN_FONT_SIZES[this._fontSize],
        color: 'rgba(255,255,255,0)',
        opacity: 0,
        filter: 'blur(2px)',
      };
    }

    return {
      fontSize: this.ROMAN_FONT_SIZES[this._fontSize],
      color: isActive
        ? 'rgba(255,255,255,0.55)'
        : (isUserScrolling ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.18)'),
      opacity: lineStyleOpacity,
      filter: lineStyleFilter,
    };
  }

  static getLineTransition(): import('framer-motion').Transition {
    return {
      opacity: { type: 'tween', duration: 0.45, ease: [0.4, 0, 0.2, 1] },
      scale: { type: 'tween', duration: 0.55, ease: [0.34, 1.4, 0.5, 1] },
      color: { type: 'tween', duration: 0.4, ease: [0.4, 0, 0.2, 1] },
    };
  }

  static getRomanizationTransition(): import('framer-motion').Transition {
    return {
      type: 'tween',
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    };
  }

  /* ── Sidebar Styles (Standard CSS instead of Framer Motion) ── */
  static getSidebarLineStyle(index: number, activeIndex: number): React.CSSProperties {
    const dist = Math.abs(index - activeIndex);
    const isActive = index === activeIndex;

    const base: React.CSSProperties = {
      fontSize: this.SIDEBAR_FONT_SIZES[this._fontSize],
      fontWeight: 700,
      transform: 'scale(1)',
    };

    if (isActive) {
      return { ...base, color: 'rgba(255,255,255,1)', opacity: 1, filter: 'blur(0px)' };
    }
    if (dist === 1) {
      return { ...base, color: 'rgba(255,255,255,0.28)', opacity: 0.55, filter: 'blur(0px)' };
    }
    if (dist <= 3) {
      return { ...base, color: 'rgba(255,255,255,0.15)', opacity: 0.35, filter: 'blur(0.3px)' };
    }
    return { ...base, color: 'rgba(255,255,255,0.07)', opacity: 0.18, filter: 'blur(0.6px)' };
  }

  static getSidebarRomanizationStyle(index: number, activeIndex: number, lineOpacity: number | string | undefined): React.CSSProperties {
    const dist = Math.abs(index - activeIndex);
    const isActive = index === activeIndex;
    
    return {
      fontSize: this.SIDEBAR_ROMAN_SIZES[this._fontSize],
      color: isActive
        ? 'rgba(255,255,255,0.45)'
        : dist === 1
        ? 'rgba(255,255,255,0.15)'
        : 'rgba(255,255,255,0.06)',
      opacity: Number(lineOpacity) || 1,
    };
  }
}
