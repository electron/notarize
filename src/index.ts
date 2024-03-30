import debug from 'debug';
import retry from 'promise-retry';

import { checkSignatures } from './check-signature';
import { isNotaryToolAvailable, notarizeAndWaitForNotaryTool } from './notarytool';
import { stapleApp } from './staple';
import { NotarizeOptions, NotaryToolStartOptions } from './types';

const d = debug('electron-notarize');

export { NotarizeOptions };

export { validateNotaryToolAuthorizationArgs as validateAuthorizationArgs } from './validate-args';

export async function notarize({ appPath, ...otherOptions }: NotarizeOptions) {
  if (otherOptions.tool === 'legacy') {
    throw new Error('Notarization with the legacy altool system was decommisioned as of November 2023');
  }

  await checkSignatures({ appPath });

  d('notarizing using the new notarytool system');
  if (!(await isNotaryToolAvailable())) {
    throw new Error('notarytool is not available, you must be on at least Xcode 13');
  }

  await notarizeAndWaitForNotaryTool({
    appPath,
    ...otherOptions,
  } as NotaryToolStartOptions);

  await retry(() => stapleApp({ appPath }), {
    retries: 3,
  });
}
