export class ITunesClient {
  private static readonly BASE_URL = 'https://itunes.apple.com';
  private static readonly DEFAULT_REVALIDATE = 300; // 5 minutes

  /**
   * Internal fetch helper to handle responses, error catching, and default options
   */
  public static async fetch<T>(path: string): Promise<T | null> {
    try {
      const res = await fetch(`${this.BASE_URL}${path}`, {
        next: { revalidate: this.DEFAULT_REVALIDATE },
      });
      if (!res.ok) return null;
      return (await res.json()) as T;
    } catch (err) {
      console.error(`[ITunesClient] Fetch error on ${path}:`, err);
      return null;
    }
  }

  /**
   * Helper for building query strings easily
   */
  public static buildQuery(params: Record<string, string | number | undefined>): string {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    }
    return searchParams.toString();
  }
}
