import debug from 'debug';
import * as path from 'path';

import { spawn } from './spawn';
import { makeSecret, withTempDir } from './helpers';
import {
  validateNotaryToolAuthorizationArgs,
  isNotaryToolPasswordCredentials,
  isNotaryToolApiKeyCredentials,
} from './validate-args';
import { NotaryToolCredentials, NotaryToolStartOptions } from './types';

const d = debug('electron-notarize:notarytool');

function authorizationArgs(rawOpts: NotaryToolCredentials): string[] {
  const opts = validateNotaryToolAuthorizationArgs(rawOpts);
  if (isNotaryToolPasswordCredentials(opts)) {
    return [
      '--apple-id',
      makeSecret(opts.appleId),
      '--password',
      makeSecret(opts.appleIdPassword),
      '--team-id',
      makeSecret(opts.teamId),
    ];
  } else if (isNotaryToolApiKeyCredentials(opts)) {
    return [
      '--key',
      makeSecret(opts.appleApiKey),
      '--key-id',
      makeSecret(opts.appleApiKeyId),
      '--issuer',
      makeSecret(opts.appleApiIssuer),
    ];
  } else {
    // --keychain is optional -- when not specified, the iCloud keychain is used by notarytool
    if (opts.keychain) {
      return ['--keychain', opts.keychain, '--keychain-profile', opts.keychainProfile];
    }
    return ['--keychain-profile', opts.keychainProfile];
  }
}

export async function isNotaryToolAvailable() {
  const result = await spawn('xcrun', ['--find', 'notarytool']);
  return result.code === 0;
}

export async function notarizeAndWaitForNotaryTool(opts: NotaryToolStartOptions) {
  d('starting notarize process for app:', opts.appPath);
  return await withTempDir(async dir => {
    const fileExt = path.extname(opts.appPath);
    let filePath;
    if (fileExt === '.dmg' || fileExt === '.pkg') {
      filePath = path.resolve(dir, opts.appPath);
      d('attempting to upload file to Apple: ', filePath);
    } else {
      filePath = path.resolve(dir, `${path.parse(opts.appPath).name}.zip`);
      d('zipping application to:', filePath);
      const zipResult = await spawn(
        'ditto',
        ['-c', '-k', '--sequesterRsrc', '--keepParent', opts.appPath, filePath],
      );
      if (zipResult.code !== 0) {
        throw new Error(
          `Failed to zip application, exited with code: ${zipResult.code}\n\n${zipResult.output}`,
        );
      }
      d('zip succeeded, attempting to upload to Apple');
    }

    const notarizeArgs = [
      'notarytool',
      'submit',
      filePath,
      ...authorizationArgs(opts),
      '--wait',
      '--output-format',
      'json',
    ];

    const result = await spawn('xcrun', notarizeArgs);
    const parsed = JSON.parse(result.output.trim());

    if (result.code !== 0 || !parsed.status || parsed.status !== 'Accepted') {
      try {
        if (parsed && parsed.id) {
          const logResult = await spawn('xcrun', [
            'notarytool',
            'log',
            parsed.id,
            ...authorizationArgs(opts),
          ]);
          d('notarization log', logResult.output);
        }
      } catch (e) {
        d('failed to pull notarization logs', e);
      }
      throw new Error(`Failed to notarize via notarytool\n\n${result.output}`);
    }
    d('notarization success');
  });
}
