import {
  readConnectErrorDetailCode,
  shouldPauseGatewayReconnect,
} from "@openclaw/gateway-client/browser";

export function resolveGatewayErrorDetailCode(
  error: { details?: unknown } | null | undefined,
): string | null {
  return readConnectErrorDetailCode(error?.details);
}

/**
 * Connect failures that cannot recover while client and server state stay unchanged.
 * AUTH_TOKEN_MISMATCH stays out: the close handler owns its bounded cached-token retry.
 */
export function isNonRecoverableConnectError(error: { details?: unknown } | undefined): boolean {
  if (!error) {
    return false;
  }
  return shouldPauseGatewayReconnect({
    details: error.details,
    protocolMismatchIsTerminal: true,
  });
}
