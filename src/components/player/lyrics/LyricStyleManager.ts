import { Transition } from 'framer-motion';

export class LyricStyleManager {
  /* ── Apple Music style: uniform font size, no zoom/scale on active line ── */
  private static readonly UNIFORM_FONT = 'clamp(26px, 3vw, 34px)';

  static getLineStyle(index: number, activeIndex: number, isUserScrolling: boolean = false, isPlaceholder: boolean = false) {
    const dist = Math.abs(index - activeIndex);
    const isActive = index === activeIndex;

    if (isPlaceholder && !isActive && !isUserScrolling) {
      return {
        fontSize: this.UNIFORM_FONT,
        color: 'rgba(255,255,255,0)',
        filter: 'blur(0px)',
        scale: 1,
        opacity: 0,
        textShadow: 'none',
        y: 0,
      };
    }

    if (isActive) {
      return {
        fontSize: this.UNIFORM_FONT,
        color: 'rgba(255,255,255,0.97)',
        filter: 'blur(0px)',
        scale: 1,
        opacity: 1,
        textShadow: '0 0 20px rgba(255,255,255,0.10)',
        y: 0,
      };
    }

    if (isUserScrolling) {
      // Show all lyrics clearly when scrolling
      return {
        fontSize: this.UNIFORM_FONT,
        color: 'rgba(255,255,255,0.40)',
        filter: 'blur(0px)',
        scale: 1,
        opacity: 0.50,
        textShadow: '0 0 0px rgba(255,255,255,0)',
        y: 0,
      };
    }

    if (index < activeIndex) {
      // Past lyrics: fade out completely
      return {
        fontSize: this.UNIFORM_FONT,
        color: 'rgba(255,255,255,0)',
        filter: 'blur(2px)',
        scale: 1,
        opacity: 0,
        textShadow: '0 0 0px rgba(255,255,255,0)',
        y: -10, // slight upward movement on fade out
      };
    }

    if (dist === 1) {
      return {
        fontSize: this.UNIFORM_FONT,
        color: 'rgba(255,255,255,0.30)',
        filter: 'blur(0px)',
        scale: 1,
        opacity: 0.50,
        textShadow: '0 0 0px rgba(255,255,255,0)',
        y: 0,
      };
    }
    if (dist === 2) {
      return {
        fontSize: this.UNIFORM_FONT,
        color: 'rgba(255,255,255,0.18)',
        filter: 'blur(0.3px)',
        scale: 1,
        opacity: 0.35,
        textShadow: '0 0 0px rgba(255,255,255,0)',
        y: 0,
      };
    }
    if (dist === 3) {
      return {
        fontSize: this.UNIFORM_FONT,
        color: 'rgba(255,255,255,0.10)',
        filter: 'blur(0.6px)',
        scale: 1,
        opacity: 0.22,
        textShadow: '0 0 0px rgba(255,255,255,0)',
        y: 0,
      };
    }
    return {
      fontSize: this.UNIFORM_FONT,
      color: 'rgba(255,255,255,0.06)',
      filter: 'blur(1px)',
      scale: 1,
      opacity: 0.12,
      textShadow: '0 0 0px rgba(255,255,255,0)',
      y: 0,
    };
  }

  static getRomanizationStyle(index: number, activeIndex: number, lineStyleOpacity: number, lineStyleFilter: string, isUserScrolling: boolean = false) {
    const isActive = index === activeIndex;

    if (index < activeIndex && !isUserScrolling) {
      return {
        fontSize: 'clamp(13px, 1.5vw, 17px)',
        color: 'rgba(255,255,255,0)',
        opacity: 0,
        filter: 'blur(2px)',
      };
    }

    return {
      fontSize: 'clamp(13px, 1.5vw, 17px)',
      color: isActive
        ? 'rgba(255,255,255,0.55)'
        : (isUserScrolling ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.18)'),
      opacity: lineStyleOpacity,
      filter: lineStyleFilter,
    };
  }

  static getLineTransition(): Transition {
    return {
      type: 'spring',
      stiffness: 120,
      damping: 20,
      mass: 0.8,
      filter: { type: 'tween', duration: 0.45, ease: [0.4, 0, 0.2, 1] },
      textShadow: { type: 'tween', duration: 0.55, ease: [0.4, 0, 0.2, 1] },
      color: { type: 'tween', duration: 0.4, ease: [0.4, 0, 0.2, 1] },
    };
  }

  static getRomanizationTransition(): Transition {
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
      fontSize: '18px',
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
      fontSize: '12px',
      color: isActive
        ? 'rgba(255,255,255,0.45)'
        : dist === 1
        ? 'rgba(255,255,255,0.15)'
        : 'rgba(255,255,255,0.06)',
      opacity: Number(lineOpacity) || 1,
    };
  }
}
