import { DeviceInfo } from '@/types/connect';

export class ConnectEngine {
  /** Detect human readable cosmetic browser label (SSR safe) */
  public static detectBrowserLabel(): string {
    if (typeof window === 'undefined') return 'Desktop · Browser';
    const ua = navigator.userAgent;
    const isMobile = /Android|iPhone|iPad|iPod|Mobi/i.test(ua) || (navigator.maxTouchPoints > 0 && window.innerWidth < 768);
    const type = isMobile ? 'HP' : 'Laptop';

    let browser = 'Chrome';
    if (/Edg/i.test(ua)) browser = 'Edge';
    else if (/Firefox/i.test(ua)) browser = 'Firefox';
    else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';

    return `${type} · ${browser}`;
  }

  /** Generate secure UUID with math fallback for HTTP Wi-Fi origins (SSR safe) */
  public static generateUUID(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /** Detect device type category (SSR safe) */
  public static detectDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    if (typeof window === 'undefined') return 'desktop';
    const ua = navigator.userAgent;
    if (/iPad/i.test(ua) || (navigator.maxTouchPoints > 1 && window.innerWidth >= 768 && window.innerWidth <= 1024)) return 'tablet';
    if (/Android|iPhone|iPod|Mobi/i.test(ua) || window.innerWidth < 768) return 'mobile';
    return 'desktop';
  }

  /** Retrieve or initialize tab session ID (SSR safe) */
  public static getOrCreateTabId(): string {
    if (typeof window === 'undefined') return '';
    let id = sessionStorage.getItem('connect_tab_id');
    if (!id) {
      id = this.generateUUID();
      sessionStorage.setItem('connect_tab_id', id);
    }
    return id;
  }

  /** Retrieve or initialize cosmetic device label (SSR safe) */
  public static getOrCreateDeviceLabel(): string {
    if (typeof window === 'undefined') return 'Desktop';
    let label = localStorage.getItem('connect_device_label');
    if (!label) {
      label = this.detectBrowserLabel();
      localStorage.setItem('connect_device_label', label);
    }
    return label;
  }

  /**
   * Lexicographic Master Election Algorithm
   * Sorts devices by tabInstanceId ascending. Smallest UUID becomes active master.
   */
  public static electActivePlayer(devices: DeviceInfo[]): string | null {
    if (!devices || devices.length === 0) return null;
    const sorted = [...devices].sort((a, b) => a.tabInstanceId.localeCompare(b.tabInstanceId));
    return sorted[0].tabInstanceId;
  }

  /**
   * Extrapolates current position for remote displays based on last sync timestamp
   */
  public static extrapolatePosition(
    basePosition: number,
    timestamp: number,
    isPlaying: boolean,
    duration: number
  ): number {
    if (!isPlaying) return basePosition;
    const elapsed = (Date.now() - timestamp) / 1000;
    return Math.min(basePosition + elapsed, duration || 9999);
  }
}
