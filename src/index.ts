import * as debug from 'debug';
import { delay } from './helpers';
import { startLegacyNotarize, waitForLegacyNotarize } from './legacy';
import { isNotaryToolAvailable, notarizeAndWaitForNotaryTool } from './notarytool';
import { stapleApp } from './staple';
import { NotarizeOptions } from './types';

const d = debug('electron-notarize');

export { NotarizeOptions };

export { validateLegacyAuthorizationArgs as validateAuthorizationArgs } from './validate-args';

export async function notarize({ appPath, ...otherOptions }: NotarizeOptions) {
  if (otherOptions.tool === 'notarytool') {
    d('notarizing using the new notarytool system');
    if (!(await isNotaryToolAvailable())) {
      throw new Error('notarytool is not available, you must be on at least Xcode 13');
    }

    await notarizeAndWaitForNotaryTool({
      appPath,
      ...otherOptions,
    });
  } else {
    d('notarizing using the legacy notarization system, this will be slow');
    const { uuid } = await startLegacyNotarize({
      appPath,
      ...otherOptions,
    });
    /**
     * Wait for Apples API to initialize the status UUID
     *
     * If we start checking too quickly the UUID is not ready yet
     * and this step will fail.  It takes Apple a number of minutes
     * to actually complete the job so an extra 10 second delay here
     * is not a big deal
     */
    d('notarization started, waiting for 10 seconds before pinging Apple for status');
    await delay(10000);
    d('starting to poll for notarization status');
    await waitForLegacyNotarize({ uuid, ...otherOptions });
  }

  await stapleApp({ appPath });
}
