import debug from 'debug';
import path from 'node:path';

import { spawn } from './spawn.js';
import { makeSecret, withTempDir } from './helpers.js';
import {
  validateNotaryToolAuthorizationArgs,
  isNotaryToolPasswordCredentials,
  isNotaryToolApiKeyCredentials,
} from './validate-args.js';
import { NotarizeOptions, NotaryToolCredentials } from './types.js';

const d = debug('electron-notarize:notarytool');

function runNotaryTool(args: string[], notarytoolPath?: string) {
  const useXcrun = notarytoolPath === undefined;
  const cmd = useXcrun ? 'xcrun' : notarytoolPath;
  return spawn(cmd, useXcrun ? ['notarytool', ...args] : args);
}

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
    // --issuer is an optional argument as it must not be provided if using an Individual key; Individual keys can only be used with Xcode 26+
    if (opts.appleApiIssuer) {
      return [
        '--key',
        makeSecret(opts.appleApiKey),
        '--key-id',
        makeSecret(opts.appleApiKeyId),
        '--issuer',
        makeSecret(opts.appleApiIssuer),
      ];
    }
    return ['--key', makeSecret(opts.appleApiKey), '--key-id', makeSecret(opts.appleApiKeyId)];
  } else {
    // --keychain is optional -- when not specified, the iCloud keychain is used by notarytool
    if (opts.keychain) {
      return ['--keychain', opts.keychain, '--keychain-profile', opts.keychainProfile];
    }
    return ['--keychain-profile', opts.keychainProfile];
  }
}

async function getNotarizationLogs(opts: NotarizeOptions, id: string) {
  try {
    const logResult = await runNotaryTool(
      ['log', id, ...authorizationArgs(opts)],
      opts.notarytoolPath,
    );
    d('notarization log', logResult.output);
    return logResult.output;
  } catch (e) {
    d('failed to pull notarization logs', e);
  }
}

function parseNotarytoolOutput(output: string): any {
  const rawOut = output.trim();

  let jsonOut: string = '';

  for (const line of rawOut.split('\n')) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('{') && trimmedLine.endsWith('}')) {
      jsonOut = line;
      break;
    }
  }

  d('notarytool produced output:\n', output);

  let parsed: any;
  try {
    parsed = JSON.parse(jsonOut);
  } catch (err) {
    throw new Error(`Could not parse notarytool output: \n\n${rawOut}`);
  }

  return parsed;
}

export async function isNotaryToolAvailable(notarytoolPath?: string) {
  if (notarytoolPath !== undefined) {
    const result = await spawn(notarytoolPath, ['--version']);
    return result.code === 0;
  } else {
    const result = await spawn('xcrun', ['--find', 'notarytool']);
    return result.code === 0;
  }
}

export async function notarizeAndWaitForNotaryTool(opts: NotarizeOptions) {
  d('starting notarize process for app:', opts.appPath);
  return await withTempDir(async (dir) => {
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
        ['-c', '-k', '--sequesterRsrc', '--keepParent', path.basename(opts.appPath), filePath],
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
    }

    const notarizeArgs = [
      'submit',
      filePath,
      ...authorizationArgs(opts),
      '--wait',
      '--output-format',
      'json',
    ];

    const result = await runNotaryTool(notarizeArgs, opts.notarytoolPath);

    const parsed = parseNotarytoolOutput(result.output);

    let logOutput: undefined | string;
    if (typeof parsed.id === 'string') {
      logOutput = await getNotarizationLogs(opts, parsed.id);
    }

    if (result.code === 0 && parsed.status === 'Accepted') {
      d(`notarization success (id: ${parsed.id})`);
      return;
    }

    let message = `Failed to notarize via notarytool\n\n${result.output}`;
    if (logOutput) {
      message += `\n\nDiagnostics from notarytool log: ${logOutput}`;
    }
    throw new Error(message);
  });
}
