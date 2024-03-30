import debug from 'debug';

import {
  LegacyNotarizeStartOptions,
  LegacyNotarizeWaitOptions,
} from './types';

const d = debug('electron-notarize:legacy');

/** @deprecated */
export async function startLegacyNotarize(
  opts: LegacyNotarizeStartOptions,
): Promise<never> {
  d('starting notarize process for app:', opts.appPath);
  throw new Error("Cannot start notarization. Legacy notarization (altool) is no longer available")
}

/** @deprecated */
export async function waitForLegacyNotarize(opts: LegacyNotarizeWaitOptions): Promise<never> {
  throw new Error("Cannot wait for notarization. Legacy notarization (altool) is no longer available")
}
