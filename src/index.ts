import debug from 'debug';
import retry from 'promise-retry';

import { checkSignatures } from './check-signature';
import { isNotaryToolAvailable, notarizeAndWaitForNotaryTool } from './notarytool';
import { stapleApp } from './staple';
import { NotarizeOptions } from './types';

const d = debug('electron-notarize');

export { NotarizeOptions };

export { validateNotaryToolAuthorizationArgs as validateAuthorizationArgs } from './validate-args';

/**
 * Sends your app to Apple for notarization with `notarytool` and staples a successful
 * notarization result to the app bundle. This includes your {@link NotaryToolNotarizeAppOptions.appPath | appPath}
 * as well as one of three valid credential authentication strategies.
 *
 * See {@link NotaryToolCredentials} for authentication options.
 *
 * @category Core
 * @param args Options for notarization
 * @returns The Promise resolves once notarization is complete. Note that this may take a few minutes.
 */
async function notarize(args: NotarizeOptions): Promise<void>;

async function notarize({ appPath, ...otherOptions }: NotarizeOptions) {
  await checkSignatures({ appPath });

  d('notarizing using notarytool');
  if (!(await isNotaryToolAvailable())) {
    throw new Error(
      'notarytool is not available, you must be on at least Xcode 13 or provide notarytoolPath',
    );
  }

  await notarizeAndWaitForNotaryTool({
    appPath,
    ...otherOptions,
  } as NotarizeOptions);

  await retry(() => stapleApp({ appPath }), {
    retries: 3,
  });
}

export { notarize };
