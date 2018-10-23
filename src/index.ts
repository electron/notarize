import * as debug from 'debug';
import * as path from 'path';

import { spawn } from './spawn';
import { withTempDir, makeSecret, parseNotarizationInfo } from './helpers';

const d = debug('electron-notarize');

export interface NotarizeCredentials {
  appleId: string;
  appleIdPassword: string;
}

export interface NotarizeAppOptions {
  appPath: string;
  appBundleId: string;
}

export interface NotarizeResult {
  uuid: string;
}

export type NotarizeStartOptions = NotarizeAppOptions & NotarizeCredentials;
export type NotarizeWaitOptions = NotarizeResult & NotarizeCredentials;
export type NotarizeStapleOptions = Pick<NotarizeAppOptions, 'appPath'>

export async function startNotarize(opts: NotarizeStartOptions): Promise<NotarizeResult> {
  d('starting notarize process for app:', opts.appPath);
  return await withTempDir<NotarizeResult>(async (dir) => {
    const zipPath = path.resolve(dir, `${path.basename(opts.appleIdPassword, '.app')}.zip`);
    d('zipping application to:', zipPath);
    const zipResult = await spawn(
      'zip',
      [
        '-r',
        '-y',
        zipPath,
        path.basename(opts.appPath),
      ],
      {
        cwd: path.dirname(opts.appPath),
      },
    );
    if (zipResult.code !== 0) {
      throw new Error(`Failed to zip application, exited with code: ${zipResult.code}\n\n${zipResult.output}`);
    }
    d('zip succeeded, attempting to upload to apple');

    const result = await spawn(
      'xcrun',
      [
        'altool',
        '--notarize-app',
        '-f',
        zipPath,
        '--primary-bundle-id',
        opts.appBundleId,
        '-u',
        makeSecret(opts.appleId),
        '-p',
        makeSecret(opts.appleIdPassword),
      ],
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
    await new Promise(r => setTimeout(r, 30000));
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
