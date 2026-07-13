// Telegram plugin module owns topic-name cache process state and storage access.
import { getTelegramRuntime } from "./runtime.js";

export type TelegramTopicEntry = {
  name: string;
  iconColor?: number;
  iconCustomEmojiId?: string;
  closed?: boolean;
  updatedAt: number;
};

type TopicNameStore = Map<string, TelegramTopicEntry>;

export type TelegramTopicNamePersistentStore = {
  register(key: string, value: TelegramTopicEntry): Promise<void>;
  entries(): Promise<Array<{ key: string; value: TelegramTopicEntry }>>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
};

export type TelegramTopicNameStoreState = {
  lastUpdatedAt: number;
  store: TopicNameStore;
  hydrated: boolean;
  hydratePromise?: Promise<void>;
  persistentStore: TelegramTopicNamePersistentStore;
};

type TopicNameCacheState = {
  stores: Map<string, TelegramTopicNameStoreState>;
};

const TOPIC_NAME_CACHE_STATE_KEY = Symbol.for("openclaw.telegramTopicNameCacheState");
export const TELEGRAM_TOPIC_NAME_CACHE_MAX_ENTRIES = 2_048;

export const telegramTopicNameCacheBackend = {
  openPersistentStore(namespace: string): TelegramTopicNamePersistentStore {
    return getTelegramRuntime().state.openKeyedStore<TelegramTopicEntry>({
      namespace,
      maxEntries: TELEGRAM_TOPIC_NAME_CACHE_MAX_ENTRIES,
    });
  },
};

export function getTelegramTopicNameCacheState(): TopicNameCacheState {
  const globalStore = globalThis as Record<PropertyKey, unknown>;
  const existing = globalStore[TOPIC_NAME_CACHE_STATE_KEY] as TopicNameCacheState | undefined;
  if (existing) {
    return existing;
  }
  const state: TopicNameCacheState = { stores: new Map() };
  globalStore[TOPIC_NAME_CACHE_STATE_KEY] = state;
  return state;
}
