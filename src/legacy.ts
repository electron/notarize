import debug from 'debug';
import path from 'path';

import { spawn } from './spawn';
import { withTempDir, makeSecret, parseNotarizationInfo, delay } from './helpers';
import { validateLegacyAuthorizationArgs, isLegacyPasswordCredentials } from './validate-args';
import {
  NotarizeResult,
  LegacyNotarizeStartOptions,
  LegacyNotarizeWaitOptions,
  LegacyNotarizeCredentials,
} from './types';

const d = debug('electron-notarize:legacy');

function authorizationArgs(rawOpts: LegacyNotarizeCredentials): string[] {
  const opts = validateLegacyAuthorizationArgs(rawOpts);
  if (isLegacyPasswordCredentials(opts)) {
    return ['-u', makeSecret(opts.appleId), '-p', makeSecret(opts.appleIdPassword)];
  } else {
    return [
      '--apiKey',
      makeSecret(opts.appleApiKey),
      '--apiIssuer',
      makeSecret(opts.appleApiIssuer),
    ];
  }
}

export async function startLegacyNotarize(
  opts: LegacyNotarizeStartOptions,
): Promise<NotarizeResult> {
  d('starting notarize process for app:', opts.appPath);
  return await withTempDir<NotarizeResult>(async dir => {
    const zipPath = path.resolve(dir, `${path.basename(opts.appPath, '.app')}.zip`);
    d('zipping application to:', zipPath);
    const zipResult = await spawn(
      'ditto',
      ['-c', '-k', '--sequesterRsrc', '--keepParent', path.basename(opts.appPath), zipPath],
      {
        cwd: path.dirname(opts.appPath),
      },
    );
    if (zipResult.code !== 0) {
      throw new Error(
        `Failed to zip application, exited with code: ${zipResult.code}\n\n${zipResult.output}`,
      );
    }
    d('zip succeeded, attempting to upload to Apple');

    const notarizeArgs = [
      'altool',
      '--notarize-app',
      '-f',
      zipPath,
      '--primary-bundle-id',
      opts.appBundleId,
      ...authorizationArgs(opts),
    ];

    if (opts.ascProvider) {
      notarizeArgs.push('-itc_provider', opts.ascProvider);
    }

    const result = await spawn('xcrun', notarizeArgs);
    if (result.code !== 0) {
      throw new Error(`Failed to upload app to Apple's notarization servers\n\n${result.output}`);
    }
    d('upload success');

    const uuidMatch = /\nRequestUUID = (.+?)\n/g.exec(result.output);
    if (!uuidMatch) {
      throw new Error(`Failed to find request UUID in output:\n\n${result.output}`);
    }

    d('found UUID:', uuidMatch[1]);

    return {
      uuid: uuidMatch[1],
    };
  });
}

export async function waitForLegacyNotarize(opts: LegacyNotarizeWaitOptions): Promise<void> {
  d('checking notarization status:', opts.uuid);
  const result = await spawn('xcrun', [
    'altool',
    '--notarization-info',
    opts.uuid,
    ...authorizationArgs(opts),
  ]);
  if (result.code !== 0) {
    // These checks could fail for all sorts of reasons, including:
    //  * The status of a request isn't available as soon as the upload request returns, so
    //    it may just not be ready yet.
    //  * If using keychain password, user's mac went to sleep and keychain locked.
    //  * Regular old connectivity failure.
    d(
      `Failed to check status of notarization request, retrying in 30 seconds: ${opts.uuid}\n\n${result.output}`,
    );
    await delay(30000);
    return waitForLegacyNotarize(opts);
  }
  const notarizationInfo = parseNotarizationInfo(result.output);

  if (notarizationInfo.status === 'in progress') {
    d('still in progress, waiting 30 seconds');
    await delay(30000);
    return waitForLegacyNotarize(opts);
  }

  d('notarzation done with info:', notarizationInfo);

  if (notarizationInfo.status === 'invalid') {
    d('notarization failed');
    throw new Error(`Apple failed to notarize your application, check the logs for more info

Status Code: ${notarizationInfo.statusCode || 'No Code'}
Message: ${notarizationInfo.statusMessage || 'No Message'}
Logs: ${notarizationInfo.logFileUrl}`);
  }

  if (notarizationInfo.status !== 'success') {
    throw new Error(`Unrecognized notarization status: "${notarizationInfo.status}"`);
  }

  d('notarization was successful');
  return;
}
