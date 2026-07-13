// Telegram test support unwraps spooled replay results for focused scenarios.
import { runWithTelegramSpooledReplayUpdate } from "../bot-processing-outcome.js";

export async function withTelegramSpooledReplayUpdate<T>(
  update: object,
  fn: () => Promise<T>,
): Promise<T> {
  return (await runWithTelegramSpooledReplayUpdate(update, fn)).value;
}
