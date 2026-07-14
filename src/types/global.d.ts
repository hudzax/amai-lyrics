// Global Types
declare global {
  interface Window {
    _spicy_lyrics_metadata?: unknown;
    _spicy_lyrics?: unknown;
    _spicy_lyrics_session?: unknown;
    ProcessingIndicatorTimeout?: NodeJS.Timeout | null;
  }
  type Vibrant = Promise<unknown>;
}

export {};
