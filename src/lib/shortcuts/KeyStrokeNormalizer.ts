
export class KeyStrokeNormalizer {

  public static normalizeEvent(e: KeyboardEvent): string {
    if (e.code === 'Space' || e.key === ' ') {
      return 'Space';
    }
    if (e.key === 'Escape' || e.code === 'Escape') {
      return 'Escape';
    }
    if (e.code === 'ArrowRight') {
      return 'ArrowRight';
    }
    if (e.code === 'ArrowLeft') {
      return 'ArrowLeft';
    }
    if (e.code === 'ArrowUp') {
      return 'ArrowUp';
    }
    if (e.code === 'ArrowDown') {
      return 'ArrowDown';
    }

    if (e.key && e.key.length === 1) {
      return e.key.toLowerCase();
    }

    return e.key || e.code;
  }
  public static formatDisplay(key: string | undefined): string {
    if (!key) return '-';
    const lower = key.trim().toLowerCase();

    if (lower === 'space' || lower === ' ') return 'Space ␣';
    if (lower === 'escape' || lower === 'esc') return 'Esc';
    if (lower === 'arrowright') return '→ ArrowRight';
    if (lower === 'arrowleft') return '← ArrowLeft';
    if (lower === 'arrowup') return '↑ ArrowUp';
    if (lower === 'arrowdown') return '↓ ArrowDown';

    return key.toUpperCase();
  }

  public static isTypingTarget(e: KeyboardEvent): boolean {
    const target = e.target as HTMLElement | null;
    const activeElement = typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null;

    return Boolean(
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target?.isContentEditable ||
      target?.getAttribute('role') === 'textbox' ||
      activeElement instanceof HTMLInputElement ||
      activeElement instanceof HTMLTextAreaElement ||
      activeElement?.isContentEditable ||
      activeElement?.getAttribute('role') === 'textbox'
    );
  }

  public static matches(e: KeyboardEvent, targetKey: string | undefined): boolean {
    if (!targetKey) return false;
    const target = targetKey.trim().toLowerCase();

    if (target === 'space' || target === ' ') {
      return e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar';
    }

    if (target === 'escape' || target === 'esc') {
      return e.key === 'Escape' || e.code === 'Escape';
    }
    if (target === 'arrowright' || target === 'right') {
      return e.code === 'ArrowRight' || e.key === 'ArrowRight';
    }
    if (target === 'arrowleft' || target === 'left') {
      return e.code === 'ArrowLeft' || e.key === 'ArrowLeft';
    }
    if (target === 'arrowup' || target === 'up') {
      return e.code === 'ArrowUp' || e.key === 'ArrowUp';
    }
    if (target === 'arrowdown' || target === 'down') {
      return e.code === 'ArrowDown' || e.key === 'ArrowDown';
    }

    const pressedKey = e.key.toLowerCase();
    const pressedCode = e.code.toLowerCase();

    if (pressedKey === target) return true;
    if (pressedCode === `key${target}`) return true;
    if (pressedCode === target) return true;

    return false;
  }
}
