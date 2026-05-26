import { IIdentifyStrategy, IdentifyResult } from './IdentifyStrategy';

export class AuddStrategy implements IIdentifyStrategy<string> {
  async execute(audioBase64: string, authContext: { accessToken?: string }): Promise<IdentifyResult> {
    if (!authContext.accessToken) {
      return {
        type: 'error',
        errorMessage: 'Session expired. Please log in again.',
      };
    }

    try {
      const res = await fetch('/api/identify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authContext.accessToken}`,
        },
        body: JSON.stringify({ audio: audioBase64 }),
      });

      const data = await res.json();

      if (!res.ok) {
        return {
          type: 'error',
          errorMessage: data.error || 'Identification failed.',
        };
      }

      if (data.match) {
        return {
          type: 'match',
          match: data.match,
          rawMatch: data.raw || null,
        };
      } else {
        return {
          type: 'no-match',
          rawMatch: data.raw || null,
        };
      }
    } catch (error) {
      return {
        type: 'error',
        errorMessage: 'Network error. Please check your connection.',
      };
    }
  }
}
