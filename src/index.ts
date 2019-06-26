import * as debug from 'debug';
import * as path from 'path';

import { spawn } from './spawn';
import { withTempDir, makeSecret, parseNotarizationInfo, zipApp } from './helpers';

const d = debug('electron-notarize');

export interface NotarizeCredentials {
  appleId: string;
  appleIdPassword: string;
}

export interface NotarizeAppOptions {
  appPath: string;
  appBundleId: string;
}

export interface TransporterOptions {
  ascProvider?: string;
}

export interface NotarizeResult {
  uuid: string;
}

export type NotarizeStartOptions = NotarizeAppOptions & NotarizeCredentials & TransporterOptions;
export type NotarizeWaitOptions = NotarizeResult & NotarizeCredentials;
export type NotarizeStapleOptions = Pick<NotarizeAppOptions, 'appPath'>;
export type NotarizeOptions = NotarizeStartOptions;

export async function startNotarize(opts: NotarizeStartOptions): Promise<NotarizeResult> {
  d('starting notarize process for app:', opts.appPath);
  var appPath = opts.appPath;
  return await withTempDir<NotarizeResult>(async (dir) => {
  //zip the app unless it is dmg
  if ( !opts.appPath.endsWith(`.dmg`) ){
    appPath = await zipApp(dir, opts.appPath);
  }
    const notarizeArgs = [
      'altool',
      '--notarize-app',
      '-f',
      appPath,
      '--primary-bundle-id',
      opts.appBundleId,
      '-u',
      makeSecret(opts.appleId),
      '-p',
      makeSecret(opts.appleIdPassword),
    ];

    if (opts.ascProvider) {
      notarizeArgs.push('-itc_provider', opts.ascProvider);
    }

    const result = await spawn(
      'xcrun',
      notarizeArgs,
    );
    if (result.code !== 0) {
      throw new Error(`Failed to upload app to Apples notarization servers\n\n${result.output}`);
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

export async function waitForNotarize(opts: NotarizeWaitOptions): Promise<void> {
  d('checking notarization status:', opts.uuid);
  const result = await spawn(
    'xcrun',
    [
      'altool',
      '--notarization-info',
      opts.uuid,
      '-u',
      makeSecret(opts.appleId),
      '-p',
      makeSecret(opts.appleIdPassword),
    ],
  );
  if (result.code !== 0) {
    throw new Error(`Failed to check status of notarization request: ${opts.uuid}\n\n${result.output}`);
  }
  const notarizationInfo = parseNotarizationInfo(result.output);

  if (notarizationInfo.status === 'in progress') {
    d('still in progress, waiting 30 seconds');
    await delay(30000);
    return waitForNotarize(opts);
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

export async function stapleApp(opts: NotarizeStapleOptions): Promise<void> {
  d('attempting to staple app:', opts.appPath);
  const result = await spawn(
    'xcrun',
    [
      'stapler',
      'staple',
      '-v',
      path.basename(opts.appPath),
    ],
    {
      cwd: path.dirname(opts.appPath),
    },
  );

  if (result.code !== 0) {
    throw new Error(`Failed to staple your application with code: ${result.code}\n\n${result.output}`);
  }

  d('staple succeeded');
  return;
}

export async function notarize({
  appBundleId,
  appPath,
  appleId,
  appleIdPassword,
  ascProvider,
}: NotarizeOptions) {
  const { uuid } = await startNotarize({
    appBundleId,
    appPath,
    appleId,
    appleIdPassword,
    ascProvider,
  });
  /**
   * Wait for Apples API to initialize the status UUID
   *
   * If we start checking too quickly the UUID is not ready yet
   * and this step will fail.  It takes apple a number of minutes
   * to actually complete the job so an extra 10 second delay here
   * is not a big deal
   */
  d('notarization started, waiting for 10 seconds before pinging apple for status');
  await delay(10000);
  d('starting to poll for notarization status');
  await waitForNotarize({ uuid, appleId, appleIdPassword });
  await stapleApp({ appPath });
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
