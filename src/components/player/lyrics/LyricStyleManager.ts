import { Transition } from 'framer-motion';

export class LyricStyleManager {
  static getLineStyle(index: number, activeIndex: number) {
    const dist = Math.abs(index - activeIndex);
    const isActive = index === activeIndex;

    if (isActive) {
      return {
        fontSize: 'clamp(28px, 3.4vw, 38px)',
        color: 'rgba(255,255,255,0.97)',
        filter: 'blur(0px)',
        scale: 1,
        opacity: 1,
        textShadow: '0 0 30px rgba(255,255,255,0.15)',
        y: 0,
      };
    }
    if (dist === 1) {
      return {
        fontSize: 'clamp(24px, 2.8vw, 32px)',
        color: 'rgba(255,255,255,0.35)',
        filter: 'blur(0.4px)',
        scale: 0.97,
        opacity: 0.55,
        textShadow: '0 0 0px transparent',
        y: 0,
      };
    }
    if (dist === 2) {
      return {
        fontSize: 'clamp(22px, 2.5vw, 30px)',
        color: 'rgba(255,255,255,0.2)',
        filter: 'blur(1.2px)',
        scale: 0.96,
        opacity: 0.35,
        textShadow: '0 0 0px transparent',
        y: 0,
      };
    }
    if (dist === 3) {
      return {
        fontSize: 'clamp(20px, 2.2vw, 28px)',
        color: 'rgba(255,255,255,0.12)',
        filter: 'blur(1.8px)',
        scale: 0.95,
        opacity: 0.22,
        textShadow: '0 0 0px transparent',
        y: 0,
      };
    }
    return {
      fontSize: 'clamp(18px, 2vw, 26px)',
      color: 'rgba(255,255,255,0.06)',
      filter: 'blur(2.5px)',
      scale: 0.94,
      opacity: 0.12,
      textShadow: '0 0 0px transparent',
      y: 0,
    };
  }

  static getRomanizationStyle(index: number, activeIndex: number, lineStyleOpacity: number, lineStyleFilter: string) {
    const dist = Math.abs(index - activeIndex);
    const isActive = index === activeIndex;

    const romanFontSize = isActive
      ? 'clamp(14px, 1.6vw, 18px)'
      : dist === 1
      ? 'clamp(12px, 1.4vw, 16px)'
      : 'clamp(11px, 1.2vw, 14px)';

    return {
      fontSize: romanFontSize,
      color: isActive
        ? 'rgba(255,255,255,0.55)'
        : dist === 1
        ? 'rgba(255,255,255,0.18)'
        : 'rgba(255,255,255,0.08)',
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
}
