// Telegram test support controls topic-name cache state and persistence.
import {
  getTelegramTopicNameCacheState,
  telegramTopicNameCacheBackend,
  type TelegramTopicNamePersistentStore,
} from "../topic-name-cache-state.js";

const defaultOpenPersistentStore = telegramTopicNameCacheBackend.openPersistentStore;

export function resetTopicNameCacheForTest(): void {
  getTelegramTopicNameCacheState().stores.clear();
}

export function setTelegramTopicNameStoreFactoryForTest(
  factory: ((namespace: string) => TelegramTopicNamePersistentStore) | undefined,
): void {
  telegramTopicNameCacheBackend.openPersistentStore = factory ?? defaultOpenPersistentStore;
}
