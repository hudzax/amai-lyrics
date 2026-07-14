// Interval timing constants (in seconds)
export const INTERVALS = {
  POSITION_SYNC: 0.5,
  DYNAMIC_BG_UPDATE: 1,
  SLEEP_RETRY: 0.1,
} as const;

export const RETRY_LIMITS = {
  MAX_URI_ATTEMPTS: 5,
  POST_LOAD_TIMEOUT: 2000,
  POST_LOAD_FALLBACK: 1000,
} as const;
