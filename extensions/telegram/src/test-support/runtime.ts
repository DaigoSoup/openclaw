import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { TelegramRuntime } from "../runtime.types.js";

const runtimeStore = createPluginRuntimeStore<TelegramRuntime>({
  pluginId: "telegram",
  errorMessage: "Telegram runtime not initialized",
});

export function clearTelegramRuntime() {
  runtimeStore.clearRuntime();
}
