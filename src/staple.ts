import debug from 'debug';
import path from 'node:path';

import { spawn } from './spawn.js';
import { NotaryToolNotarizeAppOptions } from './types.js';

const d = debug('electron-notarize:staple');

export async function stapleApp(opts: NotaryToolNotarizeAppOptions): Promise<void> {
  d('attempting to staple app:', opts.appPath);
  const result = await spawn('xcrun', ['stapler', 'staple', '-v', path.basename(opts.appPath)], {
    cwd: path.dirname(opts.appPath),
  });

  if (result.code !== 0) {
    throw new Error(
      `Failed to staple your application with code: ${result.code}\n\n${result.output}`,
    );
  }

  d('staple succeeded');
  return;
}
